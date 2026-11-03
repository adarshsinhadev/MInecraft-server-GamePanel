const GIGABYTE = 1024 ** 3;
const TERABYTE = 1024 ** 4;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes >= TERABYTE) return `${(bytes / TERABYTE).toFixed(1)} TB`;
  return `${(bytes / GIGABYTE).toFixed(1)} GB`;
}

export function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const totalMinutes = Math.floor(seconds / 60);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d ${hours}h ${minutes}m`;
}
