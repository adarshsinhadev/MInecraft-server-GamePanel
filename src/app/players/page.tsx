"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { MinecraftAvatar } from "@/components/ui/MinecraftAvatar";
import { Modal } from "@/components/ui/Modal";
import {
  Users,
  Search,
  UserCheck,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Player } from "@/types";

function formatPlayerDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function PlayersPage() {
  const {
    players,
    playersLoading,
    playersError,
    refreshPlayers,
    kickPlayer,
    banPlayer,
    unbanPlayer,
    toggleWhitelistPlayer,
  } = useServer();

  const [activeTab, setActiveTab] = useState<"online" | "all" | "whitelist" | "banned">("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [moderationTarget, setModerationTarget] = useState<Player | null>(null);
  const [modalAction, setModalAction] = useState<"kick" | "ban" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [addWhitelistOpen, setAddWhitelistOpen] = useState(false);
  const [newWhitelistName, setNewWhitelistName] = useState("");

  const onlinePlayers = players.filter((p) => p.online);
  const bannedPlayers = players.filter((p) => p.isBanned);
  const whitelistedPlayers = players.filter((p) => p.isWhitelisted);

  const displayedPlayers = players.filter((player) => {
    if (activeTab === "online" && !player.online) return false;
    if (activeTab === "banned" && !player.isBanned) return false;
    if (activeTab === "whitelist" && !player.isWhitelisted) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        player.name.toLowerCase().includes(q) ||
        (player.uuid || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenKick = (player: Player) => {
    setModerationTarget(player);
    setActionReason("Kicked by administrator");
    setModalAction("kick");
  };

  const handleOpenBan = (player: Player) => {
    setModerationTarget(player);
    setActionReason("Violation of server rules");
    setModalAction("ban");
  };

  const handleConfirmKick = async () => {
    if (!moderationTarget || pendingAction) return;
    const username = moderationTarget.name;
    setPendingAction(`kick:${username}`);
    try {
      if (await kickPlayer(username, actionReason.trim() || undefined)) {
        setModalAction(null);
        setModerationTarget(null);
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleConfirmBan = async () => {
    if (!moderationTarget || pendingAction) return;
    const username = moderationTarget.name;
    setPendingAction(`ban:${username}`);
    try {
      if (await banPlayer(username, actionReason.trim() || undefined)) {
        setModalAction(null);
        setModerationTarget(null);
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleUnban = async (username: string) => {
    if (pendingAction) return;
    setPendingAction(`unban:${username}`);
    try {
      await unbanPlayer(username);
    } finally {
      setPendingAction(null);
    }
  };

  const handleWhitelistChange = async (username: string, isWhitelisted: boolean) => {
    if (pendingAction) return;
    setPendingAction(`whitelist:${username}`);
    try {
      await toggleWhitelistPlayer(username, isWhitelisted);
    } finally {
      setPendingAction(null);
    }
  };

  const handleAddWhitelist = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const username = newWhitelistName.trim();
    if (!username || pendingAction) return;
    setPendingAction(`whitelist:${username}`);
    try {
      if (await toggleWhitelistPlayer(username, true)) {
        setNewWhitelistName("");
        setAddWhitelistOpen(false);
      }
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Players
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 font-mono">
            Online roster, player statistics, and moderation
          </p>
        </div>

        <button
          onClick={() => setAddWhitelistOpen(true)}
          className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Whitelist</span>
        </button>
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <Card className="p-3.5 sm:p-4">
          <div className="text-[11px] sm:text-xs text-zinc-400">Online Now</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
            {onlinePlayers.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5">Active sessions</div>
        </Card>

        <Card className="p-3.5 sm:p-4">
          <div className="text-[11px] sm:text-xs text-zinc-400">Total Registered</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 mt-1">
            {players.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5">Known player profiles</div>
        </Card>

        <Card className="p-3.5 sm:p-4">
          <div className="text-[11px] sm:text-xs text-zinc-400">Whitelisted</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-200 mt-1">
            {whitelistedPlayers.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5">Permitted accounts</div>
        </Card>

        <Card className="p-3.5 sm:p-4">
          <div className="text-[11px] sm:text-xs text-zinc-400">Banned Accounts</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 mt-1">
            {bannedPlayers.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5">banned-players.json</div>
        </Card>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-white/5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "online", label: "Online", count: onlinePlayers.length },
            { key: "all", label: "All Players", count: players.length },
            { key: "whitelist", label: "Whitelist", count: whitelistedPlayers.length },
            { key: "banned", label: "Banned", count: bannedPlayers.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${
                activeTab === tab.key
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded bg-zinc-950 text-[10px] font-mono text-zinc-400">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

        </div>
      </div>

      {/* Players Table */}
      <Card>
        {playersError && (
          <div className="m-4 flex items-center justify-between gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
            <span>{playersError}</span>
            <button
              onClick={() => void refreshPlayers()}
              disabled={playersLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-zinc-200 hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${playersLoading ? "animate-spin" : ""}`} />
              Retry
            </button>
          </div>
        )}
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-zinc-900/60 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-5">Player</th>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Vitals</th>
                <th className="py-3 px-4">Playtime</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Ping</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {displayedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-zinc-500">
                    {playersLoading
                      ? "Loading player roster…"
                      : playersError && players.length === 0
                      ? "Player roster could not be loaded."
                      : players.length === 0 && !playersError
                      ? "No player profiles are available yet."
                      : "No players found matching current filter."}
                  </td>
                </tr>
              ) : (
                displayedPlayers.map((player) => {
                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Player */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <MinecraftAvatar
                            name={player.name}
                            isOnline={player.online}
                            size={32}
                          />
                          <div>
                            <div className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
                              <span>{player.name}</span>
                              {player.isBanned && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[10px] font-mono">
                                  Banned
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 truncate max-w-[130px]">
                              {player.uuid ? `${player.uuid.slice(0, 14)}…` : "—"}
                            </div>
                            <div className="text-[10px] text-zinc-600">
                              First seen: {formatPlayerDate(player.firstSeen)}
                            </div>
                            <div className="text-[10px] text-zinc-600">
                              Last seen: {formatPlayerDate(player.lastSeen)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rank */}
                      <td className="py-3 px-4">
                        <span className="text-zinc-500">—</span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 font-mono">
                        <span className="text-zinc-500">—</span>
                      </td>

                      {/* Vitals */}
                      <td className="py-3 px-4">
                        <span className="text-zinc-500 font-mono">—</span>
                      </td>

                      {/* Playtime */}
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {Number.isFinite(player.playtimeHours) ? `${player.playtimeHours.toFixed(1)}h` : "—"}
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        —
                      </td>

                      {/* Ping */}
                      <td className="py-3 px-4 font-mono">
                        <span className="text-zinc-500">—</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {player.isBanned ? (
                            <button
                              onClick={() => void handleUnban(player.name)}
                              disabled={pendingAction !== null}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-emerald-400 border border-white/5 text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              {pendingAction === `unban:${player.name}` ? "Working…" : "Unban"}
                            </button>
                          ) : (
                            <>
                              {player.online && (
                                <button
                                  onClick={() => handleOpenKick(player)}
                                  disabled={pendingAction !== null}
                                  className="px-2 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 text-[11px] font-medium transition-colors disabled:opacity-50"
                                  title="Kick player"
                                >
                                  Kick
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenBan(player)}
                                disabled={pendingAction !== null}
                                className="px-2 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-rose-400 text-[11px] font-medium transition-colors disabled:opacity-50"
                                title="Ban player"
                              >
                                Ban
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => void handleWhitelistChange(player.name, !player.isWhitelisted)}
                            disabled={pendingAction !== null}
                            className={`p-1.5 rounded border text-[11px] transition-colors disabled:opacity-50 ${
                              player.isWhitelisted
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-zinc-850 text-zinc-400 border-white/5"
                            }`}
                            title={
                              player.isWhitelisted
                                ? "Remove from whitelist"
                                : "Add to whitelist"
                            }
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Kick Modal */}
      <Modal
        isOpen={modalAction === "kick"}
        onClose={() => setModalAction(null)}
        title={`Kick Player: ${moderationTarget?.name}`}
        description="Disconnects the player from the active server session."
        footer={
          <>
            <button
              onClick={() => setModalAction(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmKick}
              disabled={pendingAction !== null}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50"
            >
              {pendingAction?.startsWith("kick:") ? "Kicking…" : "Confirm Kick"}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Reason
          </label>
          <input
            type="text"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </Modal>

      {/* Ban Modal */}
      <Modal
        isOpen={modalAction === "ban"}
        onClose={() => setModalAction(null)}
        title={`Ban Player: ${moderationTarget?.name}`}
        description="Permanently bans this player and disconnects an active session."
        footer={
          <>
            <button
              onClick={() => setModalAction(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBan}
              disabled={pendingAction !== null}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors disabled:opacity-50"
            >
              {pendingAction?.startsWith("ban:") ? "Banning…" : "Enforce Permanent Ban"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
          </div>

        </div>
      </Modal>

      {/* Add Whitelist Modal */}
      <Modal
        isOpen={addWhitelistOpen}
        onClose={() => setAddWhitelistOpen(false)}
        title="Add to Whitelist"
        description="Allows player to join when whitelist is enabled in server.properties."
        footer={
          <>
            <button
              onClick={() => setAddWhitelistOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleAddWhitelist()}
              disabled={!newWhitelistName.trim() || pendingAction !== null}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors disabled:opacity-50"
            >
              {pendingAction?.startsWith("whitelist:") ? "Adding…" : "Add Entry"}
            </button>
          </>
        }
      >
        <form onSubmit={(event) => void handleAddWhitelist(event)}>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Minecraft Username
          </label>
          <input
            type="text"
            value={newWhitelistName}
            onChange={(e) => setNewWhitelistName(e.target.value)}
            placeholder="e.g. Steve"
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          />
        </form>
      </Modal>
    </div>
  );
}
