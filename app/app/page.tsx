import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { logoutAction } from "@/lib/actions/auth";
import { Layout, LogOut, Inbox } from "lucide-react";

export default async function AppPage() {
  const user = await requireUser();

  // Verifikasi koneksi MySQL end-to-end: ambil data onboarding
  const lists = await prisma.taskList.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
    include: { _count: { select: { tasks: true } } },
  });

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Halo, {user.name.split(" ")[0]}!</h1>
          <p className="text-[var(--text-secondary)] mt-2">Selamat datang di TaskFlow Workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <form action={logoutAction}>
            <button
              aria-label="Keluar"
              className="p-2 rounded-xl fluid-glass-elevated hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Inbox className="w-6 h-6 text-[var(--accent-primary)]" />
          Daftar Tugas Anda
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => (
            <div key={list.id} className="p-6 rounded-3xl fluid-glass flex items-center justify-between group hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner"
                  style={{ backgroundColor: list.color }}
                >
                  <Layout className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{list.name}</h3>
                  <p className="text-xs font-mono text-[var(--text-tertiary)] uppercase tracking-wider">{list._count.tasks} Tugas</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="pt-12 border-t border-[var(--border-hairline)] text-center">
        <p className="text-sm text-[var(--text-tertiary)] font-mono">
          Fase 1 Berhasil: Prisma v6 + MySQL + JWT Auth + Fluid Glass
        </p>
      </footer>
    </main>
  );
}
