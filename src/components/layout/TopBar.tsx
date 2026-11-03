"use client";

import React, { useState, useRef, useEffect } from "react";
import { useServer } from "@/context/ServerContext";
import {
  ChevronDown,
  RotateCw,
  Power,
  Bell,
  Server as ServerIcon,
  Wifi,
  Clock,
  Shield,
  Check,
  Menu,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatUptime } from "@/lib/format";

export const TopBar: React.FC<{
  onOpenMobileNav: () => void;
  collapsed: boolean;
}> = ({ onOpenMobileNav }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const {
    servers,
    currentServer,
    selectServer,
    serverStatus,
    serverStatusError,
    serverResources,
    serverResourcesLoading,
    serverAction,
    pendingServerAction,
    restartServer,
    stopServer,
    startServer,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    addToast,
  } = useServer();

  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const serverMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (serverMenuRef.current && !serverMenuRef.current.contains(e.target as Node)) {
        setServerMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    try {
      await logout();
      router.replace("/login");
    } catch (cause) {
      addToast(
        "Logout failed",
        cause instanceof Error ? cause.message : "Please try again.",
        "error"
      );
    }
  };

  const statusConfig = {
    CHECKING: {
      label: "Checking",
      dot: "bg-amber-400 animate-pulse",
      textColor: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    ONLINE: {
      label: "Online",
      dot: "bg-emerald-400",
      textColor: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
    },
    STARTING: {
      label: "Starting",
      dot: "bg-amber-400",
      textColor: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    RESTARTING: {
      label: "Restarting",
      dot: "bg-amber-400",
      textColor: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    STOPPING: {
      label: "Stopping",
      dot: "bg-rose-400",
      textColor: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
    },
    OFFLINE: {
      label: "Offline",
      dot: "bg-zinc-500",
      textColor: "text-zinc-400",
      border: "border-zinc-700",
      bg: "bg-zinc-800/40",
    },
  };

  const currentStatus = statusConfig[serverStatus];

  return (
    <header className="h-16 bg-[#0a0e0d] border-b border-white/[0.08] sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6">
      {/* Left side: Mobile menu & Server switcher */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden w-9 h-9 flex items-center justify-center text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Open mobile menu"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Server Selector Dropdown */}
        <div className="relative shrink-0" ref={serverMenuRef}>
          <button
            onClick={() => setServerMenuOpen(!serverMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-white/10 hover:border-white/20 transition-all text-left group max-w-[150px] sm:max-w-[240px]"
          >
            <div className="w-5 h-5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ServerIcon className="w-3 h-3 text-emerald-400" />
            </div>

            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors truncate">
                {currentServer.name}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 truncate">
                {currentServer.cluster}
              </span>
            </div>

            <span className="sm:hidden text-xs font-semibold text-zinc-100 truncate">
              SMP S4
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform shrink-0 ${
                serverMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {serverMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold border-b border-white/5">
                Servers
              </div>
              <div className="mt-1 space-y-1">
                {servers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      selectServer(s.id);
                      setServerMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                      s.id === currentServer.id
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        : "hover:bg-white/5 text-zinc-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{s.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{s.onlinePlayers}/{s.maxPlayers} players</span>
                        <span>•</span>
                        <span>{s.serverType}</span>
                      </div>
                    </div>
                    {s.id === currentServer.id && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full border shrink-0 ${currentStatus.border} ${currentStatus.bg}`}
        >
          <span className={`w-2 h-2 rounded-full ${serverStatusError ? "bg-amber-400" : currentStatus.dot}`} />
          <span className={`text-[11px] sm:text-xs font-mono font-medium ${serverStatusError ? "text-amber-400" : currentStatus.textColor}`} title={serverStatusError || undefined}>
            {serverStatusError ? `${currentStatus.label} · stale` : currentStatus.label}
          </span>
        </div>

        {/* Demo Environment Tag (Desktop/Tablet) */}
        <span className="hidden lg:inline-flex px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold tracking-wider bg-zinc-850 text-zinc-400 border border-zinc-700 shrink-0">
          Demo Environment
        </span>

        {/* Uptime (Large desktop) */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-zinc-400 shrink-0">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Uptime:</span>
          <span className="text-zinc-200">
            {serverResources
              ? formatUptime(serverResources.uptimeSeconds)
              : serverResourcesLoading
              ? "Loading…"
              : "Unavailable"}
          </span>
        </div>
      </div>

      {/* Right side: TPS, Power Actions, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* TPS & Ping (Desktop/Tablet) */}
        <div className="hidden md:flex items-center gap-2.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5 text-xs font-mono">
          <span className="text-zinc-400">TPS:</span>
          <span className="text-emerald-400 font-semibold">{currentServer.tps.toFixed(1)}</span>
          <span className="text-zinc-700">|</span>
          <Wifi className="w-3 h-3 text-zinc-500" />
          <span className="text-zinc-300">{currentServer.pingMs}ms</span>
        </div>

        {/* Quick Restart Action (hidden on small mobile to avoid crowding) */}
        <button
          onClick={restartServer}
          disabled={serverStatus !== "ONLINE" || serverAction !== null || pendingServerAction !== null}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            serverStatus === "ONLINE"
              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
              : "opacity-40 cursor-not-allowed bg-zinc-850 text-zinc-500 border-zinc-800"
          }`}
          title="Restart Server"
        >
          <RotateCw className={`w-3.5 h-3.5 ${serverStatus === "RESTARTING" || serverAction === "restart" ? "animate-spin" : ""}`} />
          <span className="hidden md:inline">{serverAction === "restart" ? "Restarting…" : "Restart"}</span>
        </button>

        {/* Quick Stop/Start Action (hidden on small mobile) */}
        {serverStatus === "ONLINE" ? (
          <button
            onClick={stopServer}
            disabled={serverAction !== null || pendingServerAction !== null}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
            title="Stop Server"
          >
            <Power className={`w-3.5 h-3.5 ${serverAction === "stop" ? "animate-pulse" : ""}`} />
            <span className="hidden md:inline">{serverAction === "stop" ? "Stopping…" : "Stop"}</span>
          </button>
        ) : (
          <button
            onClick={startServer}
            disabled={serverStatus !== "OFFLINE" || serverAction !== null || pendingServerAction !== null}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-colors disabled:opacity-40"
            title="Start Server"
          >
            <Power className={`w-3.5 h-3.5 text-emerald-400 ${serverAction === "start" ? "animate-pulse" : ""}`} />
            <span className="hidden md:inline">
              {serverAction === "start" ? "Starting…" : serverStatus === "STARTING" ? "Starting…" : serverStatus === "STOPPING" ? "Stopping…" : "Start"}
            </span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
                {unreadNotifs}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-200">Server Notifications</span>
                  {unreadNotifs > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded">
                      {unreadNotifs} unread
                    </span>
                  )}
                </div>
                {unreadNotifs > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-colors ${
                      notif.read ? "bg-zinc-850/40 opacity-70" : "bg-zinc-850 border border-white/5"
                    } hover:bg-zinc-800`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-zinc-200 leading-snug">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar / Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-white/10 transition-colors"
            aria-label="User Profile"
          >
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-zinc-200">Adarsh</span>
              <span className="text-[10px] font-mono text-zinc-400">Owner</span>
            </div>
            <div className="w-7 h-7 rounded bg-emerald-950 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 shrink-0">
              A
            </div>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1.5 z-50">
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <div className="text-xs font-semibold text-zinc-200">Adarsh Sinha</div>
                <div className="text-[11px] font-mono text-zinc-400 truncate">adarsh@valoriasmp.net</div>
              </div>
              <Link
                href="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Server Settings</span>
              </Link>
              <Link
                href="/activity"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Audit Log</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
