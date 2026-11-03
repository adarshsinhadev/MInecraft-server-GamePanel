const { execFile } = require("child_process");

const SYSTEMCTL = "/usr/bin/systemctl";

function runSystemctl(action) {
  const allowedActions = ["start", "stop", "restart"];

  if (!allowedActions.includes(action)) {
    return Promise.reject(new Error("Invalid Minecraft action"));
  }

  return new Promise((resolve, reject) => {
    execFile(
      "/usr/bin/sudo",
      ["-n", SYSTEMCTL, action, "minecraft.service"],
      { timeout: 15000 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("Minecraft service error:", stderr || error.message);
          return reject(new Error("Minecraft service action failed"));
        }

        resolve({
          success: true,
          action
        });
      }
    );
  });
}

async function getStatus() {
  return new Promise((resolve, reject) => {
    execFile(
      SYSTEMCTL,
      ["is-active", "minecraft.service"],
      { timeout: 5000 },
      (error, stdout) => {
        const status = stdout.trim();

        if (
          ["active", "inactive", "activating", "deactivating", "failed"].includes(status)
        ) {
          return resolve(status);
        }

        if (error) {
          return resolve("unknown");
        }

        resolve("unknown");
      }
    );
  });
}

module.exports = {
  start: () => runSystemctl("start"),
  stop: () => runSystemctl("stop"),
  restart: () => runSystemctl("restart"),
  getStatus
};
