"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Settings,
  Sliders,
  Cpu,
  Clock,
  ShieldAlert,
  Save,
} from "lucide-react";
import { ServerSettings } from "@/types";

export default function SettingsPage() {
  const { settings, updateSettings, addToast } = useServer();

  const [activeTab, setActiveTab] = useState<"general" | "jvm" | "schedules" | "danger">("general");
  const [formData, setFormData] = useState<ServerSettings>({ ...settings });
  const [hasChanges, setHasChanges] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const handleChange = <K extends keyof ServerSettings>(key: K, value: ServerSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setHasChanges(false);
  };

  const renderMinecraftFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(§[0-9a-fk-or])/gi);
    let currentColor = "#ffffff";
    let isBold = false;

    const colorMap: Record<string, string> = {
      "§0": "#000000",
      "§1": "#0000AA",
      "§2": "#00AA00",
      "§3": "#00AAAA",
      "§4": "#AA0000",
      "§5": "#AA00AA",
      "§6": "#FFAA00",
      "§7": "#AAAAAA",
      "§8": "#555555",
      "§9": "#5555FF",
      "§a": "#55FF55",
      "§b": "#55FFFF",
      "§c": "#FF5555",
      "§d": "#FF55FF",
      "§e": "#FFFF55",
      "§f": "#FFFFFF",
    };

    return parts.map((part, index) => {
      if (part.startsWith("§")) {
        const code = part.toLowerCase();
        if (code === "§l") {
          isBold = true;
          return null;
        } else if (code === "§r") {
          currentColor = "#ffffff";
          isBold = false;
          return null;
        } else if (colorMap[code]) {
          currentColor = colorMap[code];
          return null;
        }
      }
      return (
        <span
          key={index}
          style={{
            color: currentColor,
            fontWeight: isBold ? 700 : 400,
          }}
        >
          {part}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Settings
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            server.properties, MOTD preview, and Java runtime options
          </p>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-white/5 overflow-x-auto">
        {[
          { key: "general", label: "General & Properties", icon: Sliders },
          { key: "jvm", label: "JVM & Memory", icon: Cpu },
          { key: "schedules", label: "Schedules", icon: Clock },
          { key: "danger", label: "Danger Zone", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${
                activeTab === tab.key
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* MOTD Live Preview */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-1">
              Server List MOTD Preview
            </h3>
            <p className="text-xs text-zinc-400 mb-3">
              Preview of how the server displays in the Minecraft multiplayer menu.
            </p>

            <div className="p-3.5 rounded-lg bg-black border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <span className="font-mono font-bold text-lg text-emerald-400">V</span>
                </div>
                <div>
                  <div className="text-xs leading-tight">
                    {renderMinecraftFormattedText(formData.motdFirstLine)}
                  </div>
                  <div className="text-[11px] leading-tight mt-1 text-zinc-400">
                    {renderMinecraftFormattedText(formData.motdSecondLine)}
                  </div>
                </div>
              </div>

              <div className="text-right text-xs shrink-0 font-mono">
                <div className="text-emerald-400 font-bold">●●●●●</div>
                <div className="text-zinc-400 text-[10px] mt-0.5">
                  42/{formData.maxPlayers}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5">
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  MOTD Line 1 (§ codes supported)
                </label>
                <input
                  type="text"
                  value={formData.motdFirstLine}
                  onChange={(e) => handleChange("motdFirstLine", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  MOTD Line 2
                </label>
                <input
                  type="text"
                  value={formData.motdSecondLine}
                  onChange={(e) => handleChange("motdSecondLine", e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Properties */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">
              server.properties
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Max Players
                </label>
                <input
                  type="number"
                  value={formData.maxPlayers}
                  onChange={(e) => handleChange("maxPlayers", parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  View Distance (Chunks)
                </label>
                <input
                  type="number"
                  value={formData.viewDistance}
                  onChange={(e) => handleChange("viewDistance", parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Simulation Distance
                </label>
                <input
                  type="number"
                  value={formData.simulationDistance}
                  onChange={(e) => handleChange("simulationDistance", parseInt(e.target.value) || 8)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleChange("difficulty", e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Default Gamemode
                </label>
                <select
                  value={formData.gamemode}
                  onChange={(e) => handleChange("gamemode", e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="survival">Survival</option>
                  <option value="creative">Creative</option>
                  <option value="adventure">Adventure</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Spawn Protection Radius
                </label>
                <input
                  type="number"
                  value={formData.spawnProtection}
                  onChange={(e) => handleChange("spawnProtection", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/5">
              {[
                { key: "pvp", label: "PvP Combat", desc: "Allow player vs player damage" },
                { key: "whiteList", label: "Whitelist", desc: "Enforce whitelist.json" },
                { key: "hardcore", label: "Hardcore", desc: "Ban player upon death" },
                { key: "onlineMode", label: "Online Mode", desc: "Verify Mojang sessions" },
              ].map((toggle) => (
                <div
                  key={toggle.key}
                  onClick={() => handleChange(toggle.key as any, !formData[toggle.key as keyof ServerSettings])}
                  className="p-3 rounded-lg bg-zinc-900 border border-white/5 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-medium text-zinc-200">{toggle.label}</div>
                    <div className="text-[10px] text-zinc-400">{toggle.desc}</div>
                  </div>
                  <div
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors shrink-0 ml-2 ${
                      formData[toggle.key as keyof ServerSettings]
                        ? "bg-emerald-500"
                        : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        formData[toggle.key as keyof ServerSettings] ? "translate-x-3.5" : ""
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </form>
      )}

      {/* JVM Tab */}
      {activeTab === "jvm" && (
        <Card className="p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">
              Java Virtual Machine Options
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Heap allocation and GC parameters for Paper 26.3.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-300">Memory Allocation (Xmx):</span>
              <span className="text-emerald-400 font-bold">{formData.allocatedRamGB} GB DDR4 ECC</span>
            </div>
            <input
              type="range"
              min={8}
              max={32}
              step={2}
              value={formData.allocatedRamGB}
              onChange={(e) => handleChange("allocatedRamGB", parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1">
              <span>8 GB</span>
              <span>16 GB (Configured)</span>
              <span>32 GB (Node Limit)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1">
              Startup Flags
            </label>
            <textarea
              value={formData.jvmFlags}
              onChange={(e) => handleChange("jvmFlags", e.target.value)}
              rows={3}
              className="w-full p-3 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none leading-relaxed"
            />
          </div>
        </Card>
      )}

      {/* Schedules */}
      {activeTab === "schedules" && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">
            Automated Restarts
          </h3>
          <p className="text-xs text-zinc-400">
            Daily reboot cycle to clean unreferenced Java heap and defragment world chunk tables.
          </p>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">Daily Maintenance Restart</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">Schedule: {formData.autoRestartTime}</div>
            </div>
            <Badge variant="emerald" size="sm">
              Active
            </Badge>
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      {activeTab === "danger" && (
        <Card className="p-5 border-rose-500/20 bg-rose-500/[0.01] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Destructive administrative operations.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-zinc-200">Reset Server Instance</div>
              <div className="text-[11px] text-zinc-500">Deletes worlds and resets configuration to defaults.</div>
            </div>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors shrink-0"
            >
              Reset Instance
            </button>
          </div>
        </Card>
      )}

      {/* Reset Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Confirm Instance Reset"
        description="This action will delete all world directories and custom configurations."
        footer={
          <>
            <button
              onClick={() => setResetModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setResetModalOpen(false);
                addToast("Instance reset", "Server reset complete.", "error");
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors"
            >
              Reset Server
            </button>
          </>
        }
      >
        <div className="text-xs text-rose-300">
          Ensure you have downloaded a backup before proceeding.
        </div>
      </Modal>
    </div>
  );
}
