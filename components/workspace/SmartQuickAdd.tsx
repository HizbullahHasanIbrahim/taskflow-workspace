"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, Tag as TagIcon, Calendar as CalendarIcon } from "lucide-react";
import { parseQuickAdd, ParsedQuickAdd } from "@/lib/quickAddParser";
import { useToast } from "@/components/ui/ToastProvider";
import { SerializedTaskWithRelations } from "@/lib/types";
import { TaskPriority } from "@prisma/client";

interface SmartQuickAddProps {
  onCreateTask: (task: SerializedTaskWithRelations) => Promise<void>;
  serverNow: string;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  URGENT: "text-[var(--prio-urgent-text)] bg-[var(--prio-urgent-bg)] border-[var(--prio-urgent-border)]",
  HIGH: "text-[var(--prio-high-text)] bg-[var(--prio-high-bg)] border-[var(--prio-high-border)]",
  MEDIUM: "text-[var(--prio-medium-text)] bg-[var(--prio-medium-bg)] border-[var(--prio-medium-border)]",
  LOW: "text-[var(--text-tertiary)] bg-[var(--surface-subtle)] border-[var(--border-hairline)]",
};

export function SmartQuickAdd({ onCreateTask, serverNow }: SmartQuickAddProps) {
  const [quickText, setQuickText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Reference date untuk parsing NLP (gunakan serverNow)
  const referenceDate = useMemo(() => new Date(serverNow), [serverNow]);

  // Parse NLP dengan useMemo yang stabil
  const preview: ParsedQuickAdd | null = useMemo(() => {
    if (!quickText.trim()) return null;
    return parseQuickAdd(quickText, referenceDate);
  }, [quickText, referenceDate]);

  // Keyboard shortcut global untuk tombol N (fokus input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hanya aktif jika bukan di input/textarea/select
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === "INPUT" ||
                      activeElement?.tagName === "TEXTAREA" ||
                      activeElement?.tagName === "SELECT";

      if (!isInput && e.key.toLowerCase() === "n") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview?.title || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const tempTask: SerializedTaskWithRelations = {
        id: `temp-${Date.now()}`,
        title: preview.title,
        description: null,
        status: "TODO",
        priority: preview.priority || "MEDIUM",
        position: 1024,
        dueDate: preview.dueDate ? preview.dueDate.toISOString() : null,
        completedAt: null,
        listId: "",
        userId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: [],
        tags: preview.tagNames.map((name, index) => ({
          id: `temp-tag-${index}`,
          name,
          color: "#64748b",
          userId: "",
        })),
        list: undefined,
      };
      await onCreateTask(tempTask);
      setQuickText("");
    } catch {
      toast.error("Gagal membuat tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Escape clears input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuickText("");
    }
  };

  return (
    <div className="shrink-0 border-t border-[var(--border-hairline)] bg-[var(--glass-header)] p-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        <div className="flex items-center rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-[var(--accent-primary)]">
          <Plus className="mr-3 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tambah tugas cepat... mis. Rapat besok !tinggi #meeting"
            aria-label="Tambah tugas cepat"
            disabled={isSubmitting}
            className="w-full bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
          <kbd className="hidden rounded border border-[var(--border-hairline)] bg-[var(--surface-solid)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)] sm:inline-block">
            Enter
          </kbd>
        </div>

        {/* In-flow NLP Preview Chips */}
        {preview && (
          <div className="mt-3 flex flex-wrap gap-2 items-start">
            {/* Title Chip */}
            <span className="text-xs font-medium text-[var(--text-primary)] px-2 py-1 bg-[var(--surface-subtle)] border border-[var(--border-hairline)] rounded-lg">
              {preview.title}
            </span>

            {/* Priority Chip */}
            {preview.priority && (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider border rounded-lg ${PRIORITY_COLORS[preview.priority]}`}
              >
                {preview.priority}
              </span>
            )}

            {/* Due Date Chip */}
            {preview.dueDate && (
              <span className="inline-flex items-center gap-0.5 px-2 py-1 text-[9px] font-mono border rounded-lg text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                <CalendarIcon className="w-2.5 h-2.5" />
                {preview.dueDate.toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}

            {/* Tag Chips */}
            {preview.tagNames.length > 0 && (
              <div className="flex items-center gap-1">
                {preview.tagNames.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 px-2 py-1 text-[9px] font-mono text-purple-500 border border-purple-500/30 bg-purple-500/10 rounded-lg"
                  >
                    <TagIcon className="w-2.5 h-2.5" />
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}