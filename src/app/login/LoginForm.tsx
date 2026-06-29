"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const authError = searchParams.get("error");
  const passwordReset = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (data.error === "unverified") {
          setError("unverified");
        } else {
          setError(data.error ?? "Invalid email or password.");
        }
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setLoading(false);
      setError("Could not reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">
            Log in to continue tracking your goals.
          </p>

          {passwordReset && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Password updated. Log in with your new password.
            </p>
          )}

          {authError === "auth_callback" && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Email confirmation failed. Try signing up again or request a new
              code.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && error !== "unverified" && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {error === "unverified" && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <p>Please verify your email with the 6-digit code first.</p>
                {email && (
                  <Link
                    href={`/register/verify?email=${encodeURIComponent(email)}`}
                    className="mt-1 inline-block font-medium text-brand-600 hover:text-brand-700"
                  >
                    Enter verification code →
                  </Link>
                )}
              </div>
            )}
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            No account?{" "}
            <Link href="/register" className="font-medium text-brand-600">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
