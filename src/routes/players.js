const express = require("express");
const fs = require("fs");
const path = require("path");
const requireAuth = require("../middleware/auth");
const rcon = require("../services/rcon");
const prisma = require("../lib/prisma");

const router = express.Router();
router.use(requireAuth);

const SERVER_DIR = path.resolve(
  process.env.MINECRAFT_SERVER_DIR || "/home/anonx/minecraft-server"
);

const WORLD_DIR = path.join(SERVER_DIR, "world");
const USER_CACHE = path.join(SERVER_DIR, "usercache.json");
const BAN_FILE = path.join(SERVER_DIR, "banned-players.json");
const WHITELIST_FILE = path.join(SERVER_DIR, "whitelist.json");

const USERNAME_PATTERN = /^[A-Za-z0-9_]{1,16}$/;

function readJson(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function getPlaytime(uuid) {
  const file = path.join(WORLD_DIR, "players", "stats", `${uuid}.json`);

  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const custom = data.stats?.["minecraft:custom"] || {};
    const ticks =
      custom["minecraft:play_time"] ??
      custom["minecraft:play_one_minute"] ??
      0;

    return Math.floor(ticks / 72000);
  } catch {
    return 0;
  }
}

function getOnlineNames(output) {
  const match = String(output || "").match(/online:\s*(.*)$/im);
  if (!match || !match[1].trim()) return [];
  return match[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function validateUsername(username) {
  return typeof username === "string" &&
    USERNAME_PATTERN.test(username);
}

function findPlayer(username) {
  const players = readJson(USER_CACHE);
  return players.find(
    (player) => player.name.toLowerCase() === username.toLowerCase()
  );
}

async function logActivity(action, details) {
  try {
    await prisma.activityLog.create({
      data: { action, details }
    });
  } catch (error) {
    console.error("Player activity logging failed:", error.message);
  }
}

async function executePlayerCommand(command) {
  const result = await rcon.execute(command);

  if (!result.success) {
    return {
      success: false,
      message: result.message || "Minecraft command failed."
    };
  }

  const output = result.output || "";

  if (/unknown command|incorrect argument|no player was found|not found/i.test(output)) {
    return {
      success: false,
      message: output
    };
  }

  return { success: true, output };
}

// GET /api/players
router.get("/", async (req, res) => {
  try {
    const [cache, bans, whitelist, onlineResult, trackedPlayers] = await Promise.all([
      Promise.resolve(readJson(USER_CACHE)),
      Promise.resolve(readJson(BAN_FILE)),
      Promise.resolve(readJson(WHITELIST_FILE)),
      rcon.execute("list"),
      prisma.player.findMany({
        include: {
          sessions: {
            where: { leftAt: null },
            orderBy: { joinedAt: "desc" },
            take: 1
          }
        }
      })
    ]);

    if (!onlineResult.success) {
      return res.status(503).json({
        success: false,
        message: "Could not retrieve live Minecraft player status.",
        details: onlineResult.message
      });
    }

    const onlineNames = getOnlineNames(onlineResult.output);
    const bannedNames = new Set(bans.map((p) => p.name.toLowerCase()));
    const whitelistedNames = new Set(
      whitelist.map((p) => p.name.toLowerCase())
    );

    const trackedByUuid = new Map();
    const trackedByName = new Map();

    for (const tracked of trackedPlayers) {
      if (tracked.uuid) trackedByUuid.set(tracked.uuid, tracked);
      trackedByName.set(tracked.username.toLowerCase(), tracked);
    }

    const now = Date.now();

    const players = cache.map((player) => {
      const username = player.name;
      const key = username.toLowerCase();
      const online = onlineNames.some(
        (name) => name.toLowerCase() === key
      );

      const tracked =
        trackedByUuid.get(player.uuid) ||
        trackedByName.get(key) ||
        null;

      const activeSession = tracked?.sessions?.[0] || null;
      const trackedSeconds = tracked
        ? tracked.totalPlaytime +
          (activeSession
            ? Math.max(0, Math.floor((now - activeSession.joinedAt.getTime()) / 1000))
            : 0)
        : 0;

      const minecraftStatsSeconds = getPlaytime(player.uuid) * 3600;
      const totalPlaytimeSeconds = Math.max(
        minecraftStatsSeconds,
        trackedSeconds
      );

      return {
        id: player.uuid,
        uuid: player.uuid,
        name: username,
        online,
        playtimeHours: totalPlaytimeSeconds / 3600,
        isBanned: bannedNames.has(key),
        isWhitelisted: whitelistedNames.has(key),
        banReason: bans.find(
          (p) => p.name.toLowerCase() === key
        )?.reason || null,
        firstSeen: tracked?.firstSeen?.toISOString() || null,
        lastSeen: tracked?.lastSeen?.toISOString() || null,
        dataSource: tracked ? "tracked" : "minecraft"
      };
    });

    return res.json({
      success: true,
      players,
      totals: {
        registered: players.length,
        online: players.filter((p) => p.online).length,
        banned: bans.length,
        whitelisted: whitelist.length
      }
    });
  } catch (error) {
    console.error("Player list error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not load Minecraft players."
    });
  }
});

// POST /api/players/:username/kick
router.post("/:username/kick", async (req, res) => {
  const { username } = req.params;
  const reason = String(req.body?.reason || "Kicked by an operator").slice(0, 200);

  if (!validateUsername(username)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Minecraft username."
    });
  }

  try {
    const result = await executePlayerCommand(
      `kick ${username} ${reason}`
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    await logActivity("PLAYER_KICKED", `${username}: ${reason}`);

    return res.json({
      success: true,
      message: `${username} was kicked.`
    });
  } catch (error) {
    console.error("Kick error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not kick player."
    });
  }
});

// POST /api/players/:username/ban
router.post("/:username/ban", async (req, res) => {
  const { username } = req.params;
  const reason = String(req.body?.reason || "Banned by an operator").slice(0, 200);

  if (!validateUsername(username)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Minecraft username."
    });
  }

  try {
    const result = await executePlayerCommand(
      `ban ${username} ${reason}`
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    await logActivity("PLAYER_BANNED", `${username}: ${reason}`);

    return res.json({
      success: true,
      message: `${username} was permanently banned.`
    });
  } catch (error) {
    console.error("Ban error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not ban player."
    });
  }
});

// POST /api/players/:username/unban
router.post("/:username/unban", async (req, res) => {
  const { username } = req.params;

  if (!validateUsername(username)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Minecraft username."
    });
  }

  try {
    const result = await executePlayerCommand(`pardon ${username}`);

    if (!result.success) {
      return res.status(400).json(result);
    }

    await logActivity("PLAYER_UNBANNED", username);

    return res.json({
      success: true,
      message: `${username} was unbanned.`
    });
  } catch (error) {
    console.error("Unban error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not unban player."
    });
  }
});

// POST /api/players/:username/whitelist
router.post("/:username/whitelist", async (req, res) => {
  const { username } = req.params;

  if (!validateUsername(username)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Minecraft username."
    });
  }

  try {
    const result = await executePlayerCommand(
      `whitelist add ${username}`
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    await logActivity("PLAYER_WHITELISTED", username);

    return res.json({
      success: true,
      message: `${username} was added to the whitelist.`
    });
  } catch (error) {
    console.error("Whitelist add error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not whitelist player."
    });
  }
});

// DELETE /api/players/:username/whitelist
router.delete("/:username/whitelist", async (req, res) => {
  const { username } = req.params;

  if (!validateUsername(username)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Minecraft username."
    });
  }

  try {
    const result = await executePlayerCommand(
      `whitelist remove ${username}`
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    await logActivity("PLAYER_UNWHITELISTED", username);

    return res.json({
      success: true,
      message: `${username} was removed from the whitelist.`
    });
  } catch (error) {
    console.error("Whitelist remove error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not remove player from whitelist."
    });
  }
});

module.exports = router;
