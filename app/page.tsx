import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { InteractivePreview } from "@/components/landing/InteractivePreview";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Sparkles, Layout, Database, Zap, MousePointer2, ShieldCheck, Lock, Fingerprint } from "lucide-react";
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
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full fluid-glass mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-mono font-medium tracking-wider uppercase">Sekarang dalam Beta v2.0</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.06]">
          Kelola Tugas dengan <br />
          <span className="text-[var(--accent-primary)]">Kejelasan Mutlak.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-[var(--text-secondary)] text-lg md:text-xl mb-12 leading-relaxed">
          Satu alur kerja untuk semua proyek Anda. Alami manajemen tugas yang cepat, interaktif, dan elegan dengan desain Apple Fluid Glass.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-[var(--accent-primary)] text-white rounded-2xl text-lg font-bold shadow-lg hover:bg-[var(--accent-hover)] transition-all active:scale-95"
          >
            Mulai Gratis Sekarang
          </Link>
          <Link
            href="#multi-view"
            className="w-full sm:w-auto px-8 py-4 fluid-glass rounded-2xl text-lg font-bold hover:bg-[var(--glass-hover)] transition-all active:scale-95"
          >
            Lihat Fitur
          </Link>
        </div>

        {/* Interactive Preview in Hero/Multi-View */}
        <section id="multi-view" className="mt-20">
          <InteractivePreview />
        </section>
      </section>

      {/* Bento Grid Features */}
      <section id="fitur" className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          icon={<Zap className="w-6 h-6 text-amber-500" />}
          title="Smart Quick-Add"
          description="Input berbasis NLP untuk tanggal, prioritas, dan tag dalam satu baris."
        />
        <FeatureCard
          icon={<Layout className="w-6 h-6 text-blue-500" />}
          title="Multi-View Engine"
          description="List View, Kanban Board, dan Kalender dari satu sumber data."
        />
        <FeatureCard
          icon={<MousePointer2 className="w-6 h-6 text-purple-500" />}
          title="Float-Gap DnD"
          description="Penempatan tugas yang instan dan presisi dengan algoritma gap."
        />
        <FeatureCard
          icon={<Database className="w-6 h-6 text-green-500" />}
          title="Full-Stack MySQL"
          description="Integritas data terjamin dengan Prisma v6 dan MySQL lokal."
        />
      </section>

      {/* Security Section */}
      <section id="keamanan" className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Keamanan & Integritas Data</h2>
        <p className="text-[var(--text-secondary)] mb-10 text-lg">
          Dibangun dengan standar keamanan produksi untuk melindungi data tugas Anda dari akses tidak sah.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SecurityCard
            icon={<Lock className="w-6 h-6" />}
            title="JWT HttpOnly Cookies"
            description="Sesi pengguna dilindungi menggunakan token JWT yang dienkripsi dan disimpan di cookie HttpOnly yang tidak dapat diakses via JavaScript."
          />
          <SecurityCard
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Bcrypt Password Hashing"
            description="Seluruh password di-hash dengan algoritma Bcrypt (salt 10 rounds) sehingga tidak pernah disimpan dalam bentuk plain text di database."
          />
          <SecurityCard
            icon={<Fingerprint className="w-6 h-6" />}
            title="Validasi & Isolasi ID"
            description="Setiap mutasi data divalidasi dengan skema Zod dan diverifikasi ID kepemilikannya melalui query Prisma yang terisolasi."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-hairline)] py-10 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--accent-primary)] flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-bold">TaskFlow Workspace</span>
        </div>

        <p className="text-sm text-[var(--text-tertiary)]">
          &copy; 2026 TaskFlow. Dibangun dengan Next.js 16, Prisma v6, dan Apple Fluid Design.
        </p>

        <div className="flex items-center gap-4 text-sm font-medium text-[var(--text-secondary)]">
          <ThemeToggle />
          <Link href="/login" className="hover:text-[var(--text-primary)] transition-colors">Masuk</Link>
          <Link href="/register" className="hover:text-[var(--text-primary)] transition-colors">Daftar</Link>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl fluid-glass flex flex-col gap-4 hover:translate-y-[-4px] transition-all duration-300">
      <div className="w-12 h-12 rounded-2xl bg-[var(--surface-subtle)] flex items-center justify-center border border-[var(--border-hairline)]">
        {icon}
      </div>
      <h3 className="font-display font-bold text-xl">{title}</h3>
      <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function SecurityCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--surface-solid)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent-primary)] mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}