"use client";

import React, { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useServer } from "@/context/ServerContext";
import { useAuth } from "@/context/AuthContext";
import {
  Terminal as TerminalIcon,
  Send,
  Search,
  Download,
  ArrowDown,
  Command,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { ConsoleLog } from "@/types";

type ConsoleConnection = "connecting" | "connected" | "reconnecting" | "error";

export default function ConsolePage() {
  const { serverStatus, currentServer } = useServer();
  const { refreshAuth } = useAuth();
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [connection, setConnection] = useState<ConsoleConnection>("connecting");
  const [paused, setPaused] = useState(false);
  const [commandPending, setCommandPending] = useState(false);
  const [inputCommand, setInputCommand] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [commandHistory, setCommandHistory] = useState<string[]>([
    "/tps",
    "/list",
    "/save-all",
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const pausedRef = useRef(false);
  const pausedLogsRef = useRef<ConsoleLog[]>([]);
  const authRefreshStartedRef = useRef(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      setConnection("error");
      return;
    }

    const socket = io(`${window.location.protocol}//${hostname}:3001`, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      authRefreshStartedRef.current = false;
      setConnection("connected");
    });
    socket.on("disconnect", () => setConnection("reconnecting"));
    socket.io.on("reconnect_attempt", () => setConnection("reconnecting"));
    socket.on("auth:expired", () => void refreshAuth());
    socket.on("console:stream-status", (event: { status?: string }) => {
      if (event?.status === "error") setConnection("error");
      else if (event?.status === "reconnecting") setConnection("reconnecting");
      else if (event?.status === "connecting") setConnection("connecting");
      else if (event?.status === "connected") setConnection("connected");
    });
    socket.on("connect_error", (error) => {
      setConnection("reconnecting");
      if (/auth|session/i.test(error.message) && !authRefreshStartedRef.current) {
        authRefreshStartedRef.current = true;
        void refreshAuth();
      }
    });
    socket.on("console:log", (log: ConsoleLog) => {
      if (!log || typeof log.message !== "string") return;
      if (pausedRef.current) {
        pausedLogsRef.current = [...pausedLogsRef.current, log].slice(-2000);
      } else {
        setConsoleLogs((current) => [...current, log].slice(-2000));
      }
    });
    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refreshAuth]);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs, autoScroll]);

  const handleSendCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = inputCommand.trim();
    if (!cmd) return;

    const socket = socketRef.current;
    if (!socket?.connected || commandPending) return;

    const command = cmd.replace(/^\/+/, "");
    if (!command || command.length > 256 || /[\u0000\r\n]/.test(command)) return;

    setCommandHistory((prev) => [cmd, ...prev.filter((c) => c !== cmd)]);
    setHistoryIndex(-1);
    setInputCommand("");
    setCommandPending(true);
    socket.timeout(10000).emit("console:command", { command }, (timeoutError: Error | null, result: { success: boolean; message?: string; output?: string }) => {
      if (timeoutError) {
        setCommandPending(false);
        const entry: ConsoleLog = {
          id: `result-${Date.now()}`,
          timestamp: new Date().toTimeString().slice(0, 8),
          level: "ERROR",
          source: "RCON",
          message: "Command request timed out. Check the console connection and RCON configuration.",
        };
        if (pausedRef.current) pausedLogsRef.current = [...pausedLogsRef.current, entry].slice(-2000);
        else setConsoleLogs((current) => [...current, entry].slice(-2000));
        return;
      }
      const timestamp = new Date().toTimeString().slice(0, 8);
      const entries: ConsoleLog[] = [
        {
          id: `command-${Date.now()}`,
          timestamp,
          level: "CMD",
          source: "Console",
          message: cmd,
        },
      ];
      const output = result?.output?.trim();
      if (output) {
        entries.push({
          id: `result-${Date.now()}`,
          timestamp: new Date().toTimeString().slice(0, 8),
          level: result.success ? "INFO" : "ERROR",
          source: "RCON",
          message: output,
        });
      } else if (result?.message) {
        entries.push({
          id: `result-${Date.now()}`,
          timestamp: new Date().toTimeString().slice(0, 8),
          level: result.success ? "INFO" : "WARN",
          source: "RCON",
          message: result.message,
        });
      }
      if (pausedRef.current) {
        pausedLogsRef.current = [...pausedLogsRef.current, ...entries].slice(-2000);
      } else {
        setConsoleLogs((current) => [...current, ...entries].slice(-2000));
      }
      setCommandPending(false);
    });
  };

  const togglePause = () => {
    const nextPaused = !pausedRef.current;
    pausedRef.current = nextPaused;
    setPaused(nextPaused);
    if (!nextPaused && pausedLogsRef.current.length > 0) {
      setConsoleLogs((current) => [...current, ...pausedLogsRef.current].slice(-2000));
      pausedLogsRef.current = [];
    }
  };

  const clearConsole = () => {
    setConsoleLogs([]);
    pausedLogsRef.current = [];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(nextIndex);
      setInputCommand(commandHistory[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInputCommand(commandHistory[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCommand("");
      }
    }
  };

  const handleDownloadLogs = () => {
    const text = consoleLogs
      .map((l) => `[${l.timestamp}] [${l.source}/${l.level}]: ${l.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `server-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = consoleLogs.filter((log) => {
    if (filterLevel !== "ALL" && log.level !== filterLevel) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.source.toLowerCase().includes(q) ||
        log.timestamp.includes(q)
      );
    }
    return true;
  });

  const getLevelBadge = (level: ConsoleLog["level"]) => {
    switch (level) {
      case "INFO":
        return <span className="text-zinc-400 font-semibold">[INFO]</span>;
      case "WARN":
        return <span className="text-amber-400 font-semibold">[WARN]</span>;
      case "ERROR":
        return <span className="text-red-400 font-semibold">[ERROR]</span>;
      case "CHAT":
        return <span className="text-emerald-400 font-semibold">[CHAT]</span>;
      case "CMD":
        return <span className="text-purple-400 font-semibold">[CMD]</span>;
      default:
        return <span className="text-zinc-500 font-semibold">[{level}]</span>;
    }
  };

  const quickCommands = [
    { label: "/tps", desc: "View TPS & tick latency" },
    { label: "/list", desc: "Show connected players" },
    { label: "/save-all", desc: "Flush chunks to disk" },
    { label: "/whitelist on", desc: "Enable access whitelist" },
    { label: "/reload confirm", desc: "Reload server configuration" },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 flex flex-col h-[calc(100dvh-7.5rem)] sm:h-[calc(100vh-8.5rem)] min-h-[480px]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-emerald-400" />
            Server Console
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 font-mono">
            Standard output stream for {currentServer.name} (Paper 26.3)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial min-w-[140px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 sm:w-44 font-mono"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-0.5 bg-zinc-900 p-1 rounded-lg border border-white/10 text-xs font-mono overflow-x-auto">
            {["ALL", "INFO", "WARN", "ERROR", "CHAT"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  filterLevel === lvl
                    ? "bg-zinc-800 text-zinc-100 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePause}
              className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
                paused
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-zinc-900 text-zinc-400 border-white/10"
              }`}
              title={paused ? "Resume console stream" : "Pause console display"}
            >
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden md:inline text-[11px]">{paused ? "Resume" : "Pause"}</span>
            </button>
            <button
              onClick={clearConsole}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Clear visible console logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors ${
                autoScroll
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-zinc-900 text-zinc-400 border-white/10"
              }`}
              title={autoScroll ? "Auto-scroll is ON" : "Auto-scroll is OFF"}
            >
              <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? "text-emerald-400" : ""}`} />
              <span className="hidden md:inline text-[11px]">Scroll</span>
            </button>

            <button
              onClick={handleDownloadLogs}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Download log file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Screen Body */}
      <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-[#080b0a] overflow-hidden flex flex-col relative">
        <div className="px-3 sm:px-4 py-2 bg-zinc-900/90 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[11px] sm:text-xs font-mono text-zinc-400 truncate">
              node@hp-node-01: ~/{currentServer.slug}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono text-zinc-500 shrink-0">
            <span className="hidden sm:inline">{filteredLogs.length} lines •</span>
            <span className={
              connection === "connected"
                ? "text-emerald-400"
                : connection === "error"
                ? "text-red-400"
                : "text-amber-400"
            }>
              ● {connection === "connected" ? "Console Live" : connection === "error" ? "Console Unavailable" : "Reconnecting"}
            </span>
            <span className={
              serverStatus === "ONLINE"
                ? "text-emerald-400"
                : serverStatus === "OFFLINE"
                ? "text-zinc-400"
                : "text-amber-400"
            }>
              ● {serverStatus.charAt(0) + serverStatus.slice(1).toLowerCase()}
            </span>
          </div>
        </div>

        {/* Terminal Logs Scroll Area */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto font-mono text-xs sm:text-[13px] leading-relaxed space-y-1 select-text">
          {filteredLogs.length === 0 ? (
            <div className="text-zinc-600 italic py-8 text-center text-xs">
              No log messages matching filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="group flex items-start gap-1.5 sm:gap-2.5 hover:bg-white/[0.02] px-1 py-0.5 rounded transition-colors text-[11px] sm:text-[13px]"
              >
                <span className="text-zinc-600 text-[10px] sm:text-[11px] shrink-0 select-none">
                  [{log.timestamp}]
                </span>
                <span className="shrink-0">{getLevelBadge(log.level)}</span>
                <span className="text-zinc-400 shrink-0 select-none hidden sm:inline">
                  [{log.source}]:
                </span>
                <span
                  className={`break-words flex-1 ${
                    log.level === "ERROR"
                      ? "text-red-400"
                      : log.level === "WARN"
                      ? "text-amber-300"
                      : log.level === "CHAT"
                      ? "text-emerald-300"
                      : log.level === "CMD"
                      ? "text-purple-300"
                      : "text-zinc-300"
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Quick Commands Bar */}
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-950 border-t border-white/5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Command className="w-3 h-3" /> Quick:
          </span>
          {quickCommands.map((q) => (
            <button
              key={q.label}
              onClick={() => {
                setInputCommand(q.label);
                inputRef.current?.focus();
              }}
              className="px-2 py-0.5 sm:py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] sm:text-[11px] font-mono text-zinc-300 hover:text-white border border-white/5 transition-colors shrink-0"
              title={q.desc}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Command Input Form */}
        <form
          onSubmit={handleSendCommand}
          className="p-2.5 sm:p-3 bg-zinc-900 border-t border-white/[0.08] flex items-center gap-2 shrink-0"
        >
          <div className="font-mono text-emerald-400 font-bold px-1 select-none">
            &gt;
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type server command (e.g. /tps, /list)..."
            disabled={serverStatus === "OFFLINE" || connection !== "connected" || commandPending}
            className="flex-1 bg-transparent text-base sm:text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none disabled:opacity-50 min-w-0"
          />

          <button
            type="submit"
            disabled={!inputCommand.trim() || serverStatus === "OFFLINE" || connection !== "connected" || commandPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-black transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Execute</span>
          </button>
        </form>
      </div>
    </div>
  );
}
