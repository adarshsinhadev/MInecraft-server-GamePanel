"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  History,
  Search,
  Download,
  Shield,
  Users,
  Server,
  ArchiveRestore,
  FileCode,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ActivityPage() {
  const { activities, addToast } = useServer();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = activities.filter((event) => {
    if (filterType !== "ALL" && event.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        event.actor.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const text = JSON.stringify(activities, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Export complete", "Audit trail saved as JSON.", "info");
  };

  const typeConfig: Record<string, { label: string; icon: any; color: "sky" | "rose" | "emerald" | "gold" | "purple" | "neutral" }> = {
    player: { label: "Player", icon: Users, color: "sky" },
    moderation: { label: "Moderation", icon: Shield, color: "rose" },
    server: { label: "Server", icon: Server, color: "emerald" },
    backup: { label: "Backup", icon: ArchiveRestore, color: "gold" },
    file: { label: "File", icon: FileCode, color: "purple" },
    security: { label: "Security", icon: AlertTriangle, color: "rose" },
  };

  const severityDot = {
    info: "bg-zinc-500",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Activity
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Chronological server and administrative event log
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-white/10 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Log</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: "ALL", label: "All Events" },
            { key: "moderation", label: "Moderation" },
            { key: "server", label: "Server" },
            { key: "player", label: "Player" },
            { key: "backup", label: "Backups" },
            { key: "file", label: "Files" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterType(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                filterType === cat.key
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-full sm:w-56 font-mono"
          />
        </div>
      </div>

      {/* Activity Timeline Card */}
      <Card>
        <CardBody className="p-0">
          <div className="divide-y divide-white/[0.04]">
            {filteredEvents.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 text-xs">
                No activity entries found matching current filter.
              </div>
            ) : (
              filteredEvents.map((act) => {
                const conf = typeConfig[act.type] || typeConfig.server;
                const isExpanded = expandedId === act.id;

                return (
                  <div
                    key={act.id}
                    className="p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            severityDot[act.severity]
                          }`}
                        />

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xs font-semibold text-zinc-200">
                              {act.title}
                            </h4>
                            <Badge variant={conf.color} size="sm">
                              {conf.label}
                            </Badge>
                          </div>

                          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                            {act.description}
                          </p>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-1.5">
                            <span>Actor:</span>
                            <span className="text-zinc-300 font-medium">
                              {act.actor.name} ({act.actor.role})
                            </span>
                            <span>•</span>
                            <span>ID: {act.id}</span>
                          </div>

                          {act.metadata && (
                            <div className="mt-2">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : act.id)}
                                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                              >
                                <span>{isExpanded ? "Hide Details" : "Details"}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="mt-2 p-2.5 rounded bg-zinc-950 border border-white/5 font-mono text-xs text-zinc-300 space-y-1">
                                  {Object.entries(act.metadata).map(([key, val]) => (
                                    <div key={key} className="flex gap-2">
                                      <span className="text-zinc-500">{key}:</span>
                                      <span className="text-zinc-300">{val}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono text-zinc-400">
                          {act.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
