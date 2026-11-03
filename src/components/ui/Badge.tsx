import React from "react";

export type BadgeVariant =
  | "emerald"
  | "gold"
  | "grass"
  | "rose"
  | "amber"
  | "sky"
  | "purple"
  | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "emerald",
  children,
  size = "md",
  dot = false,
  className = "",
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/25",
      dotColor: "bg-emerald-400",
    },
    gold: {
      bg: "bg-amber-500/10",
      text: "text-amber-300",
      border: "border-amber-500/30",
      dotColor: "bg-amber-400",
    },
    grass: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      border: "border-green-500/25",
      dotColor: "bg-green-400",
    },
    rose: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/30",
      dotColor: "bg-rose-400",
    },
    amber: {
      bg: "bg-amber-500/15",
      text: "text-amber-400",
      border: "border-amber-500/30",
      dotColor: "bg-amber-400",
    },
    sky: {
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      border: "border-sky-500/25",
      dotColor: "bg-sky-400",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-300",
      border: "border-purple-500/25",
      dotColor: "bg-purple-400",
    },
    neutral: {
      bg: "bg-zinc-800/60",
      text: "text-zinc-400",
      border: "border-zinc-700/50",
      dotColor: "bg-zinc-400",
    },
  };

  const style = variantStyles[variant];
  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor} shrink-0 animate-pulse`} />}
      <span>{children}</span>
    </span>
  );
};

