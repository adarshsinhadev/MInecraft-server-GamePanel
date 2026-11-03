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
const sessionMiddleware = session({
  store: sessionStore,
  name: "valoria.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 8
  }
});
app.use(sessionMiddleware);

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
    credentials: true
  },
  allowRequest: (request, callback) => {
    const origin = request.headers.origin;
    callback(null, ALLOWED_ORIGINS.has(origin));
  }
});
io.engine.use(sessionMiddleware);
const consoleService = createConsole(io, sessionStore);
app.set("io", io);
app.set("consoleService", consoleService);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`ValoriaSMP API running on http://127.0.0.1:${PORT}`);
});

async function shutdown() {
  console.log("Shutting down panel API...");
  consoleService.shutdown();
  io.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
