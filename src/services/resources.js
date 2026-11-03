const os = require("os");
const fs = require("fs");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getCpuTimes() {
  return os.cpus().map((cpu) => cpu.times);
}

async function getCpuUsage() {
  const start = getCpuTimes();

  await delay(500);

  const end = getCpuTimes();

  let totalDelta = 0;
  let idleDelta = 0;

  for (let i = 0; i < start.length; i++) {
    const startTotal = Object.values(start[i]).reduce((a, b) => a + b, 0);
    const endTotal = Object.values(end[i]).reduce((a, b) => a + b, 0);

    totalDelta += endTotal - startTotal;
    idleDelta += end[i].idle - start[i].idle;
  }

  if (totalDelta <= 0) return 0;

  return Number(
    ((1 - idleDelta / totalDelta) * 100).toFixed(1)
  );
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();

  return {
    totalBytes: total,
    freeBytes: free,
    usedBytes: total - free,
    usagePercent: Number(
      (((total - free) / total) * 100).toFixed(1)
    )
  };
}

function getDiskUsage() {
  const stats = fs.statfsSync("/");

  const total = stats.blocks * stats.bsize;
  const used = (stats.blocks - stats.bfree) * stats.bsize;
  const available = stats.bavail * stats.bsize;

  return {
    totalBytes: total,
    freeBytes: available,
    usedBytes: used,
    usagePercent: Number(
      ((used / (used + available)) * 100).toFixed(1)
    )
  };
}

async function getResources() {
  return {
    cpu: {
      usagePercent: await getCpuUsage(),
      cores: os.cpus().length,
      model: os.cpus()[0].model
    },
    memory: getMemoryUsage(),
    disk: getDiskUsage(),
    uptimeSeconds: os.uptime(),
    hostname: os.hostname(),
    platform: os.platform()
  };
}

module.exports = { getResources };
