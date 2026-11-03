"use client";

import React, { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, error: authError, clearError } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    clearError();

    try {
      await login({ userId, password, secretKey });
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to sign in. Please try again.");
      setIsSubmitting(false);
    }
  };

  const visibleError = formError || authError;

  return (
    <main className="min-h-screen bg-[#090c0b] text-zinc-100 flex items-center justify-center px-4 py-10 bg-grid-subtle">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-lg shadow-emerald-950/30">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-400">ValoriaSMP</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Server Control Panel</h1>
          <p className="mt-2 text-sm text-zinc-500">Sign in to manage your server</p>
        </div>

        <section className="rounded-2xl border border-white/[0.09] bg-[#0e1311] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="userId" className="mb-2 block text-xs font-medium text-zinc-300">User ID</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  autoComplete="username"
                  required
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#090c0b] py-3 pl-10 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Enter your user ID"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-medium text-zinc-300">Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#090c0b] py-3 pl-10 pr-11 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="secretKey" className="mb-2 block text-xs font-medium text-zinc-300">Secret key</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="secretKey"
                  name="secretKey"
                  type={showSecretKey ? "text" : "password"}
                  autoComplete="off"
                  required
                  value={secretKey}
                  onChange={(event) => setSecretKey(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#090c0b] py-3 pl-10 pr-11 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Enter your secret key"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-200"
                  aria-label={showSecretKey ? "Hide secret key" : "Show secret key"}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {visibleError && (
              <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3.5 py-3 text-sm text-red-300">
                {visibleError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting && <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>

        <p className="mt-5 text-center text-[11px] text-zinc-600">Authorized access only</p>
      </div>
    </main>
  );
}
