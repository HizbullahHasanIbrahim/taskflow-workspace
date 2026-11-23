import Link from "next/link";
import { Compass, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="fluid-glass-elevated max-w-md w-full rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative z-10 border border-[var(--border-strong)] space-y-6">
        {/* Icon Container */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex items-center justify-center mx-auto text-[var(--accent-primary)] shadow-inner">
          <Compass className="w-8 h-8 stroke-[1.75]" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
            Error 404
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
            Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau alamat URL yang dimasukkan kurang tepat.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <LayoutDashboard className="w-4 h-4 stroke-[1.75]" />
            <span>Buka Workspace</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 stroke-[1.75]" />
            <span>Ke Beranda</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
