const express = require("express");
const requireAuth = require("../middleware/auth");
const minecraft = require("../services/minecraft");
const resources = require("../services/resources");

const router = express.Router();

// All server routes require authentication.
router.use(requireAuth);

// Read Minecraft server status.
router.get("/status", async (req, res) => {
  try {
    const status = await minecraft.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error("Status error:", error);

    res.status(500).json({
      success: false,
      message: "Could not retrieve server status"
    });
  }
});

// Read HP system resource usage.
router.get("/resources", async (req, res) => {
  try {
    const data = await resources.getResources();

    res.json({
      success: true,
      resources: data
    });
  } catch (error) {
    console.error("Resources error:", error);

    res.status(500).json({
      success: false,
      message: "Could not retrieve system resources"
    });
  }
});

// Start, stop and restart Minecraft.
for (const action of ["start", "stop", "restart"]) {
  router.post(`/${action}`, async (req, res) => {
    try {
      await minecraft[action]();

      res.json({
        success: true,
        message: `Minecraft ${action} command executed`
      });
    } catch (error) {
      console.error(`Minecraft ${action} error:`, error);

      res.status(500).json({
        success: false,
        message: `Could not ${action} Minecraft server`
      });
    }
  });
}

module.exports = router;
