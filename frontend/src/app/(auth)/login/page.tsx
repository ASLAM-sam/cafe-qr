"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { adminService } from "@/services/apiClient";
import { Coffee, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await adminService.login({ email, password });
      const target =
        typeof window !== "undefined" && window.location.search.includes("cafe=")
          ? `/dashboard${window.location.search}`
          : "/dashboard";
      router.push(target);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message || "Invalid email or password.");
      } else {
        setErrorMessage("Network error connecting to auth service. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.13_0.02_280)] text-[oklch(0.98_0.005_280)] p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,oklch(0.62_0.27_305/16%),transparent_65%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[radial-gradient(circle,oklch(0.55_0.25_270/12%),transparent_65%)] blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white shadow-xl shadow-[oklch(0.62_0.27_305/25%)]">
            <Coffee className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Cafe Login
          </h1>
          <p className="text-xs text-[oklch(0.70_0.03_280)] mt-1.5">
            Sign in to manage your cafe orders and menu
          </p>
        </div>

        <div className="lux-glass rounded-3xl p-6 sm:p-8 border border-[oklch(1_0_0/10%)] shadow-2xl">
          <div className="mb-5 pb-4 border-b border-[oklch(1_0_0/8%)]">
            <h2 className="text-base font-bold text-white">Cafe Owner Sign In</h2>
            <p className="text-xs text-[oklch(0.70_0.03_280)] mt-0.5">
              Enter your email and password to open your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="owner@yourcafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                className="w-full h-11 px-3.5 rounded-xl bg-[oklch(0.15_0.022_280)] border border-[oklch(1_0_0/12%)] text-white placeholder-[oklch(0.70_0.03_280)] text-xs focus:outline-hidden focus:border-[oklch(0.62_0.27_305)] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full h-11 px-3.5 rounded-xl bg-[oklch(0.15_0.022_280)] border border-[oklch(1_0_0/12%)] text-white placeholder-[oklch(0.70_0.03_280)] text-xs focus:outline-hidden focus:border-[oklch(0.62_0.27_305)] transition-colors"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 bg-gradient-to-r from-[oklch(0.62_0.27_305)] to-[oklch(0.55_0.25_270)] text-white font-bold rounded-xl shadow-lg shadow-[oklch(0.62_0.27_305/25%)] hover:opacity-95"
                isLoading={isLoading}
              >
                Sign In to Dashboard
              </Button>
            </div>

            <div className="flex items-center justify-between w-full pt-3 text-[11px] text-[oklch(0.70_0.03_280)] border-t border-[oklch(1_0_0/8%)]">
              <span>Cafe Admin</span>
              <a
                href="/admin"
                className="text-[oklch(0.62_0.27_305)] hover:underline font-semibold"
              >
                Platform Admin →
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
