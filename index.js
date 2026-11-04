require("dotenv").config();

const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./src/routes/auth");
const serverRoutes = require("./src/routes/server");
const playerRoutes = require("./src/routes/players");
const prisma = require("./src/lib/prisma");
const { createConsole, ALLOWED_ORIGINS } = require("./src/services/console");
const { createSocketTickets } = require("./src/services/socketTickets");
const { createPlayerTracker } = require("./src/services/playerTracker");

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from .env");
}

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

const sessionDbDirectory = path.join(__dirname, "prisma");
fs.mkdirSync(sessionDbDirectory, { recursive: true });

const sessionStore = new SQLiteStore({
  db: "sessions.sqlite",
  dir: sessionDbDirectory,
  table: "sessions"
});
const isProduction = process.env.NODE_ENV === "production";
const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  maxAge: 1000 * 60 * 60 * 8
};

const sessionMiddleware = session({
  store: sessionStore,
  name: "valoria.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: sessionCookieOptions
});
app.use(sessionMiddleware);

const socketTickets = createSocketTickets(sessionStore);
app.set("socketTickets", socketTickets);

app.post("/api/auth/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));

app.use("/api/auth", authRoutes);
app.use("/api/server", serverRoutes);
app.use("/api/players", playerRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "ValoriaSMP Panel API"
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "ValoriaSMP Panel Backend"
  });
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [...ALLOWED_ORIGINS],
    credentials: false
  },
  allowRequest: (request, callback) => {
    const origin = request.headers.origin;
    callback(null, ALLOWED_ORIGINS.has(origin));
  }
});
const consoleService = createConsole(io, sessionStore, socketTickets);
const playerTracker = createPlayerTracker();
app.set("io", io);
app.set("consoleService", consoleService);
app.set("playerTracker", playerTracker);

server.listen(PORT, "127.0.0.1", async () => {
  console.log(`ValoriaSMP API running on http://127.0.0.1:${PORT}`);
  try {
    await playerTracker.start();
  } catch (error) {
    console.error("[PlayerTracker] Startup failed:", error.message);
  }
});

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("Shutting down panel API...");
  consoleService.shutdown();
  try {
    await playerTracker.shutdown();
  } catch (error) {
    console.error("[PlayerTracker] Shutdown failed:", error.message);
  }
  io.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
