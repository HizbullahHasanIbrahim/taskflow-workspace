"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, LayoutList, LayoutGrid, Calendar, Tag } from "lucide-react";

export function InteractivePreview() {
  const [activeView, setActiveView] = useState<"list" | "board">("list");
  const [tasks, setTasks] = useState([
    { id: 1, title: "Rancang Sistem Desain Glass", priority: "high", done: false, tag: "design", status: "IN_PROGRESS" },
    { id: 2, title: "Implementasi Secure JWT Cookie", priority: "urgent", done: false, tag: "backend", status: "TODO" },
    { id: 3, title: "Review PRD TaskFlow Workspace", priority: "med", done: true, tag: "docs", status: "DONE" },
  ] as { id: number; title: string; priority: string; done: boolean; tag: string; status: "TODO" | "IN_PROGRESS" | "DONE" }[]);
  const [quickText, setQuickText] = useState("");

  const handleToggle = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextDone = !t.done;
          return {
            ...t,
            done: nextDone,
            status: nextDone ? "DONE" : t.status === "DONE" ? "TODO" : t.status,
          };
        }
        return t;
      })
    );
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: quickText.replace(/\s+#.*$/, ""),
        priority: "med",
        done: false,
        tag: "inbox",
        status: "TODO",
      },
    ]);
    setQuickText("");
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-16 select-none">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-[2rem] blur-3xl -z-10" />

      <div className="fluid-glass-elevated rounded-[1.75rem] overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
        <div className="h-10 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)]/50 flex items-center justify-between px-5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-medium text-[var(--text-secondary)] tracking-widest uppercase">
            <span>TaskFlow Preview</span>
          </div>
          <div className="text-[10px] font-mono font-medium text-[var(--text-tertiary)] tabular-nums">
            Live Interactive Demo
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <form onSubmit={handleQuickAdd} className="relative flex-1">
              <Plus className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder="Tambah tugas... mis. Revisi UI besok !tinggi #design"
                aria-label="Tambah tugas cepat"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-xs font-sans transition-all"
              />
              <span className="absolute top-1/2 -translate-y-1/2 right-3 text-[10px] font-mono text-[var(--text-tertiary)] border border-[var(--border-hairline)] rounded px-1">
                N
              </span>
            </form>

            <div className="relative flex items-center p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)]">
              {activeView === "list" && (
                <motion.span
                  layoutId="preview-switcher-pill"
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-[var(--glass-active-pill)] shadow-sm rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {activeView === "board" && (
                <motion.span
                  layoutId="preview-switcher-pill"
                  className="absolute inset-y-1 right-1 w-[calc(50%-4px)] bg-[var(--glass-active-pill)] shadow-sm rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}

              <button
                type="button"
                onClick={() => setActiveView("list")}
                aria-label="Beralih ke List View"
                aria-pressed={activeView === "list"}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeView === "list" ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                List
              </button>

              <button
                type="button"
                onClick={() => setActiveView("board")}
                aria-label="Beralih ke Board View"
                aria-pressed={activeView === "board"}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeView === "board" ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Board
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeView === "list" ? (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface-solid)] border border-[var(--border-hairline)] shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggle(task.id)}
                      aria-label={task.done ? `Tandai belum selesai: ${task.title}` : `Selesaikan: ${task.title}`}
                      className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                        task.done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-[var(--border-strong)] hover:border-[var(--accent-primary)]"
                      }`}
                    >
                      {task.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <div className={`flex-1 min-w-0 font-sans text-xs truncate ${task.done ? "line-through opacity-50" : "text-[var(--text-primary)]"}`}>
                      {task.title}
                    </div>

                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                      task.priority === "urgent"
                        ? "bg-[var(--prio-urgent-bg)] text-[var(--prio-urgent-text)] border-[var(--prio-urgent-border)]"
                        : task.priority === "high"
                        ? "bg-[var(--prio-high-bg)] text-[var(--prio-high-text)] border-[var(--prio-high-border)]"
                        : "bg-[var(--prio-medium-bg)] text-[var(--prio-medium-text)] border-[var(--prio-medium-border)]"
                    }`}>
                      {task.priority}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--text-tertiary)] shrink-0">
                      <Tag className="w-3 h-3" />
                      {task.tag}
                    </span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="board-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-3 gap-2.5"
              >
                {(["TODO", "IN_PROGRESS", "DONE"] as const).map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col);
                  return (
                    <div key={col} className="p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)]">
                      <div className="flex items-center justify-between mb-2.5 px-0.5">
                        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                          {col}
                        </span>
                        <span className="font-mono text-[9px] text-[var(--text-tertiary)] tabular-nums">
                          {colTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {colTasks.map((t) => (
                          <div
                            key={t.id}
                            className="p-2.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border-hairline)] shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleToggle(t.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleToggle(t.id);
                              }
                            }}
                          >
                            <div className="font-sans text-[11px] text-[var(--text-primary)] mb-1.5 line-clamp-2">{t.title}</div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                                t.priority === "urgent"
                                  ? "bg-[var(--prio-urgent-bg)] text-[var(--prio-urgent-text)]"
                                  : t.priority === "high"
                                  ? "bg-[var(--prio-high-bg)] text-[var(--prio-high-text)]"
                                  : "bg-[var(--prio-medium-bg)] text-[var(--prio-medium-text)]"
                              }`}>
                                {t.priority}
                              </span>
                              <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                            </div>
                          </div>
                        ))}
                        {colTasks.length === 0 && (
                          <div className="py-4 text-center text-[10px] font-mono text-[var(--text-tertiary)]">
                            Kosong
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}