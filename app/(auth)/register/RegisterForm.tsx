"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "@/lib/actions/auth";
import { Loader2 } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const res = await registerAction(formData);

    if (res.ok) {
      router.push("/app");
      router.refresh();
    } else {
      setError(res.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] ml-1">Nama Lengkap</label>
        <input
          name="name"
          type="text"
          required
          className="w-full px-5 py-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
          placeholder="John Doe"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] ml-1">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full px-5 py-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
          placeholder="nama@email.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] ml-1">Password</label>
        <input
          name="password"
          type="password"
          required
          className="w-full px-5 py-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
          placeholder="Min. 8 karakter"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 bg-[var(--accent-primary)] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-md"
      >
        {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Daftar & Mulai Kerja"}
      </button>
    </form>
  );
}
