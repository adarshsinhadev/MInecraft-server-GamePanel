"use client";

import React from "react";
import { useServer, ToastMessage } from "@/context/ServerContext";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useServer();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-valoria-emerald shrink-0" />,
  };

  const borders = {
    success: "border-emerald-500/30 bg-valoria-900/95",
    error: "border-red-500/30 bg-valoria-900/95",
    warning: "border-amber-500/30 bg-valoria-900/95",
    info: "border-valoria-emerald/30 bg-valoria-900/95",
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${borders[toast.type]} shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-2`}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-zinc-100 leading-tight">{toast.title}</h4>
        {toast.description && (
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed break-words">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-white/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

