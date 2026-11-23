import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { InteractivePreview } from "@/components/landing/InteractivePreview";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Sparkles,
  Layout,
  Database,
  Zap,
  MousePointer2,
  ShieldCheck,
  Lock,
  Command,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen">
      <SmoothScroll />
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      {/* Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--bg-ambient-1)] blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--bg-ambient-2)] blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-36 sm:pt-44 pb-20 px-6 max-w-7xl mx-auto text-center">
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[var(--text-primary)] mb-6 leading-[1.08] max-w-4xl mx-auto">
          Kelola Tugas dengan Kejelasan Mutlak.
        </h1>

        <p className="max-w-xl mx-auto text-[var(--text-secondary)] text-base sm:text-lg mb-10 leading-relaxed font-sans">
          Satu alur kerja terpadu untuk fokus harian Anda. Cepat, instan tanpa jeda, dan dirancang dengan ketenangan Apple Fluid Productivity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-7 py-3.5 bg-[var(--accent-primary)] text-white rounded-xl text-sm font-semibold shadow-md hover:bg-[var(--accent-hover)] transition-all active:scale-95"
          >
            Mulai Gratis Sekarang
          </Link>
          <Link
            href="#multi-view"
            className="w-full sm:w-auto px-7 py-3.5 fluid-glass rounded-xl text-sm font-semibold hover:bg-[var(--glass-hover)] transition-all active:scale-95 text-[var(--text-primary)]"
          >
            Lihat Fitur
          </Link>
        </div>

        {/* Interactive Preview in Hero/Multi-View */}
        <section id="multi-view" className="mt-16 sm:mt-20">
          <InteractivePreview />
        </section>
      </section>

      {/* Bento Grid Features (Komposisi Asimetris) */}
      <section id="fitur" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
            Dirancang untuk Kecepatan Berpikir
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Setiap interaksi dipangkas hingga seminimal mungkin agar Anda dapat mencatat dan menyelesaikan tugas tanpa hambatan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Kartu Utama: Smart Quick-Add (md:col-span-2) */}
          <div className="md:col-span-2 rounded-2xl fluid-glass p-6 sm:p-8 flex flex-col justify-between border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center border border-[var(--border-hairline)] text-amber-500 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">
                Smart Quick-Add
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xl">
                Ketik tugas apa pun dalam satu baris kalimat alami. Parser NLP otomatis membedah judul, tanggal tenggat, tingkat prioritas, dan label proyek tanpa perlu membuka banyak dialog form.
              </p>
            </div>

            {/* Cuplikan Visual Statis Smart Quick-Add */}
            <div className="mt-6 p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)]/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-primary)]">
                <span className="text-[var(--accent-primary)] font-bold">&gt;</span>
                <span className="truncate">Revisi proposal skripsi besok !tinggi #kuliah</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-hairline)] text-[11px] font-sans">
                <span className="text-[var(--text-tertiary)] text-[10px]">Terdeteksi:</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                  Besok
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                  Tinggi
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[var(--surface-solid)] text-[var(--text-secondary)] border border-[var(--border-hairline)] font-medium">
                  #kuliah
                </span>
              </div>
            </div>
          </div>

          {/* Kartu Sekunder 1: Tiga Sudut Pandang */}
          <div className="rounded-2xl fluid-glass p-6 sm:p-7 flex flex-col justify-between border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center border border-[var(--border-hairline)] text-blue-500 mb-4">
                <Layout className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                Tiga Sudut Pandang
              </h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                List View berurutan, Kanban Board drag-and-drop, dan Kalender bulanan yang bersinkronisasi secara real-time dari satu sumber data tunggal.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[var(--text-tertiary)] pt-3 border-t border-[var(--border-hairline)]">
              <span>List</span>
              <span>•</span>
              <span>Board</span>
              <span>•</span>
              <span>Kalender</span>
            </div>
          </div>

          {/* Kartu Sekunder 2: Urutan Instan Tanpa Lag */}
          <div className="rounded-2xl fluid-glass p-6 sm:p-7 flex flex-col justify-between border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center border border-[var(--border-hairline)] text-purple-500 mb-4">
                <MousePointer2 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                Urutan Instan Tanpa Lag
              </h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                Optimistic UI dengan algoritma float gap (1024) dan normalisasi posisi di background. Setiap perpindahan kartu berlangsung seketika tanpa jeda jaringan.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[var(--text-tertiary)] pt-3 border-t border-[var(--border-hairline)]">
              <span>Float Gap DnD</span>
              <span>•</span>
              <span>Auto-Rollback</span>
            </div>
          </div>

          {/* Kartu Sekunder 3: Navigasi Keyboard-First (md:col-span-2) */}
          <div className="md:col-span-2 rounded-2xl fluid-glass p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors">
            <div className="max-w-md">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-subtle)] flex items-center justify-center border border-[var(--border-hairline)] text-emerald-500 mb-4">
                <Command className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
                Navigasi Keyboard-First
              </h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                Kendalikan seluruh aplikasi tanpa mengangkat tangan dari keyboard. Cari tugas, buat item baru, atau ganti tampilan lewat pintasan global.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <kbd className="px-2 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--border-hairline)] font-mono text-[10px] text-[var(--text-primary)]">
                  ⌘K
                </kbd>
                <span>Command Palette</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <kbd className="px-2 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--border-hairline)] font-mono text-[10px] text-[var(--text-primary)]">
                  N
                </kbd>
                <span>Tugas Baru</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <kbd className="px-2 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--border-hairline)] font-mono text-[10px] text-[var(--text-primary)]">
                  1-3
                </kbd>
                <span>Ganti Tampilan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Architecture Section */}
      <section id="keamanan" className="py-20 px-6 max-w-5xl mx-auto text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3 text-[var(--text-primary)]">
          Arsitektur &amp; Keamanan
        </h2>
        <p className="text-[var(--text-secondary)] mb-12 text-sm sm:text-base max-w-2xl mx-auto">
          Dibangun dengan standar rekayasa perangkat lunak produksi untuk menjamin privasi, integritas data, dan ketahanan terhadap celah keamanan modern.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          <SecurityCard
            icon={<Lock className="w-5 h-5" />}
            title="Sesi HttpOnly & Bcrypt"
            description="Token sesi JWT dienkripsi dan disimpan di cookie HttpOnly dengan flag SameSite=Lax. Password diamankan menggunakan algoritma Bcrypt (salt 10 rounds)."
          />
          <SecurityCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Anti-IDOR & Zod v4"
            description="Seluruh Server Actions mewajibkan validasi skema Zod yang ketat dan memverifikasi kepemilikan userId pengguna aktif sebelum menjalankan mutasi."
          />
          <SecurityCard
            icon={<Database className="w-5 h-5" />}
            title="Prisma v6 & MySQL ACID"
            description="Instance database tunggal terproteksi memory leak di Next.js App Router, dieksekusi dengan transaksi ACID MySQL untuk rebalance posisi instan."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-hairline)] py-10 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-bold text-sm text-[var(--text-primary)]">TaskFlow Workspace</span>
        </div>

        <p className="text-xs text-[var(--text-tertiary)]">
          &copy; 2026 TaskFlow. Next.js 16, Prisma v6, MySQL, dan Apple Fluid Productivity.
        </p>

        <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
          <ThemeToggle />
          <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">Masuk</Link>
          <Link href="/register" className="hover:text-[var(--text-primary)] transition-colors">Daftar</Link>
        </div>
      </footer>
    </main>
  );
}

function SecurityCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex flex-col">
      <div className="w-10 h-10 rounded-xl bg-[var(--surface-solid)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent-primary)] mb-4 shadow-2xs">
        {icon}
      </div>
      <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}
