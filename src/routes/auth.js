const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const router = express.Router();

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
      secure: false
    });

    req.app.get("consoleService")?.disconnectSession(sessionId);

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  });
});

module.exports = router;
