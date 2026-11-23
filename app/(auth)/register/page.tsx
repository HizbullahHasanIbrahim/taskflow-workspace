import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "./RegisterForm";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center p-6">
      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--bg-ambient-1)] blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--bg-ambient-2)] blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-[420px] fluid-glass-elevated rounded-[2.5rem] p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            href="/"
            className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center text-white mb-6 shadow-lg"
            aria-label="Kembali ke Beranda"
          >
            <Sparkles className="w-8 h-8" />
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Mulai Gratis</h1>
          <p className="text-[var(--text-secondary)] text-sm">Buat akun dan otomatis dapatkan onboarding data</p>
        </div>

        <RegisterForm />

        <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[var(--accent-primary)] font-semibold hover:underline underline-offset-4">
            Masuk Saja
          </Link>
        </p>
      </div>
    </main>
  );
}
