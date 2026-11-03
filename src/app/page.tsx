"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useServer } from "@/context/ServerContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkline } from "@/components/ui/Sparkline";
import { MinecraftAvatar } from "@/components/ui/MinecraftAvatar";
import {
  Users,
  Cpu,
  Database,
  HardDrive,
  Terminal,
  RotateCw,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Radio,
  ArrowRight,
  Play,
  Server,
  Activity as ActivityIcon,
} from "lucide-react";
import {
  mockCpuHistory,
  mockMemoryHistory,
  mockPlayerHistory,
  mockTpsHistory,
} from "@/data/mockData";
import { formatBytes } from "@/lib/format";

export default function OverviewPage() {
  const {
    currentServer,
    serverStatus,
    serverStatusError,
    serverAction,
    pendingServerAction,
    serverResources,
    serverResourcesLoading,
    serverResourcesError,
    players,
    activities,
    restartServer,
    startServer,
    copyToClipboard,
    createBackup,
  } = useServer();

  const [copiedIp, setCopiedIp] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const onlinePlayers = players.filter((p) => p.online);
  const freeSlots = currentServer.maxPlayers - onlinePlayers.length;
  const memoryPercent = serverResources?.memory.usagePercent;
  const storagePercent = serverResources?.disk.usagePercent;
  const cpuPercent = serverResources?.cpu.usagePercent;
  const resourceError = serverResourcesError || serverStatusError;
  const metricText = (value: number | undefined) => {
    if (value !== undefined) return `${value.toFixed(1)}%`;
    return serverResourcesLoading ? "Loading…" : "Unavailable";
  };

  const handleCopy = () => {
    copyToClipboard(currentServer.ip, "Server IP");
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleInstantBackup = async () => {
    setIsBackingUp(true);
    await createBackup();
    setIsBackingUp(false);
  };

  const dimensionLabels: Record<string, { label: string; color: string; badge: "grass" | "rose" | "purple" }> = {
    overworld: { label: "Overworld", color: "text-emerald-400", badge: "grass" },
    nether: { label: "Nether", color: "text-rose-400", badge: "rose" },
    the_end: { label: "The End", color: "text-purple-400", badge: "purple" },
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Server Header Card */}
      <div className="rounded-xl bg-[#0f1412] border border-white/[0.08] p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Paper 26.3 (#148)
              </span>

              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-white/5 truncate max-w-[200px] sm:max-w-none">
                {currentServer.hardwareModel}
              </span>

              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-white/5">
                {currentServer.cluster}
              </span>
            </div>

            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-zinc-100 tracking-tight font-sans">
                {currentServer.name}
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 font-mono truncate">
                {currentServer.motd.replace(/§[0-9a-fk-or]/gi, "")}
              </p>
            </div>

            {/* Address & Port */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-850 text-xs font-mono text-zinc-300 border border-white/10 hover:border-white/20 transition-colors"
                title="Click to copy server IP"
              >
                {copiedIp ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate">{currentServer.ip}:{currentServer.port}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Server Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 sm:self-end lg:self-center border-t border-white/5 lg:border-t-0">
            <Link
              href="/console"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-white/10 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Console</span>
            </Link>

            <button
              onClick={handleInstantBackup}
              disabled={isBackingUp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-white/10 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className={`w-3.5 h-3.5 text-zinc-400 ${isBackingUp ? "animate-spin" : ""}`} />
              <span>{isBackingUp ? "Archiving..." : "Backup"}</span>
            </button>

            {serverStatus === "ONLINE" ? (
              <button
                onClick={restartServer}
                disabled={serverAction !== null || pendingServerAction !== null}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${serverAction === "restart" ? "animate-spin" : ""}`} />
                <span>{serverAction === "restart" ? "Restarting…" : "Restart Server"}</span>
              </button>
            ) : serverStatus === "OFFLINE" ? (
              <button
                onClick={startServer}
                disabled={serverAction !== null || pendingServerAction !== null}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors disabled:opacity-50"
              >
                {serverAction === "start" ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-black" />
                )}
                <span>{serverAction === "start" ? "Starting…" : "Start Server"}</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-400 border border-white/5 opacity-70"
              >
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>{serverStatus.charAt(0) + serverStatus.slice(1).toLowerCase()}…</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {resourceError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-xs text-amber-200/90"
        >
          Live monitoring update failed: {resourceError}. Retrying automatically.
        </div>
      )}

      {/* KPI Resource Cards: 2 cols on mobile, 3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Players */}
        <Card className="p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Players</span>
            <Users className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono">
                {onlinePlayers.length}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                / {currentServer.maxPlayers}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400">
              {freeSlots} slots free
            </div>
          </div>

          <Sparkline data={mockPlayerHistory} color="emerald" height={28} />
        </Card>

        {/* Memory */}
        <Card className="p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>RAM</span>
            <Database className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono">
              {metricText(memoryPercent)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate">
              {serverResources
                ? `${formatBytes(serverResources.memory.usedBytes)} / ${formatBytes(serverResources.memory.totalBytes)}`
                : serverResourcesLoading
                ? "Loading memory data…"
                : "Memory data unavailable"}
            </div>
          </div>

          <Sparkline data={mockMemoryHistory} color="emerald" height={28} />
        </Card>

        {/* CPU */}
        <Card className="p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>CPU</span>
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono">
              {metricText(cpuPercent)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
              {serverResources
                ? `${serverResources.cpu.cores} cores · ${serverResources.cpu.model}`
                : serverResourcesLoading
                ? "Loading CPU data…"
                : "CPU data unavailable"}
            </div>
          </div>

          <Sparkline data={mockCpuHistory} color="emerald" height={28} />
        </Card>

        {/* Tick Rate (TPS) */}
        <Card className="p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>TPS</span>
            <Zap className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
                {currentServer.tps.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-500 font-mono">TPS</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
              MSPT: {currentServer.mspt}ms
            </div>
          </div>

          <Sparkline data={mockTpsHistory} color="grass" height={28} />
        </Card>

        {/* Storage */}
        <Card className="p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Disk</span>
            <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono">
              {metricText(storagePercent)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate">
              {serverResources
                ? `${formatBytes(serverResources.disk.usedBytes)} / ${formatBytes(serverResources.disk.totalBytes)}`
                : serverResourcesLoading
                ? "Loading disk data…"
                : "Disk data unavailable"}
            </div>
          </div>

          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.max(0, Math.min(100, storagePercent ?? 0))}%` }}
            />
          </div>
        </Card>

        {/* Network */}
        <Card className="p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Network</span>
            <Radio className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono">
                {currentServer.networkInKB}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">KB/s In</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate">
              {(currentServer.networkOutKB / 1024).toFixed(1)} MB/s Out
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 mt-1">
            Port {currentServer.port}
          </div>
        </Card>
      </div>

      {/* Main Grid: Online Players & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          <Card>
            <CardHeader
              title="Connected Players"
              subtitle="Active players in current session"
              badge={
                <Badge variant="emerald" size="sm">
                  {onlinePlayers.length} Online
                </Badge>
              }
              action={
                <Link
                  href="/players"
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  <span>All Players</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            <CardBody className="p-0">
              <div className="divide-y divide-white/[0.04]">
                {onlinePlayers.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 text-xs">
                    No players currently connected.
                  </div>
                ) : (
                  onlinePlayers.slice(0, 6).map((player) => {
                    const dim = player.location
                      ? dimensionLabels[player.location.dimension]
                      : undefined;

                    return (
                      <div
                        key={player.id}
                        className="px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <MinecraftAvatar
                            name={player.name}
                            rank={player.rank}
                            isOnline={player.online}
                            size={32}
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-xs font-semibold text-zinc-100 truncate">
                                {player.name}
                              </span>
                              {player.rank ? (
                                <Badge
                                  variant={
                                    player.rank === "Owner"
                                      ? "gold"
                                      : player.rank === "Admin"
                                      ? "rose"
                                      : player.rank === "VIP+" || player.rank === "VIP"
                                      ? "emerald"
                                      : "neutral"
                                  }
                                  size="sm"
                                >
                                  {player.rank}
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-zinc-500">—</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono text-zinc-400 mt-0.5">
                              <span className="hidden sm:inline">
                                {player.location
                                  ? `${player.location.x}, ${player.location.y}, ${player.location.z}`
                                  : "—"}
                              </span>
                              {dim && <span className="hidden sm:inline">•</span>}
                              <span className={dim?.color || "text-zinc-500"}>
                                {dim?.label || "Location unavailable"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 text-right shrink-0">
                          <div className="hidden sm:block">
                            <div className="text-xs font-mono text-zinc-300">
                              {Number.isFinite(player.playtimeHours)
                                ? `${player.playtimeHours.toFixed(1)} hrs`
                                : "—"}
                            </div>
                            <div className="text-[10px] text-zinc-500">Playtime</div>
                          </div>

                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-white/5 font-mono text-[11px] text-zinc-300">
                            {typeof player.ping === "number" ? (
                              <>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    player.ping < 50
                                      ? "bg-emerald-400"
                                      : player.ping < 120
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                                  }`}
                                />
                                <span>{player.ping}ms</span>
                              </>
                            ) : (
                              <span className="text-zinc-500">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardBody>
          </Card>

          {/* Quick Terminal Presets & Technical Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Commands */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <h4 className="text-xs font-semibold text-zinc-200">
                    Common Commands
                  </h4>
                </div>
                <Link
                  href="/console"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  Terminal →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Check TPS", cmd: "/tps" },
                  { label: "Online Players", cmd: "/list" },
                  { label: "Save Chunks", cmd: "/save-all" },
                  { label: "Reload Config", cmd: "/reload confirm" },
                ].map((preset) => (
                  <Link
                    key={preset.cmd}
                    href="/console"
                    className="p-2.5 rounded bg-zinc-900 hover:bg-zinc-850 border border-white/5 text-left transition-colors"
                  >
                    <div className="text-xs text-zinc-200 font-medium">
                      {preset.label}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      {preset.cmd}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Diagnostics Card */}
            <Card className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4 text-zinc-400" />
                    <h4 className="text-xs font-semibold text-zinc-200">
                      Runtime Status
                    </h4>
                  </div>
                  <Badge variant="emerald" size="sm">
                    Normal
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Paper 26.3 on Java 21 with G1GC. Tick latency is 13.4 ms within the 50 ms per-tick budget.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>GC Pause Average: <strong className="text-zinc-200">13.8 ms</strong></span>
                <span>Tick Health: <strong className="text-emerald-400">100%</strong></span>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Recent Activity & Host Specs */}
        <div className="space-y-5 sm:space-y-6">
          <Card>
            <CardHeader
              title="Recent Activity"
              subtitle="Server lifecycle and admin events"
              action={
                <Link
                  href="/activity"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  View All
                </Link>
              }
            />

            <CardBody className="p-0">
              <div className="divide-y divide-white/[0.04]">
                {activities.slice(0, 5).map((act) => {
                  const severityColors = {
                    info: "bg-sky-400",
                    success: "bg-emerald-400",
                    warning: "bg-amber-400",
                    danger: "bg-rose-400",
                  };

                  return (
                    <div
                      key={act.id}
                      className="p-3.5 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            severityColors[act.severity]
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-semibold text-zinc-200 truncate">
                              {act.title}
                            </h5>
                            <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                              {act.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                            {act.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-1">
                            <span>Actor: {act.actor.name} ({act.actor.role})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Host Specifications */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-400" />
              Host Specifications
            </h4>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-400">Server Hardware</span>
                <span className="text-zinc-200 truncate ml-2">{currentServer.hardwareModel}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-400">Processor</span>
                <span className="text-zinc-200 truncate ml-2">{currentServer.cpuModel}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-400">Memory Allocation</span>
                <span className="text-zinc-200">16,384 MB DDR4 ECC</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-400">Storage Controller</span>
                <span className="text-zinc-200">HP Smart Array</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Java Version</span>
                <span className="text-zinc-200">{currentServer.javaVersion}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
