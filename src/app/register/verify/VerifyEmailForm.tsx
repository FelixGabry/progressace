"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PENDING_PASSWORD_KEY } from "@/app/register/RegisterForm";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/Button";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.toLowerCase() ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Enter the full 6-digit code from your email.");
      return;
    }

    if (!email) {
      setError("Missing email. Please sign up again.");
      return;
    }

    const password = sessionStorage.getItem(PENDING_PASSWORD_KEY);
    if (!password) {
      setError(
        "Session expired. Please sign up again on this browser to continue."
      );
      return;
    }

    setLoading(true);

    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      setLoading(false);
      setError(verifyData.error ?? "Verification failed.");
      return;
    }

    const loginRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    sessionStorage.removeItem(PENDING_PASSWORD_KEY);
    setLoading(false);

    if (!loginRes.ok) {
      const loginData = await loginRes.json();
      setError(
        loginData.error === "unverified"
          ? "Account verified but session failed. Try logging in manually."
          : "Account verified. Please log in with your email and password."
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleResend() {
    if (!email || resendCooldown > 0) return;

    setError("");
    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not resend code.");
      return;
    }

    setResendCooldown(60);
    setCode("");
  }

  if (!email) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <PublicHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-600">
              No email address found. Start registration again.
            </p>
            <Link href="/register" className="mt-6 inline-block">
              <Button>Sign up</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-center text-2xl font-bold text-slate-900">
            Verify your email
          </h1>
          <p className="mt-3 text-center text-sm text-slate-600">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-slate-900">{email}</span>. Read it
            on your phone, type it here on your computer.
          </p>

          <form onSubmit={handleVerify} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="code"
                className="block text-sm font-medium text-slate-700"
              >
                Verification code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="flex h-14 w-full rounded-lg border border-slate-200 bg-white px-3 text-center text-2xl font-semibold tracking-[0.4em] text-slate-900 placeholder:tracking-[0.4em] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying…" : "Verify and continue"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend code"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Check your spam folder if the email does not arrive within a minute.
          </p>

          <p className="mt-6 text-center text-sm text-slate-600">
            Wrong email?{" "}
            <Link href="/register" className="font-medium text-brand-600">
              Sign up again
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
