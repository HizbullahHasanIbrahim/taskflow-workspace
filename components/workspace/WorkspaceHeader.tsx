"use client";

import { motion } from "motion/react";
import { Menu, LayoutList, LayoutGrid, Calendar, Search } from "lucide-react";
import { WorkspaceView } from "@/lib/types";

interface WorkspaceHeaderProps {
  title: string;
  taskCount: number;
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  onOpenMobileSidebar: () => void;
  onOpenCommandPalette?: () => void;
}

export function WorkspaceHeader({
  title,
  taskCount,
  activeView,
  onSelectView,
  onOpenMobileSidebar,
  onOpenCommandPalette,
}: WorkspaceHeaderProps) {
  return (
    <header className="h-14 shrink-0 border-b border-[var(--border-hairline)] bg-[var(--glass-header)] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 -ml-2 rounded-xl hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Buka Menu Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-display font-bold text-lg sm:text-xl truncate tracking-tight">
            {title}
          </h1>
          <span className="font-mono text-xs text-[var(--text-tertiary)] tabular-nums px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-hairline)] hidden sm:inline-block">
            {taskCount} tugas
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* View Switcher Segmented Control */}
        <div className="relative flex items-center p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)]">
          {activeView === "list" && (
            <motion.span
              layoutId="workspace-view-pill"
              className="absolute inset-y-1 left-1 w-[calc(33.333%-2px)] bg-[var(--glass-active-pill)] shadow-xs rounded-lg"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          {activeView === "board" && (
            <motion.span
              layoutId="workspace-view-pill"
              className="absolute inset-y-1 left-[calc(33.333%+1px)] w-[calc(33.333%-2px)] bg-[var(--glass-active-pill)] shadow-xs rounded-lg"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          {activeView === "calendar" && (
            <motion.span
              layoutId="workspace-view-pill"
              className="absolute inset-y-1 right-1 w-[calc(33.333%-2px)] bg-[var(--glass-active-pill)] shadow-xs rounded-lg"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}

          <button
            type="button"
            onClick={() => onSelectView("list")}
            aria-label="Tampilan List"
            aria-pressed={activeView === "list"}
            className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeView === "list" ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView("board")}
            aria-label="Tampilan Board"
            aria-pressed={activeView === "board"}
            className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeView === "board" ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Board</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView("calendar")}
            aria-label="Tampilan Kalender"
            aria-pressed={activeView === "calendar"}
            className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeView === "calendar" ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Kalender</span>
          </button>
        </div>

        {/* Cmd+K Search Button Placeholder */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all min-h-[36px]"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Cari...</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-solid)]">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
