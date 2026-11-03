const fs = require("fs");
const net = require("net");

const SERVER_PROPERTIES =
  process.env.MINECRAFT_SERVER_PROPERTIES || "/home/anonx/minecraft-server/server.properties";
const RCON_HOST = "127.0.0.1";
const MAX_PACKET_BYTES = 4096;

function getRconConfig() {
  let properties;
  try {
    properties = fs.readFileSync(SERVER_PROPERTIES, "utf8");
  } catch {
    return { available: false, message: "RCON configuration is unavailable." };
  }

  const enabled = /^\s*enable-rcon\s*=\s*true\s*$/im.test(properties);
  if (!enabled) {
    return { available: false, message: "RCON is disabled in server.properties." };
  }

  const password = process.env.RCON_PASSWORD;
  if (typeof password !== "string" || password.length === 0) {
    return { available: false, message: "RCON is enabled but its private password is not configured." };
  }

  const portMatch = properties.match(/^\s*rcon\.port\s*=\s*(\d+)\s*$/im);
  const port = portMatch ? Number(portMatch[1]) : 25575;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { available: false, message: "RCON has an invalid port configuration." };
  }

  return { available: true, port, password };
}

function packet(id, type, body) {
  const payload = Buffer.from(body, "utf8");
  const data = Buffer.alloc(payload.length + 14);
  data.writeInt32LE(payload.length + 10, 0);
  data.writeInt32LE(id, 4);
  data.writeInt32LE(type, 8);
  payload.copy(data, 12);
  data[data.length - 2] = 0;
  data[data.length - 1] = 0;
  return data;
}

function execute(command) {
  const config = getRconConfig();
  if (!config.available) {
    return Promise.resolve({
      success: false,
      code: "RCON_UNAVAILABLE",
      message: config.message,
    });
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({ host: RCON_HOST, port: config.port });
    let buffer = Buffer.alloc(0);
    let stage = "auth";
    let settled = false;
    const authId = 1;
    const commandId = 2;
    let commandOutput = "";
    let responseTimeout = null;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (responseTimeout) clearTimeout(responseTimeout);
      socket.destroy();
      resolve(result);
    };

    const timeout = setTimeout(() => {
      finish({ success: false, code: "RCON_TIMEOUT", message: "RCON request timed out." });
    }, 5000);

    socket.on("connect", () => socket.write(packet(authId, 3, config.password)));
    socket.on("error", () => {
      finish({ success: false, code: "RCON_CONNECTION_FAILED", message: "Could not connect to the local RCON service." });
    });
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 4) {
        const length = buffer.readInt32LE(0);
        if (length < 10 || length > MAX_PACKET_BYTES) {
          finish({ success: false, code: "RCON_PROTOCOL_ERROR", message: "RCON returned an invalid response." });
          return;
        }
        if (buffer.length < length + 4) return;

        const id = buffer.readInt32LE(4);
        const type = buffer.readInt32LE(8);
        const body = buffer.subarray(12, length + 2).toString("utf8");
        buffer = buffer.subarray(length + 4);

        if (stage === "auth") {
          if (id === -1) {
            finish({ success: false, code: "RCON_AUTH_FAILED", message: "RCON authentication failed." });
            return;
          }
          if (id !== authId || type !== 2) continue;
          stage = "command";
          socket.write(packet(commandId, 2, command));
          continue;
        }

        if (id === commandId && (type === 0 || type === 2)) {
          commandOutput += body;
          if (commandOutput.length >= 4000) {
            finish({ success: true, output: commandOutput.slice(0, 4000) });
            return;
          }
          // RCON does not mark multi-packet command responses consistently. Allow
          // adjacent response packets to arrive together, then return the collected output.
          clearTimeout(timeout);
          if (responseTimeout) clearTimeout(responseTimeout);
          responseTimeout = setTimeout(() => {
            finish({ success: true, output: commandOutput.trim() });
          }, 150);
          responseTimeout.unref?.();
        }
      }
    });
  });
}

module.exports = { execute };
