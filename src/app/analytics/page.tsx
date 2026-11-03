"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MinecraftAvatar } from "@/components/ui/MinecraftAvatar";
import {
  BarChart3,
  Users,
  Activity,
  Zap,
  Radio,
  Layers,
} from "lucide-react";

export default function AnalyticsPage() {
  const { currentServer, players } = useServer();
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("24h");

  const playerHourlyDistribution = [
    { hour: "00:00", count: 18 },
    { hour: "02:00", count: 12 },
    { hour: "04:00", count: 9 },
    { hour: "06:00", count: 14 },
    { hour: "08:00", count: 24 },
    { hour: "10:00", count: 38 },
    { hour: "12:00", count: 54 },
    { hour: "14:00", count: 68 },
    { hour: "16:00", count: 76 },
    { hour: "18:00", count: 84 },
    { hour: "20:00", count: 72 },
    { hour: "22:00", count: 42 },
  ];

  const maxHourlyCount = Math.max(...playerHourlyDistribution.map((d) => d.count));

  const topPlayers = [...players]
    .sort((a, b) => b.playtimeHours - a.playtimeHours)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Analytics
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Historical tick rates, player concurrency, and resource metrics
          </p>
        </div>

        {/* Timeframe Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-white/5 self-start sm:self-auto font-mono text-xs">
          {[
            { key: "24h", label: "24 Hours" },
            { key: "7d", label: "7 Days" },
            { key: "30d", label: "30 Days" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTimeframe(item.key as any)}
              className={`px-3 py-1.5 rounded transition-colors ${
                timeframe === item.key
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Peak Concurrency</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-2">
            84 Players
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
            Recorded at 18:00 UTC
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Average Tick Rate</span>
            <Zap className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            19.98 TPS
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
            Target: 20.0 TPS
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Average MSPT</span>
            <Activity className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-2">
            13.4 ms
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
            50.0 ms tick boundary (26.8% used)
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Network Volume</span>
            <Radio className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-2">
            42.8 GB
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5 font-mono">
            In: 9.4 GB • Out: 33.4 GB
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Player Concurrency"
              subtitle="Connected players by hour over selected timeframe"
              badge={
                <Badge variant="emerald" size="sm">
                  Peak: 84
                </Badge>
              }
            />

            <CardBody className="pt-2 pb-5">
              <div className="overflow-x-auto pb-1">
                <div className="h-52 flex items-end justify-between gap-2 pt-6 px-1 min-w-[380px] sm:min-w-0">
                  {playerHourlyDistribution.map((item) => {
                    const heightPercent = (item.count / maxHourlyCount) * 100;

                    return (
                      <div
                        key={item.hour}
                        className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-zinc-200 bg-zinc-900 border border-white/10 px-1 rounded">
                          {item.count}
                        </div>

                        <div className="w-full max-w-[28px] bg-zinc-900 rounded-t overflow-hidden h-36 flex items-end">
                          <div
                            className="w-full bg-emerald-500 rounded-t transition-all duration-300"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>

                        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
                          {item.hour.split(":")[0]}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Peak activity: 18:00 - 20:00 UTC</span>
                <span>Active timezones: US-East / EU</span>
              </div>
            </CardBody>
          </Card>

          {/* TPS Stability Card */}
          <Card>
            <CardHeader
              title="Tick Rate Stability"
              subtitle="Percentage of ticks processed within budget"
              badge={
                <Badge variant="grass" size="sm">
                  Optimal
                </Badge>
              }
            />
            <CardBody>
              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-400">20.0 TPS (Stable)</span>
                    <span className="text-emerald-400 font-semibold">99.8%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "99.8%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-400">19.5 - 19.9 TPS (Minor Variation)</span>
                    <span className="text-amber-400 font-semibold">0.2%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: "0.2%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-400">&lt; 19.0 TPS (Lag Spikes)</span>
                    <span className="text-zinc-500 font-semibold">0.0%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Top Players"
              subtitle="Ranked by total playtime"
            />

            <CardBody className="p-0">
              <div className="divide-y divide-white/[0.04]">
                {topPlayers.map((player, idx) => (
                  <div
                    key={player.id}
                    className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-zinc-500 w-3 text-center">
                        {idx + 1}
                      </span>
                      <MinecraftAvatar
                        name={player.name}
                        rank={player.rank}
                        isOnline={player.online}
                        size={30}
                      />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">
                          {player.name}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          {player.rank || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-xs font-semibold text-zinc-200">
                        {player.playtimeHours.toFixed(1)}h
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {typeof player.balance === "number"
                          ? `$${player.balance.toLocaleString()}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Engine Parameters */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              Engine Configuration
            </h4>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-400">Server Platform</span>
                <span className="text-zinc-200">Paper 26.3</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-400">Network Compression</span>
                <span className="text-zinc-200">Threshold 256</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-zinc-400">Entity Tracking Range</span>
                <span className="text-zinc-200">Default (Paper)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Region Cache Size</span>
                <span className="text-zinc-200">256 files</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
