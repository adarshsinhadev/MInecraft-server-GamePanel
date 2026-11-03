import React from "react";

interface SparklineProps {
  data: number[];
  height?: number;
  width?: number | string;
  color?: "emerald" | "gold" | "sky" | "grass";
  showArea?: boolean;
  strokeWidth?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  height = 42,
  width = "100%",
  color = "emerald",
  showArea = true,
  strokeWidth = 2,
  className = "",
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 4;
  const innerHeight = height - paddingY * 2;
  const totalPoints = data.length;

  const colorPalettes = {
    emerald: {
      stroke: "#10b981",
      fillStart: "rgba(16, 185, 129, 0.35)",
      fillEnd: "rgba(16, 185, 129, 0.0)",
    },
    grass: {
      stroke: "#22c55e",
      fillStart: "rgba(34, 197, 94, 0.35)",
      fillEnd: "rgba(34, 197, 94, 0.0)",
    },
    gold: {
      stroke: "#eab308",
      fillStart: "rgba(234, 179, 8, 0.35)",
      fillEnd: "rgba(234, 179, 8, 0.0)",
    },
    sky: {
      stroke: "#38bdf8",
      fillStart: "rgba(56, 189, 248, 0.35)",
      fillEnd: "rgba(56, 189, 248, 0.0)",
    },
  };

  const palette = colorPalettes[color];
  const uniqueId = `sparkline-grad-${color}-${Math.random().toString(36).substr(2, 5)}`;

  // Generate smooth coordinate path
  const points = data.map((val, index) => {
    const x = (index / (totalPoints - 1)) * 100;
    const y = height - paddingY - ((val - min) / range) * innerHeight;
    return { x, y };
  });

  // Build SVG path string with cubic bezier curves
  const linePath = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + point.x) / 2;
    return `${acc} C ${cpX},${prev.y} ${cpX},${point.y} ${point.x},${point.y}`;
  }, "");

  const areaPath = `${linePath} L 100,${height} L 0,${height} Z`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height }}
      >
        <defs>
          <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.fillStart} />
            <stop offset="100%" stopColor={palette.fillEnd} />
          </linearGradient>
        </defs>
        {showArea && (
          <path d={areaPath} fill={`url(#${uniqueId})`} className="transition-all duration-300" />
        )}
        <path
          d={linePath}
          fill="none"
          stroke={palette.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glow end dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2.5"
          fill={palette.stroke}
          className="animate-pulse"
        />
      </svg>
    </div>
  );
};

