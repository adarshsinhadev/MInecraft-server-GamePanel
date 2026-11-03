"use client";

import React, { useState } from "react";
import { PlayerRank } from "@/types";

interface MinecraftAvatarProps {
  name: string;
  size?: number;
  rank?: PlayerRank;
  isOnline?: boolean;
  className?: string;
}

export const MinecraftAvatar: React.FC<MinecraftAvatarProps> = ({
  name,
  size = 36,
  rank,
  isOnline,
  className = "",
}) => {
  const [hasError, setHasError] = useState(false);

  // Generate deterministic background color from player name
  const getInitialsBg = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hues = [150, 160, 170, 200, 220, 260, 30];
    const hue = hues[Math.abs(hash) % hues.length];
    return `hsl(${hue}, 40%, 25%)`;
  };

  const rankBorders: Record<PlayerRank, string> = {
    Owner: "ring-2 ring-amber-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]",
    Admin: "ring-2 ring-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.3)]",
    Mod: "ring-2 ring-purple-400/80 shadow-[0_0_8px_rgba(192,132,252,0.3)]",
    "VIP+": "ring-2 ring-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.3)]",
    VIP: "ring-2 ring-emerald-500/60",
    Member: "ring-1 ring-zinc-700",
  };

  const ringClass = rank ? rankBorders[rank] : "ring-1 ring-white/10";

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`rounded-lg overflow-hidden transition-all duration-200 ${ringClass}`}
        style={{ width: size, height: size }}
      >
        {!hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}/${size}`}
            alt={name}
            width={size}
            height={size}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover rendering-pixelated"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-mono font-bold text-xs text-white uppercase select-none"
            style={{ backgroundColor: getInitialsBg(name) }}
          >
            {name.slice(0, 2)}
          </div>
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-valoria-900 ${
            isOnline ? "bg-emerald-400" : "bg-zinc-600"
          }`}
        />
      )}
    </div>
  );
};

