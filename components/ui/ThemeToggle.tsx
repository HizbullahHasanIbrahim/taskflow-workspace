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

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    localStorage.setItem("taskflow_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      onClick={toggle}
      aria-label="Ganti tema"
      className={cn(
        "p-2 rounded-xl transition-all active:scale-95 fluid-glass-elevated hover:bg-[var(--glass-hover)]",
        className
      )}
    >
      {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}
