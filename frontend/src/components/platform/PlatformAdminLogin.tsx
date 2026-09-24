"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { platformService } from "@/services/apiClient";
import { ShieldCheck, Lock, Loader2, ArrowRight } from "lucide-react";
import { User } from "@/types";

interface PlatformAdminLoginProps {
  onLoginSuccess: (user: User) => void;
}

export function PlatformAdminLogin({ onLoginSuccess }: PlatformAdminLoginProps) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await platformService.login({
        username: cleanUsername,
        password,
      });

      if (res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message || "Invalid username or password.");
      } else {
        setErrorMessage("Network error connecting to platform authentication service.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.13_0.02_280)] text-[oklch(0.98_0.005_280)] p-4 relative overflow-hidden">
      {/* Ambient Radial Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[radial-gradient(circle,oklch(0.62_0.27_305/18%),transparent_65%)] blur-3xl pointer-events-none animate-lux-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle,oklch(0.55_0.25_270/12%),transparent_65%)] blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-xl shadow-[oklch(0.62_0.27_305/30%)]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Platform Administration
          </h1>
          <p className="text-xs text-[oklch(0.70_0.03_280)] mt-2">
            Secure management console for multi-tenant café provisioning
          </p>
        </div>

        {/* Login Card */}
        <div className="lux-glass rounded-3xl p-6 sm:p-8 border border-[oklch(1_0_0/10%)] shadow-2xl">
          <div className="flex items-center justify-between pb-5 border-b border-[oklch(1_0_0/8%)] mb-6">
            <div>
              <h2 className="text-base font-bold text-white">
                Platform Owner Sign In
              </h2>
              <p className="text-[11px] text-[oklch(0.70_0.03_280)] mt-0.5">
                Restricted to authorized SaaS administrators
              </p>
            </div>
            <span className="rounded-full bg-[oklch(0.82_0.14_85/15%)] border border-[oklch(0.82_0.14_85/35%)] px-2.5 py-0.5 text-[10px] font-bold text-[oklch(0.82_0.14_85)] uppercase tracking-wider">
              Root Access
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2.5 animate-in fade-in">
                <Lock className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Administrator Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="aslam"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={isLoading}
                className="w-full h-11 px-3.5 rounded-xl bg-[oklch(0.15_0.022_280)] border border-[oklch(1_0_0/12%)] text-white placeholder-[oklch(0.70_0.03_280)] text-xs focus:outline-hidden focus:border-[oklch(0.62_0.27_305)] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="w-full h-11 px-3.5 rounded-xl bg-[oklch(0.15_0.022_280)] border border-[oklch(1_0_0/12%)] text-white placeholder-[oklch(0.70_0.03_280)] text-xs focus:outline-hidden focus:border-[oklch(0.62_0.27_305)] transition-colors"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] hover:opacity-95 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-[oklch(0.62_0.27_305/25%)] transition-opacity"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Authenticate Platform</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-[oklch(0.70_0.03_280)]">
          Café QR SaaS &mdash; Single Platform, Infinite Cafés
        </div>
      </div>
    </div>
  );
}
