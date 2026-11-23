"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { X, Trash2, Check, CalendarDays, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SerializedTaskWithRelations, SerializedTaskList, SerializedTag, SerializedTask } from "@/lib/types";
import { TaskStatus, TaskPriority } from "@prisma/client";

export interface TaskDetailProps {
  task: SerializedTaskWithRelations;
  lists: SerializedTaskList[];
  tags: SerializedTag[];
  onClose: () => void;
  onSave: (updated: Partial<SerializedTask>) => Promise<void>;
  onDelete: () => void;
  onCreateSubtask?: (taskId: string, title: string) => Promise<void>;
  onUpdateSubtask?: (taskId: string, subtaskId: string, title: string) => Promise<void>;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => Promise<void>;
  onToggleSubtask?: (taskId: string, subtaskId: string) => Promise<void>;
  onToggleTag?: (taskId: string, tagId: string) => Promise<void>;
  onCreateTag?: (taskId: string, name: string, color: string) => Promise<void>;
}

const TAG_COLORS = ["#64748b", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e"];

export function TaskDetailDrawer({
  task,
  lists,
  tags,
  onClose,
  onSave,
  onDelete,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onToggleSubtask,
  onToggleTag,
  onCreateTag,
}: TaskDetailProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Inline Subtask Add State
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);

  // Inline Tag Add State
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [isSubmittingTag, setIsSubmittingTag] = useState(false);

  // Inline Subtask Edit State
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [subtaskEditValue, setSubtaskEditValue] = useState("");

  const saveTitle = () => {
    if (title.trim() && title !== task.title) {
      setSaveStatus("saving");
      void onSave({ title: title.trim() }).finally(() => setSaveStatus("saved"));
    }
  };

  const saveDescription = () => {
    if (description !== (task.description || "")) {
      setSaveStatus("saving");
      void onSave({ description }).finally(() => setSaveStatus("saved"));
    }
  };

  const handleCreateSubtask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newSubtaskTitle.trim() || isSubmittingSubtask) return;

    setIsSubmittingSubtask(true);
    try {
      if (onCreateSubtask) await onCreateSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
    } finally {
      setIsSubmittingSubtask(false);
    }
  };

  const handleCreateTag = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTagName.trim() || isSubmittingTag) return;

    setIsSubmittingTag(true);
    try {
      if (onCreateTag) await onCreateTag(task.id, newTagName.trim(), newTagColor);
      setNewTagName("");
      setIsAddingTag(false);
    } finally {
      setIsSubmittingTag(false);
    }
  };

  const percent = task.subtasks.length
    ? Math.round((task.subtasks.filter(s => s.isCompleted).length / task.subtasks.length) * 100)
    : 0;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      role="dialog"
      aria-modal="true"
      aria-label="Detail tugas"
      className="fixed inset-0 z-50 flex items-end justify-center md:inset-y-0 md:left-auto md:right-0 md:items-center md:p-4"
    >
      <button type="button" onClick={onClose} aria-label="Tutup detail" className="absolute inset-0 bg-black/30 backdrop-blur-xs md:rounded-3xl" />
      <div className="fluid-glass-elevated relative flex max-h-[86dvh] w-full flex-col overflow-hidden rounded-t-3xl md:max-h-[90dvh] md:w-[420px] md:rounded-2xl pb-[max(16px,env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[var(--border-strong)] md:hidden" />
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-hairline)] p-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              {saveStatus === "saving" ? "Menyimpan..." : "Detail Tugas"}
            </span>
            {saveStatus === "saved" && <Check className="w-3 h-3 text-emerald-500" />}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onDelete}
              aria-label="Hapus tugas"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-tertiary)] hover:bg-rose-500/10 hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-tertiary)] hover:bg-[var(--glass-hover)]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="overscroll-contain space-y-5 overflow-y-auto p-5">
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Judul</label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveTitle(); (e.target as HTMLInputElement).blur(); } }}
              className="w-full rounded-xl bg-transparent font-display text-lg font-bold outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Status</div>
              <select
                value={task.status}
                onChange={async (e) => {
                  const newStatus = e.target.value as TaskStatus;
                  await onSave({ status: newStatus });
                }}
                aria-label="Status tugas"
                className="w-full bg-transparent text-xs font-semibold outline-none"
              >
                {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Prioritas</div>
              <select
                value={task.priority}
                onChange={async (e) => await onSave({ priority: e.target.value as TaskPriority })}
                aria-label="Prioritas tugas"
                className="w-full bg-transparent text-xs font-semibold outline-none"
              >
                {["URGENT", "HIGH", "MEDIUM", "LOW"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Daftar</div>
              <select
                value={task.listId}
                onChange={async (e) => await onSave({ listId: e.target.value })}
                aria-label="Pindah daftar"
                className="w-full bg-transparent text-xs font-semibold outline-none"
              >
                {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <CalendarDays className="h-3.5 w-3.5" /> Tenggat Waktu
            </div>
            <input
              type="date"
              value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
              onChange={async (e) => await onSave({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              aria-label="Tenggat waktu"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
            <div className="flex gap-2">
              {["Hari Ini", "Besok", "+7 Hari"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    if (label === "Besok") d.setDate(d.getDate() + 1);
                    if (label === "+7 Hari") d.setDate(d.getDate() + 7);
                    void onSave({ dueDate: d.toISOString() });
                  }}
                  className="min-h-[44px] flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void onSave({ dueDate: null })}
                className="min-h-[44px] flex-1 rounded-xl border border-[var(--border-hairline)] text-[10px] font-semibold text-[var(--text-tertiary)] hover:text-rose-500 transition-all"
              >
                Hapus
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="task-description" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Deskripsi</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              rows={3}
              placeholder="Tambahkan catatan..."
              className="w-full resize-none rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
          </div>

          {/* Subtask Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Subtask</span>
              <span className="font-mono text-[10px] tabular-nums text-[var(--text-secondary)]">
                {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
              <motion.div className="h-full rounded-full bg-[var(--accent-primary)]" animate={{ width: `${percent}%` }} />
            </div>
            <div className="space-y-1">
              {task.subtasks.map(subtask => (
                <div key={subtask.id} className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[var(--glass-hover)]">
                  <button
                    type="button"
                    onClick={() => onToggleSubtask?.(task.id, subtask.id)}
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                      subtask.isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--border-strong)]"
                    )}
                  >
                    {subtask.isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                  </button>

                  {editingSubtaskId === subtask.id ? (
                    <input
                      autoFocus
                      value={subtaskEditValue}
                      onChange={(e) => setSubtaskEditValue(e.target.value)}
                      onBlur={() => {
                        if (subtaskEditValue.trim() && subtaskEditValue !== subtask.title) {
                          onUpdateSubtask?.(task.id, subtask.id, subtaskEditValue.trim());
                        }
                        setEditingSubtaskId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditingSubtaskId(null);
                      }}
                      className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        setEditingSubtaskId(subtask.id);
                        setSubtaskEditValue(subtask.title);
                      }}
                      className={cn("min-w-0 flex-1 truncate text-xs cursor-pointer", subtask.isCompleted && "line-through opacity-50")}
                    >
                      {subtask.title}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteSubtask?.(task.id, subtask.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-tertiary)] hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <form onSubmit={handleCreateSubtask} className="flex items-center gap-2 rounded-lg px-2 py-1 mt-1 border border-dashed border-[var(--border-hairline)] focus-within:border-[var(--accent-primary)]">
                <Plus className="h-3 w-3 text-[var(--text-tertiary)]" />
                <input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Tambah subtask lalu tekan Enter..."
                  className="flex-1 bg-transparent text-xs outline-none py-1"
                  disabled={isSubmittingSubtask}
                />
              </form>
            </div>
          </div>

          {/* Tag Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Tag</span>
              <button
                type="button"
                onClick={() => setIsAddingTag(!isAddingTag)}
                className={cn("flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-primary)] transition-all", isAddingTag && "rotate-45 text-rose-500")}
              >
                <Plus className="h-3 w-3" />
                {isAddingTag ? "Batal" : "Tag Baru"}
              </button>
            </div>

            {isAddingTag && (
              <form onSubmit={handleCreateTag} className="space-y-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3">
                <input
                  autoFocus
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nama tag..."
                  className="w-full bg-transparent text-xs font-semibold outline-none"
                  disabled={isSubmittingTag}
                />
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 transition-all",
                        newTagColor === color ? "border-white ring-2 ring-[var(--accent-primary)]" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={!newTagName.trim() || isSubmittingTag}
                  className="w-full rounded-lg bg-[var(--accent-primary)] py-1.5 text-xs font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {isSubmittingTag ? "Menyimpan..." : "Simpan Tag"}
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const isActive = task.tags.some(t => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggleTag?.(task.id, tag.id)}
                    className={cn(
                      "min-h-[36px] rounded-xl border px-3 text-[10px] font-mono transition-all",
                      isActive
                        ? "border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]"
                        : "border-[var(--border-hairline)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    #{tag.name}
                  </button>
                );
              })}
              {tags.length === 0 && !isAddingTag && <span className="text-[10px] italic text-[var(--text-tertiary)]">Belum ada tag</span>}
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-[var(--border-hairline)] p-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-xl border border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--glass-hover)] transition-all"
          >
            Tutup
          </button>
        </footer>
      </div>
    </motion.aside>
  );
}