"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("taskflow_theme") as "light" | "dark") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function getServerSnapshot() {
  return "light";
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => void;
};

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    const applyTheme = () => {
      localStorage.setItem("taskflow_theme", next);
      document.documentElement.setAttribute("data-theme", next);
      window.dispatchEvent(new Event("storage"));
    };

    if (typeof document !== "undefined") {
      const doc = document as DocumentWithViewTransition;
      if (typeof doc.startViewTransition === "function") {
        doc.startViewTransition(applyTheme);
        return;
      }
    }

    applyTheme();
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? "Beralih ke tema gelap" : "Beralih ke tema terang"}
      title={theme === "light" ? "Ganti ke Tema Gelap" : "Ganti ke Tema Terang"}
      className={cn(
        "p-2 rounded-xl transition-all active:scale-95 border border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer",
        className
      )}
    >
      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
    </button>
  );
}
