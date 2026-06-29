"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ProfileForm({
  initialName,
  email,
  emailVerified,
  memberSince,
}: {
  initialName: string;
  email: string;
  emailVerified: string | null;
  memberSince: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Failed to update profile.");
        return;
      }

      setSaved(true);
    } catch {
      setLoading(false);
      setError("Could not reach the server.");
    }
  }

  async function handleDeleteAccount() {
    const confirmed = confirm(
      "Delete your account permanently? All goals and progress will be removed. You can register again with the same email."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete account.");
        setDeleting(false);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setDeleting(false);
    }
  }

  return (
    <div className="mt-8 max-w-md space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">Edit profile</h2>
        <Input
          id="name"
          label="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {saved && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Profile updated.
          </p>
        )}
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Saving…" : "Save name"}
        </Button>
      </form>

      <dl className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <dt className="text-sm text-slate-500">Email</dt>
          <dd className="mt-1 font-medium text-slate-900">{email}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Email verified</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {emailVerified ?? "Not verified"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Member since</dt>
          <dd className="mt-1 font-medium text-slate-900">{memberSince}</dd>
        </div>
      </dl>

      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="font-semibold text-slate-900">Delete account</h2>
        <p className="mt-1 text-sm text-slate-600">
          Remove your account to test registration again, or leave the app
          permanently. This cannot be undone.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={deleting}
          onClick={handleDeleteAccount}
          className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
        >
          {deleting ? "Deleting…" : "Delete my account"}
        </Button>
      </div>
    </div>
  );
}
