"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { platformService } from "@/services/apiClient";
import { Shield, Lock, Loader2, ArrowRight } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Platform Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl">
            <Shield className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Platform Administration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with your administrator username and password to manage all cafés
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white font-bold">
                Platform Owner Sign In
              </CardTitle>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Root Access
              </span>
            </div>
            <CardDescription className="text-slate-400 text-xs">
              This area is restricted to authorized platform administrators.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
                  <Lock className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Input
                label="Username"
                type="text"
                placeholder="aslam"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={isLoading}
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-400"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-400"
              />
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 transition-colors shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center text-xs text-slate-500">
          Café QR Ordering SaaS &mdash; Single Platform, Infinite Cafés
        </div>
      </div>
    </div>
  );
}
