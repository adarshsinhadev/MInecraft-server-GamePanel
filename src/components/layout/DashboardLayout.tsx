"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ToastContainer } from "@/components/ui/Toast";
import { ServerActionConfirmation } from "./ServerActionConfirmation";

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { status, error, refreshAuth } = useAuth();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage && status === "authenticated") {
      router.replace("/");
    } else if (!isLoginPage && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [isLoginPage, router, status]);

  if (
    status === "checking" ||
    (status === "loading" && !isLoginPage) ||
    (isLoginPage && status === "authenticated")
  ) {
    return (
      <div className="min-h-screen bg-[#090c0b] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-zinc-400" role="status">
          <span className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          Checking your session…
        </div>
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;

  if (status === "unauthenticated") {
    return <div className="min-h-screen bg-[#090c0b]" aria-hidden="true" />;
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#090c0b] text-zinc-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1311] p-6 text-center shadow-2xl">
          <h1 className="text-lg font-semibold">Could not verify your session</h1>
          <p className="mt-2 text-sm text-zinc-400">{error || "The authentication service is unavailable."}</p>
          <button
            type="button"
            onClick={() => void refreshAuth()}
            className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090c0b] text-zinc-100 flex flex-col font-sans bg-grid-subtle selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sidebar with mobile drawer support */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Layout Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <TopBar
          collapsed={collapsed}
          onOpenMobileNav={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-8 max-w-[1600px] w-full min-w-0 mx-auto">
          {children}
        </main>
      </div>

      {/* Global Toast manager */}
      <ToastContainer />
      <ServerActionConfirmation />
    </div>
  );
};
