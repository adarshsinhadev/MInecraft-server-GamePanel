"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useServer } from "@/context/ServerContext";
import { formatBytes } from "@/lib/format";
import {
  LayoutDashboard,
  Terminal,
  Users,
  Globe,
  Package,
  FolderTree,
  ArchiveRestore,
  BarChart3,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Copy,
  Check,
  X,
  RotateCw,
  Power,
  Play,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const Sidebar: React.FC<{
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}> = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();
  const {
    currentServer,
    serverStatus,
    serverResources,
    serverResourcesLoading,
    serverAction,
    pendingServerAction,
    players,
    copyToClipboard,
    restartServer,
    stopServer,
    startServer,
  } = useServer();
  const [copied, setCopied] = useState(false);

  const onlineCount = players.filter((p) => p.online).length;

  const navItems: NavItem[] = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Console", href: "/console", icon: Terminal },
    { label: "Players", href: "/players", icon: Users, badge: onlineCount },
    { label: "Worlds", href: "/worlds", icon: Globe },
    { label: "Plugins", href: "/plugins", icon: Package },
    { label: "Files", href: "/files", icon: FolderTree },
    { label: "Backups", href: "/backups", icon: ArchiveRestore },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Activity", href: "/activity", icon: History },
  ];

  const handleCopyIp = () => {
    copyToClipboard(currentServer.ip, "Server IP");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diskPercent = serverResources?.disk.usagePercent;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#0a0e0d] border-r border-white/[0.08] transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none ${
          collapsed ? "w-20" : "w-64 max-w-[85vw]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Branding & Close Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.08] shrink-0">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-8 h-8 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <span className="font-mono font-bold text-emerald-400 text-sm">
                V
              </span>
            </div>

            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-zinc-100 text-sm tracking-tight font-sans">
                  Valoria<span className="text-emerald-400">SMP</span>
                </span>
                <span className="text-[11px] text-zinc-400 font-mono tracking-tight truncate">
                  Paper 26.3
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button (X) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-2 mb-2">
            {!collapsed || mobileOpen ? (
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Navigation
              </span>
            ) : (
              <div className="h-2" />
            )}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors group ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                />

                {(!collapsed || mobileOpen) && (
                  <span className="truncate flex-1">{item.label}</span>
                )}

                {(!collapsed || mobileOpen) && item.badge !== undefined && (
                  <span
                    className={`ml-auto px-1.5 py-0.2 text-[10px] font-mono rounded ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 font-bold"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile Server Quick Power Controls in Drawer */}
        <div className="lg:hidden px-3 py-2 border-t border-white/5 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-1 font-semibold">
            Server Controls
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                restartServer();
                setMobileOpen(false);
              }}
              disabled={serverStatus !== "ONLINE" || serverAction !== null || pendingServerAction !== null}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors disabled:opacity-40"
            >
              <RotateCw className={`w-3.5 h-3.5 ${serverAction === "restart" ? "animate-spin" : ""}`} />
              <span>{serverAction === "restart" ? "Restarting…" : "Restart"}</span>
            </button>

            {serverStatus === "ONLINE" ? (
              <button
                onClick={() => {
                  stopServer();
                  setMobileOpen(false);
                }}
                disabled={serverAction !== null || pendingServerAction !== null}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Power className={`w-3.5 h-3.5 ${serverAction === "stop" ? "animate-pulse" : ""}`} />
                <span>{serverAction === "stop" ? "Stopping…" : "Stop"}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  startServer();
                  setMobileOpen(false);
                }}
                disabled={serverStatus !== "OFFLINE" || serverAction !== null || pendingServerAction !== null}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{serverAction === "start" ? "Starting…" : serverStatus === "STARTING" ? "Starting…" : serverStatus === "STOPPING" ? "Stopping…" : "Start"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Storage & IP Bar */}
        {(!collapsed || mobileOpen) ? (
          <div className="p-3 m-3 bg-zinc-900/90 rounded-lg border border-white/5 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                Storage
              </span>
              <span className="text-zinc-300 text-[11px]">
                {serverResources
                  ? `${formatBytes(serverResources.disk.usedBytes)} / ${formatBytes(serverResources.disk.totalBytes)}`
                  : serverResourcesLoading
                  ? "Loading…"
                  : "Unavailable"}
              </span>
            </div>

            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, diskPercent ?? 0))}%` }}
              />
            </div>

            <button
              onClick={handleCopyIp}
              className="w-full flex items-center justify-center gap-2 py-2 px-2 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-mono border border-white/5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Server IP</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{currentServer.ip}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-3 flex flex-col items-center border-t border-white/5 shrink-0">
            <button
              onClick={handleCopyIp}
              className="w-10 h-10 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title="Copy Server IP"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
