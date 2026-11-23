"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFocusTrap } from "@/lib/useFocusTrap";
import {
  Search,
  Plus,
  LayoutList,
  LayoutGrid,
  Calendar,
  Moon,
  Layers,
  Clock,
  CheckCircle2,
  Folder,
  CheckSquare,
  X,
  Sparkles,
} from "lucide-react";
import { SerializedTaskList, SerializedTaskWithRelations, WorkspaceScope, WorkspaceView } from "@/lib/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  lists: SerializedTaskList[];
  tasks: SerializedTaskWithRelations[];
  onSelectTask: (taskId: string) => void;
  onSelectScope: (scope: WorkspaceScope) => void;
  onSelectView: (view: WorkspaceView) => void;
  onFocusQuickAdd: () => void;
}

const STATUS_TEXT: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

const PRIORITY_TEXT: Record<string, string> = {
  URGENT: "Mendesak",
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
};

interface CommandItem {
  id: string;
  section: "actions" | "lists" | "tasks";
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  perform: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  lists,
  tasks,
  onSelectTask,
  onSelectScope,
  onSelectView,
  onFocusQuickAdd,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  // Toggle tema gelap/terang
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    localStorage.setItem("taskflow_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event("storage"));
  };

  // Buat daftar semua aksi cepat
  const quickActions: CommandItem[] = useMemo(() => [
    {
      id: "act-new-task",
      section: "actions",
      title: "Buat Tugas Baru",
      subtitle: "Fokus ke Smart Quick-Add",
      icon: Plus,
      perform: () => {
        onClose();
        onFocusQuickAdd();
      },
    },
    {
      id: "act-view-list",
      section: "actions",
      title: "Pindah ke Tampilan List",
      subtitle: "Ganti tampilan workspace",
      icon: LayoutList,
      perform: () => {
        onClose();
        onSelectView("list");
      },
    },
    {
      id: "act-view-board",
      section: "actions",
      title: "Pindah ke Tampilan Kanban Board",
      subtitle: "Ganti tampilan workspace",
      icon: LayoutGrid,
      perform: () => {
        onClose();
        onSelectView("board");
      },
    },
    {
      id: "act-view-cal",
      section: "actions",
      title: "Pindah ke Tampilan Kalender",
      subtitle: "Ganti tampilan workspace",
      icon: Calendar,
      perform: () => {
        onClose();
        onSelectView("calendar");
      },
    },
    {
      id: "act-toggle-theme",
      section: "actions",
      title: "Ganti Tema (Dark / Light)",
      subtitle: "Ubah mode tampilan antarmuka",
      icon: Moon,
      perform: () => {
        onClose();
        toggleTheme();
      },
    },
    {
      id: "act-scope-all",
      section: "actions",
      title: "Buka: Semua Tugas",
      subtitle: "Filter seluruh tugas aktif",
      icon: Layers,
      perform: () => {
        onClose();
        onSelectScope("all");
      },
    },
    {
      id: "act-scope-today",
      section: "actions",
      title: "Buka: Hari Ini",
      subtitle: "Filter tugas bertenggat hari ini",
      icon: Calendar,
      perform: () => {
        onClose();
        onSelectScope("today");
      },
    },
    {
      id: "act-scope-upcoming",
      section: "actions",
      title: "Buka: Mendatang",
      subtitle: "Filter tugas 7 hari ke depan",
      icon: Clock,
      perform: () => {
        onClose();
        onSelectScope("upcoming");
      },
    },
    {
      id: "act-scope-done",
      section: "actions",
      title: "Buka: Selesai",
      subtitle: "Arsip tugas yang telah tuntas",
      icon: CheckCircle2,
      perform: () => {
        onClose();
        onSelectScope("completed");
      },
    },
  ], [onClose, onFocusQuickAdd, onSelectView, onSelectScope]);

  // Buat daftar semua lists pengguna
  const listActions: CommandItem[] = useMemo(() => {
    return lists.map((l) => ({
      id: `list-${l.id}`,
      section: "lists",
      title: `Buka List: ${l.name}`,
      subtitle: "Pindah ke folder daftar ini",
      icon: Folder,
      iconColor: l.color,
      perform: () => {
        onClose();
        onSelectScope(`list:${l.id}`);
      },
    }));
  }, [lists, onClose, onSelectScope]);

  // Buat daftar semua tugas pengguna
  const taskActions: CommandItem[] = useMemo(() => {
    return tasks.map((t) => ({
      id: `task-${t.id}`,
      section: "tasks",
      title: t.title,
      subtitle:
        t.description ||
        `Status: ${STATUS_TEXT[t.status] || t.status} • Prioritas: ${PRIORITY_TEXT[t.priority] || t.priority}`,
      icon: CheckSquare,
      perform: () => {
        onClose();
        onSelectTask(t.id);
      },
    }));
  }, [tasks, onClose, onSelectTask]);

  // Filter gabungan berdasarkan query pencarian
  const filteredItems: CommandItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Jika query kosong, tampilkan seluruh aksi cepat + daftar list + 5 tugas terbaru
      return [...quickActions, ...listActions, ...taskActions.slice(0, 5)];
    }

    const matchedActions = quickActions.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q))
    );
    const matchedLists = listActions.filter((l) => l.title.toLowerCase().includes(q));
    const matchedTasks = taskActions.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.subtitle && t.subtitle.toLowerCase().includes(q))
    );

    return [...matchedActions, ...matchedLists, ...matchedTasks];
  }, [query, quickActions, listActions, taskActions]);

  // Kelompokkan hasil terfilter untuk rendering section
  const groupedSections = useMemo(() => {
    const actions = filteredItems.filter((i) => i.section === "actions");
    const listGroup = filteredItems.filter((i) => i.section === "lists");
    const taskGroup = filteredItems.filter((i) => i.section === "tasks");

    return [
      { key: "actions", label: "Aksi Cepat", items: actions },
      { key: "lists", label: "Daftar Tugas", items: listGroup },
      { key: "tasks", label: "Tugas", items: taskGroup },
    ].filter((s) => s.items.length > 0);
  }, [filteredItems]);

  // Navigasi keyboard pada input pencarian (ArrowDown, ArrowUp, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (filteredItems.length === 0 ? 0 : (prev - 1 + filteredItems.length) % filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[activeIndex]) {
        filteredItems[activeIndex].perform();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Reset query dan fokus saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      // Memberi jeda kecil agar modal selesai me-mount sebelum auto-fokus
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll otomatis ke item yang sedang aktif di keyboard
  useEffect(() => {
    if (itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[12vh] sm:pt-[15vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command Palette"
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="fluid-glass-elevated w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[var(--border-strong)]"
          >
            {/* Input Pencarian */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0); // Reset index saat mengetik tanpa setState di useEffect
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ketik perintah, nama daftar, atau cari tugas..."
                aria-label="Cari perintah"
                role="combobox"
                aria-expanded={true}
                aria-controls="command-palette-listbox"
                aria-activedescendant={`cmd-item-${activeIndex}`}
                className="flex-1 bg-transparent text-sm font-sans text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveIndex(0);
                    inputRef.current?.focus();
                  }}
                  aria-label="Bersihkan pencarian"
                  className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-[var(--text-tertiary)]">
                ESC
              </kbd>
            </div>

            {/* Daftar Hasil Terkelompok */}
            <div
              id="command-palette-listbox"
              role="listbox"
              className="max-h-[380px] overflow-y-auto overscroll-contain p-2 space-y-4"
            >
              {groupedSections.length > 0 ? (
                groupedSections.map((section) => (
                  <div key={section.key} className="space-y-1">
                    <div className="px-3 py-1 font-sans text-xs font-medium text-[var(--text-secondary)]">
                      {section.label}
                    </div>

                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const globalIndex = filteredItems.findIndex((fi) => fi.id === item.id);
                        const isSelected = activeIndex === globalIndex;
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.id}
                            id={`cmd-item-${globalIndex}`}
                            ref={(el) => {
                              itemRefs.current[globalIndex] = el;
                            }}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={item.perform}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                              isSelected
                                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                                : "hover:bg-[var(--glass-hover)] text-[var(--text-primary)]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-hairline)]"
                                }`}
                              >
                                <Icon
                                  className="w-3.5 h-3.5"
                                  style={item.iconColor && !isSelected ? { color: item.iconColor } : undefined}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium truncate">
                                  {item.title}
                                </div>
                                {item.subtitle && (
                                  <div
                                    className={`text-[10px] truncate ${
                                      isSelected ? "text-white/80" : "text-[var(--text-tertiary)]"
                                    }`}
                                  >
                                    {item.subtitle}
                                  </div>
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <kbd className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white shrink-0">
                                Enter
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-tertiary)] mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">
                    Coba kata kunci lain atau tekan ESC untuk keluar.
                  </div>
                </div>
              )}
            </div>

            {/* Footer Pintasan Keyboard */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-hairline)] bg-[var(--surface-subtle)]/70 text-[10px] font-mono text-[var(--text-tertiary)]">
              <div className="flex items-center gap-2">
                <span>↑↓ Navigasi</span>
                <span>•</span>
                <span>↵ Pilih</span>
              </div>
              <div>
                <span>ESC Tutup</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
