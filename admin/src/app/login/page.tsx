"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Lock, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed. Check your credentials.");
        return;
      }
      router.replace(from.startsWith("/login") ? "/" : from);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/80 shadow-xl shadow-primary/5">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-xl font-bold tracking-tight">Sign in</CardTitle>
        <CardDescription>Enter your admin credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="relative space-y-1.5">
            <label
              htmlFor="username"
              className="pointer-events-none absolute top-2 left-4 z-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Username
            </label>
            <div className="relative pt-4">
              <User className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                autoComplete="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl pl-10 pt-1"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="relative space-y-1.5">
            <label
              htmlFor="password"
              className="pointer-events-none absolute top-2 left-4 z-10 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Password
            </label>
            <div className="relative pt-4">
              <Lock className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl pl-10 pt-1"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Signing in…" : "Sign in to dashboard"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-12">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-200 hover:scale-[1.02]">
          <Shield className="h-7 w-7" />
        </span>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          SynCity Admin
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Municipal operations dashboard — authorized personnel only.
        </p>
      </div>

      <Suspense fallback={<Card className="h-80 w-full max-w-md animate-pulse rounded-2xl" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        © SynCity · BMSCE MCA Hackathon 2026
      </p>
    </div>
  );
}
