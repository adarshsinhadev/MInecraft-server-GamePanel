const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");
const rcon = require("./rcon");

const SERVER_DIR = path.resolve(
  process.env.MINECRAFT_SERVER_DIR || "/home/anonx/minecraft-server"
);
const USER_CACHE = path.join(SERVER_DIR, "usercache.json");
const JOURNALCTL = "/usr/bin/journalctl";
const POLL_INTERVAL_MS = 30000;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{1,16}$/;

function readUserCache() {
  try {
    const cache = JSON.parse(fs.readFileSync(USER_CACHE, "utf8"));
    return Array.isArray(cache) ? cache : [];
  } catch (error) {
    console.error("[PlayerTracker] Could not read user cache:", error.message);
    return [];
  }
}

function getPlayerIdentity(username) {
  const cached = readUserCache().find(
    (entry) => entry.name?.toLowerCase() === username.toLowerCase()
  );

  return {
    username,
    uuid: cached?.uuid || null,
  };
}

function getOnlineNames(output) {
  const match = String(output || "").match(/online:\s*(.*)$/im);
  if (!match || !match[1].trim()) return [];

  return [...new Set(
    match[1]
      .split(",")
      .map((name) => name.trim())
      .filter((name) => USERNAME_PATTERN.test(name))
  )];
}

function parsePlayerEvent(line) {
  const match = line.match(
    /^(\S+)\s+\S+\s+[^:]+:\s+\[\d{2}:\d{2}:\d{2}\s+\w+\]:\s+System chat:\s+([A-Za-z0-9_]{1,16}) (joined|left) the game\b/i
  );

  if (!match) return null;

  const timestamp = new Date(match[1]);
  if (Number.isNaN(timestamp.getTime())) return null;

  return {
    username: match[2],
    action: match[3].toLowerCase(),
    timestamp,
  };
}

async function findOrCreatePlayer(username, firstSeenAt = new Date()) {
  const identity = getPlayerIdentity(username);

  let player = identity.uuid
    ? await prisma.player.findUnique({ where: { uuid: identity.uuid } })
    : null;

  if (!player) {
    player = await prisma.player.findFirst({
      where: { username: { equals: username } },
    });
  }

  if (player) {
    const data = { username };
    if (identity.uuid && !player.uuid) data.uuid = identity.uuid;

    return prisma.player.update({
      where: { id: player.id },
      data,
    });
  }

  return prisma.player.create({
    data: { username, uuid: identity.uuid, firstSeen: firstSeenAt, lastSeen: firstSeenAt },
  });
}

async function openSession(username, joinedAt = new Date()) {
  const player = await findOrCreatePlayer(username, joinedAt);

  const activeSession = await prisma.playerSession.findFirst({
    where: {
      playerId: player.id,
      leftAt: null,
    },
  });

  if (activeSession) {
    return { player, session: activeSession, created: false };
  }

  const session = await prisma.playerSession.create({
    data: {
      playerId: player.id,
      joinedAt,
    },
  });

  await prisma.player.update({
    where: { id: player.id },
    data: { lastSeen: joinedAt },
  });

  return { player, session, created: true };
}

async function closeSession(username, leftAt = new Date()) {
  const player = await findOrCreatePlayer(username, leftAt);

  const activeSession = await prisma.playerSession.findFirst({
    where: {
      playerId: player.id,
      leftAt: null,
    },
    orderBy: { joinedAt: "desc" },
  });

  if (!activeSession) {
    await prisma.player.update({
      where: { id: player.id },
      data: { lastSeen: leftAt },
    });
    return { closed: false };
  }

  const safeLeftAt = leftAt < activeSession.joinedAt
    ? activeSession.joinedAt
    : leftAt;

  const duration = Math.max(
    0,
    Math.floor((safeLeftAt.getTime() - activeSession.joinedAt.getTime()) / 1000)
  );

  await prisma.$transaction([
    prisma.playerSession.update({
      where: { id: activeSession.id },
      data: {
        leftAt: safeLeftAt,
        duration,
      },
    }),
    prisma.player.update({
      where: { id: player.id },
      data: {
        lastSeen: safeLeftAt,
        totalPlaytime: { increment: duration },
      },
    }),
  ]);

  return { closed: true, duration };
}

function createPlayerTracker() {
  let child = null;
  let pollTimer = null;
  let restartTimer = null;
  let shuttingDown = false;
  let started = false;
  let pending = Promise.resolve();

  function enqueue(task) {
    pending = pending
      .then(task)
      .catch((error) => {
        console.error("[PlayerTracker] Task failed:", error.message);
      });

    return pending;
  }

  async function processEvent(event) {
    if (event.action === "joined") {
      const result = await openSession(event.username, event.timestamp);

      if (result.created) {
        console.log(`[PlayerTracker] ${event.username} joined; session recorded.`);
      }
    } else {
      const result = await closeSession(event.username, event.timestamp);

      if (result.closed) {
        console.log(
          `[PlayerTracker] ${event.username} left; session duration ${result.duration}s.`
        );
      }
    }
  }

  async function reconcileOnlinePlayers() {
    const result = await rcon.execute("list");

    if (!result.success) {
      console.warn("[PlayerTracker] RCON reconciliation unavailable:", result.message);
      return;
    }

    const onlineNames = getOnlineNames(result.output);
    const onlineKeys = new Set(onlineNames.map((name) => name.toLowerCase()));

    const activeSessions = await prisma.playerSession.findMany({
      where: { leftAt: null },
      include: { player: true },
    });

    for (const active of activeSessions) {
      if (!onlineKeys.has(active.player.username.toLowerCase())) {
        await closeSession(active.player.username, new Date());
      }
    }

    for (const username of onlineNames) {
      await openSession(username, new Date());
    }
  }

  async function recoverSessions() {
    const activeSessions = await prisma.playerSession.findMany({
      where: { leftAt: null },
      include: { player: true },
    });

    for (const active of activeSessions) {
      // Unknown outage duration: do not invent offline playtime.
      await closeSession(active.player.username, active.joinedAt);
    }

    await reconcileOnlinePlayers();
  }

  function scheduleRestart() {
    if (shuttingDown || restartTimer) return;

    restartTimer = setTimeout(() => {
      restartTimer = null;
      startJournal();
    }, 3000);

    restartTimer.unref?.();
  }

  function startJournal() {
    if (shuttingDown || child) return;

    const current = spawn(JOURNALCTL, [
      "-u", "minecraft.service",
      "-f", "-n", "0",
      "--output=short-iso",
      "--no-pager",
    ], { stdio: ["ignore", "pipe", "ignore"] });

    child = current;
    let pendingLine = "";

    current.stdout.setEncoding("utf8");

    current.stdout.on("data", (chunk) => {
      pendingLine += chunk;

      if (pendingLine.length > 16384 && !pendingLine.includes("\n")) {
        pendingLine = pendingLine.slice(-16384);
      }

      let newline;
      while ((newline = pendingLine.indexOf("\n")) !== -1) {
        const line = pendingLine.slice(0, newline).trimEnd();
        pendingLine = pendingLine.slice(newline + 1);

        const event = parsePlayerEvent(line);
        if (event) enqueue(() => processEvent(event));
      }
    });

    current.on("error", (error) => {
      console.error("[PlayerTracker] Journal stream error:", error.message);
      if (child === current) child = null;
      scheduleRestart();
    });

    current.on("close", () => {
      if (child === current) child = null;
      if (!shuttingDown) {
        console.warn("[PlayerTracker] Journal stream closed; reconnecting.");
        scheduleRestart();
      }
    });
  }

  async function start() {
    if (started || shuttingDown) return;
    started = true;
    await enqueue(recoverSessions);
    startJournal();

    pollTimer = setInterval(() => {
      enqueue(reconcileOnlinePlayers);
    }, POLL_INTERVAL_MS);

    pollTimer.unref?.();

    console.log("[PlayerTracker] Started.");
  }

  async function shutdown() {
    shuttingDown = true;

    if (pollTimer) clearInterval(pollTimer);
    if (restartTimer) clearTimeout(restartTimer);

    if (child) {
      const current = child;
      child = null;
      current.kill("SIGTERM");
    }

    await pending;
    console.log("[PlayerTracker] Stopped.");
  }

  return { start, shutdown };
}

module.exports = { createPlayerTracker, getOnlineNames, parsePlayerEvent };
