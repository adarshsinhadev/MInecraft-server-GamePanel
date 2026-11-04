const express = require("express");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const router = express.Router();

const requireAuth = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    const { userId, password, secretKey } = req.body || {};

    if (
      typeof userId !== "string" ||
      typeof password !== "string" ||
      typeof secretKey !== "string" ||
      !userId || !password || !secretKey ||
      userId.length > 128 ||
      password.length > 256 ||
      secretKey.length > 256
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid login details"
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { userId }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials"
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    const secretValid = await bcrypt.compare(
      secretKey,
      admin.secretHash
    );

    if (!passwordValid || !secretValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials"
      });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    req.session.authenticated = true;

    return req.session.save(err => {
      if (err) {
        console.error("Session save failed:", err);
        return res.status(500).json({
          success: false,
          message: "Login could not be completed"
        });
      }

      res.json({
        success: true,
        message: "Login successful"
      });
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

const socketTicketLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many socket authentication requests. Try again shortly."
  }
});

router.post("/socket-ticket", socketTicketLimiter, requireAuth, (req, res) => {
  try {
    const socketTickets = req.app.get("socketTickets");

    if (!socketTickets) {
      return res.status(503).json({
        success: false,
        message: "Socket authentication is unavailable"
      });
    }

    const result = socketTickets.issue(req.sessionID);

    res.set("Cache-Control", "no-store");
    return res.json({
      success: true,
      ticket: result.ticket,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    if (error.message === "Too many pending socket tickets") {
      return res.status(429).json({
        success: false,
        message: "Too many pending socket connections. Try again shortly."
      });
    }

    console.error("Socket ticket creation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create socket authentication ticket"
    });
  }
});

router.get("/me", (req, res) => {
  if (!req.session?.authenticated) {
    return res.status(401).json({
      success: false,
      authenticated: false
    });
  }

  res.json({
    success: true,
    authenticated: true
  });
});

router.post("/logout", (req, res) => {
  const sessionId = req.sessionID;
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }

    res.clearCookie("valoria.sid", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });

    req.app.get("consoleService")?.disconnectSession(sessionId);

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  });
});

module.exports = router;
