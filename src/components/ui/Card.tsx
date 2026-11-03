import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`rounded-xl bg-[#0f1412] border border-white/[0.08] transition-colors ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, badge, action, className = "" }) => {
  return (
    <div className={`px-5 py-4 flex items-center justify-between border-b border-white/[0.06] ${className}`}>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-zinc-100 text-sm tracking-tight">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};
