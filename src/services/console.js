const { spawn } = require("child_process");
const rcon = require("./rcon");

const JOURNALCTL = "/usr/bin/journalctl";
const MAX_LOG_LINE = 16384;
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const ALLOWED_ORIGINS = new Set(
  (process.env.FRONTEND_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => {
      if (!origin) return false;

      try {
        const parsed = new URL(origin);
        return (
          (parsed.protocol === "https:" || parsed.protocol === "http:") &&
          parsed.origin === origin &&
          !parsed.username &&
          !parsed.password
        );
      } catch {
        return false;
      }
    })
);

function parseLogLine(line, sequence) {
  const match = line.match(/^(\S+)\s+\S+\s+([^:]+):\s?(.*)$/);
  const rawTimestamp = match?.[1];
  const sourceName = match?.[2] || "Paper";
  const message = (match?.[3] ?? line).slice(0, MAX_LOG_LINE);
  const timestampDate = rawTimestamp ? new Date(rawTimestamp) : new Date();
  const timestamp = Number.isNaN(timestampDate.getTime())
    ? new Date().toTimeString().slice(0, 8)
    : timestampDate.toTimeString().slice(0, 8);

  let level = "INFO";
  if (/\b(error|severe|exception|fatal)\b/i.test(message)) level = "ERROR";
  else if (/\b(warn|warning)\b/i.test(message)) level = "WARN";
  else if (/<[^>]+>\s/.test(message)) level = "CHAT";

  const source = /^(java|minecraft)(?:\[\d+\])?$/i.test(sourceName)
    ? "Paper"
    : sourceName.slice(0, 80);

  return {
    id: `journal-${Date.now()}-${sequence}`,
    timestamp,
    level,
    source,
    message,
  };
}

function createConsole(io, sessionStore, socketTickets) {
  const sockets = new Set();
  const rateWindows = new Map();
  const inFlight = new Set();
  let child = null;
  let restartTimer = null;
  let sequence = 0;
  let shuttingDown = false;

  const broadcastStatus = (status, message) => {
    for (const socket of sockets) socket.emit("console:stream-status", { status, message });
  };

  const stopJournal = () => {
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
    if (child) {
      const current = child;
      child = null;
      current.kill("SIGTERM");
      const killTimer = setTimeout(() => {
        if (current.exitCode === null && current.signalCode === null) current.kill("SIGKILL");
      }, 2000);
      current.once("close", () => clearTimeout(killTimer));
      killTimer.unref?.();
    }
  };

  const startJournal = () => {
    if (shuttingDown || sockets.size === 0 || child) return;
    try {
      const current = spawn(JOURNALCTL, [
        "-u", "minecraft.service",
        "-f", "-n", "100",
        "--output=short-iso",
        "--no-pager",
      ], { stdio: ["ignore", "pipe", "ignore"] });
      child = current;
      let pending = "";

      current.stdout.setEncoding("utf8");
      current.stdout.on("data", (chunk) => {
        pending += chunk;
        if (pending.length > MAX_LOG_LINE && !pending.includes("\n")) {
          pending = pending.slice(-MAX_LOG_LINE);
        }
        let newline;
        while ((newline = pending.indexOf("\n")) !== -1) {
          const line = pending.slice(0, newline).trimEnd();
          pending = pending.slice(newline + 1);
          if (line) io.emit("console:log", parseLogLine(line, ++sequence));
        }
      });
      current.on("error", () => {
        if (child === current) child = null;
        broadcastStatus("error", "Could not start the Minecraft journal stream.");
      });
      current.on("close", () => {
        if (child === current) child = null;
        if (!shuttingDown && sockets.size > 0 && !restartTimer) {
          broadcastStatus("reconnecting", "Minecraft log stream disconnected; retrying.");
          restartTimer = setTimeout(() => {
            restartTimer = null;
            startJournal();
          }, 1500);
          restartTimer.unref?.();
        }
      });
      broadcastStatus("connected");
    } catch {
      broadcastStatus("error", "Could not start the Minecraft journal stream.");
    }
  };

  const detach = (socket) => {
    sockets.delete(socket);
    if (!sockets.size) stopJournal();
  };

  io.use(async (socket, next) => {
    const origin = socket.handshake.headers.origin;

    if (!ALLOWED_ORIGINS.has(origin)) {
      return next(new Error("Socket origin is not allowed."));
    }

    try {
      const authentication = await socketTickets.consume(
        socket.handshake.auth?.ticket
      );

      if (!authentication) {
        return next(new Error("Authentication required."));
      }

      socket.data.sessionId = authentication.sessionId;
      next();
    } catch {
      next(new Error("Authentication failed."));
    }
  });

  io.on("connection", (socket) => {
    const sessionId = socket.data.sessionId;
    const sessionRoom = `session:${sessionId}`;
    sockets.add(socket);
    socket.join(sessionRoom);

    const expiryCheck = setInterval(() => {
      sessionStore.get(sessionId, (error, session) => {
        if (error || !session || session.authenticated !== true) {
          socket.emit("auth:expired");
          socket.disconnect(true);
        }
      });
    }, 30000);
    expiryCheck.unref?.();

    if (sockets.size === 1) startJournal();
    socket.emit("console:stream-status", { status: child ? "connected" : "connecting" });

    socket.on("console:command", async (payload, acknowledge) => {
      const reply = typeof acknowledge === "function" ? acknowledge : () => {};
      const command = payload && typeof payload.command === "string" ? payload.command : "";
      const normalized = command.trim().replace(/^\/+/, "");
      if (!normalized || normalized.length > 256 || /[\u0000-\u001f\u007f]/.test(normalized)) {
        reply({ success: false, code: "INVALID_COMMAND", message: "Enter a command of 1 to 256 characters without control characters." });
        return;
      }

      const now = Date.now();
      const recentRequests = (rateWindows.get(sessionId) || []).filter((time) => now - time < 10000);
      if (recentRequests.length >= 6) {
        rateWindows.set(sessionId, recentRequests);
        reply({ success: false, code: "RATE_LIMITED", message: "Command rate limit reached. Wait a few seconds and try again." });
        return;
      }
      if (inFlight.has(sessionId)) {
        reply({ success: false, code: "COMMAND_IN_PROGRESS", message: "A console command is already processing." });
        return;
      }

      recentRequests.push(now);
      rateWindows.set(sessionId, recentRequests);
      inFlight.add(sessionId);
      try {
        reply(await rcon.execute(normalized));
      } catch {
        reply({ success: false, code: "RCON_ERROR", message: "The RCON command could not be completed." });
      } finally {
        inFlight.delete(sessionId);
      }
    });

    socket.on("disconnect", () => {
      clearInterval(expiryCheck);
      detach(socket);
    });
  });

  return {
    disconnectSession(sessionId) {
      socketTickets.invalidateSession(sessionId);
      io.in(`session:${sessionId}`).disconnectSockets(true);
    },
    shutdown() {
      shuttingDown = true;
      stopJournal();
      for (const socket of sockets) socket.disconnect(true);
      sockets.clear();
    },
  };
}

module.exports = { createConsole, ALLOWED_ORIGINS };
