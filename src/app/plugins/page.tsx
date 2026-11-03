"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Package,
  Search,
  Download,
  RotateCw,
  Power,
  Plus,
  Check,
  ArrowUpCircle,
} from "lucide-react";
import { PluginData } from "@/types";

export default function PluginsPage() {
  const { plugins, togglePlugin, updatePlugin, installPlugin, addToast } = useServer();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  const curatedMarketplace: Partial<PluginData>[] = [
    {
      id: "viaversion",
      name: "ViaVersion",
      version: "5.1.0",
      author: "MylesMc",
      description: "Allows newer Minecraft client versions to connect to your Paper server.",
      category: "Administration",
      fileSizeKB: 1420,
    },
    {
      id: "protocollib",
      name: "ProtocolLib",
      version: "5.3.0",
      author: "dmulloy2",
      description: "Provides access to the Minecraft packet protocol for dependent plugins.",
      category: "Performance",
      fileSizeKB: 2150,
    },
    {
      id: "tab",
      name: "TAB",
      version: "4.1.8",
      author: "NEZNAMY",
      description: "Player list, nametags, and scoreboard formatting.",
      category: "Chat",
      fileSizeKB: 840,
    },
    {
      id: "fawe",
      name: "FastAsyncWorldEdit",
      version: "2.11.2",
      author: "IntellectualSites",
      description: "Asynchronous WorldEdit implementation to prevent tick pauses during operations.",
      category: "Performance",
      fileSizeKB: 6840,
    },
  ];

  const handleCheckUpdates = () => {
    setCheckingUpdates(true);
    setTimeout(() => {
      setCheckingUpdates(false);
      addToast("Update check complete", "2 plugins have updates available.", "info");
    }, 1000);
  };

  const filteredPlugins = plugins.filter((plugin) => {
    if (selectedCategory !== "ALL" && plugin.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        plugin.name.toLowerCase().includes(q) ||
        plugin.author.toLowerCase().includes(q) ||
        plugin.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categoryBadges: Record<string, "emerald" | "gold" | "rose" | "purple" | "sky" | "grass"> = {
    Administration: "emerald",
    Protection: "gold",
    Performance: "grass",
    Economy: "gold",
    Gameplay: "purple",
    Chat: "sky",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            Plugins
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            {plugins.length} installed server extensions (/plugins)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCheckUpdates}
            disabled={checkingUpdates}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-white/10 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${checkingUpdates ? "animate-spin" : ""}`} />
            <span>Check Updates</span>
          </button>

          <button
            onClick={() => setCatalogModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Install Plugin</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            "ALL",
            "Administration",
            "Protection",
            "Performance",
            "Economy",
            "Gameplay",
            "Chat",
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-full sm:w-56 font-mono"
          />
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPlugins.map((plugin) => (
          <Card
            key={plugin.id}
            className={`p-4 flex flex-col justify-between ${
              !plugin.enabled ? "opacity-50" : ""
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100 font-mono">
                      {plugin.name}
                    </h3>
                    <Badge variant={categoryBadges[plugin.category] || "neutral"} size="sm">
                      {plugin.category}
                    </Badge>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    by {plugin.author}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-zinc-300">
                    v{plugin.version}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {(plugin.fileSizeKB / 1024).toFixed(1)} MB
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed min-h-[2.5rem]">
                {plugin.description}
              </p>

              {plugin.updateAvailable && (
                <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    v{plugin.newVersion} available
                  </span>
                  <button
                    onClick={() => updatePlugin(plugin.id)}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[10px] rounded transition-colors"
                  >
                    Update
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500">
                {plugin.enabled ? "Enabled" : "Disabled"}
              </span>

              <button
                onClick={() => togglePlugin(plugin.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  plugin.enabled
                    ? "bg-zinc-800 text-zinc-200 border-white/10 hover:bg-zinc-750"
                    : "bg-zinc-900 text-zinc-500 border-white/5 hover:text-zinc-300"
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{plugin.enabled ? "Disable" : "Enable"}</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Install Plugin Modal */}
      <Modal
        isOpen={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        title="Install Plugin"
        description="Select verified plugins to install to your /plugins directory."
        maxWidth="lg"
      >
        <div className="space-y-3">
          {curatedMarketplace.map((item) => {
            const isInstalled = plugins.some(
              (p) => p.name.toLowerCase() === item.name?.toLowerCase()
            );

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-100 font-mono">
                      {item.name}
                    </h4>
                    <span className="text-xs font-mono text-zinc-400">
                      v{item.version}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{item.description}</p>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">
                    by {item.author}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!isInstalled) {
                      installPlugin(item);
                    }
                  }}
                  disabled={isInstalled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    isInstalled
                      ? "bg-zinc-850 text-zinc-500 border border-white/5 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-400 text-black"
                  }`}
                >
                  {isInstalled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Installed</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Install</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
