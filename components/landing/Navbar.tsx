import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
      <div className="fluid-glass rounded-full px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">TaskFlow</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
          <Link href="#fitur" className="hover:text-[var(--text-primary)] transition-colors">Fitur</Link>
          <Link href="#multi-view" className="hover:text-[var(--text-primary)] transition-colors">Multi-View</Link>
          <Link href="#keamanan" className="hover:text-[var(--text-primary)] transition-colors">Keamanan</Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link 
              href="/app" 
              className="px-5 py-2 bg-[var(--accent-primary)] text-white rounded-full text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all active:scale-95"
            >
              Buka Workspace
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-[var(--accent-primary)] transition-colors">
                Masuk
              </Link>
              <Link 
                href="/register" 
                className="px-5 py-2 bg-[var(--accent-primary)] text-white rounded-full text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all active:scale-95"
              >
                Mulai Gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}