"use client";

import { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SerializedTaskWithRelations } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

interface CalendarViewProps {
  tasks: SerializedTaskWithRelations[];
  serverNow: string;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onCreateTaskWithDate: (title: string, dueDate: string) => Promise<void>;
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const PRIORITY_PILL_STYLES = {
  URGENT: "bg-[var(--prio-urgent-bg)] text-[var(--prio-urgent-text)] border-[var(--prio-urgent-border)]",
  HIGH: "bg-[var(--prio-high-bg)] text-[var(--prio-high-text)] border-[var(--prio-high-border)]",
  MEDIUM: "bg-[var(--prio-medium-bg)] text-[var(--prio-medium-text)] border-[var(--prio-medium-border)]",
  LOW: "bg-[var(--surface-subtle)] text-[var(--text-tertiary)] border-[var(--border-hairline)]",
};

export function CalendarView({
  tasks,
  serverNow,
  onSelectTask,
  onToggleComplete,
  onCreateTaskWithDate,
}: CalendarViewProps) {
  // Inisialisasi bulan aktif memakai serverNow agar zero hydration mismatch
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(serverNow));

  // State untuk modal tambah tugas di tanggal tertentu
  const [addingDate, setAddingDate] = useState<Date | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk modal popover "Lihat semua tugas pada tanggal ini"
  const [viewingDayTasks, setViewingDayTasks] = useState<{ date: Date; tasks: SerializedTaskWithRelations[] } | null>(null);

  // Kalkulasi hari-hari kalender bulanan (dimulai Senin / weekStartsOn: 1)
  const { calendarDays, monthStart } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(start);
    const gridStart = startOfWeek(start, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(end, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
    return { calendarDays: days, monthStart: start };
  }, [currentMonth]);

  // Petakan tugas bertenggat waktu ke dalam Map berdasarkan format YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map = new Map<string, SerializedTaskWithRelations[]>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const key = format(new Date(task.dueDate), "yyyy-MM-dd");
        const list = map.get(key) || [];
        list.push(task);
        map.set(key, list);
      }
    });
    return map;
  }, [tasks]);

  // Tugas yang belum memiliki tenggat waktu
  const undatedTasks = useMemo(() => {
    return tasks.filter((task) => !task.dueDate && task.status !== "DONE");
  }, [tasks]);

  const handleCreateTaskOnDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !addingDate || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateTaskWithDate(newTitle.trim(), addingDate.toISOString());
      setNewTitle("");
      setAddingDate(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:px-8 sm:py-4 gap-4">
      {/* Area Kalender Utama */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface-solid)] border border-[var(--border-hairline)] rounded-2xl overflow-hidden shadow-xs">
        {/* Header Kalender */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)] capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              aria-label="Bulan sebelumnya"
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(serverNow))}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-solid)] hover:bg-[var(--glass-hover)] text-xs font-semibold text-[var(--text-secondary)] transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              aria-label="Bulan berikutnya"
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Baris Nama Hari */}
        <div className="grid grid-cols-7 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)]/40 text-center py-2 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Grid Sel Tanggal */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-[var(--border-hairline)] overflow-y-auto">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isDayToday = isToday(day);

            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-[96px] sm:min-h-[112px] p-1.5 sm:p-2 flex flex-col justify-between group transition-colors relative hover:bg-[var(--glass-hover)]/40",
                  !isCurrentMonth && "bg-[var(--surface-subtle)]/30 opacity-45"
                )}
              >
                {/* Baris Atas Sel: Nomor Tanggal & Tombol Tambah */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums font-semibold flex items-center justify-center rounded-full h-6 w-6 transition-all",
                      isDayToday
                        ? "bg-[var(--accent-primary)] text-white shadow-xs"
                        : "text-[var(--text-secondary)]"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setAddingDate(day);
                      setNewTitle("");
                    }}
                    aria-label={`Tambah tugas pada ${format(day, "dd MMMM yyyy", { locale: idLocale })}`}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-[var(--accent-soft)] hover:text-[var(--accent-primary)] text-[var(--text-tertiary)] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Pil Tugas pada Tanggal Tersebut */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onSelectTask(task.id)}
                      className={cn(
                        "w-full text-left truncate px-1.5 py-0.5 rounded text-[10px] font-medium border transition-transform hover:scale-[1.02] active:scale-[0.98] block",
                        PRIORITY_PILL_STYLES[task.priority],
                        task.status === "DONE" && "line-through opacity-60"
                      )}
                    >
                      {task.title}
                    </button>
                  ))}

                  {dayTasks.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setViewingDayTasks({ date: day, tasks: dayTasks })}
                      className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline block text-left px-1"
                    >
                      +{dayTasks.length - 3} lainnya
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tray Kaca: Panel "Tanpa Tenggat" */}
      <div className="lg:w-[280px] shrink-0 flex flex-col rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-solid)] overflow-hidden shadow-xs">
        <div className="flex items-center justify-between p-3.5 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h3 className="font-sans text-xs font-bold text-[var(--text-secondary)]">
              Tanpa Tenggat
            </h3>
          </div>
          <span className="font-mono text-[10px] tabular-nums text-[var(--text-tertiary)] px-1.5 py-0.2 rounded bg-[var(--surface-solid)] border border-[var(--border-hairline)]">
            {undatedTasks.length}
          </span>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-2 max-h-[240px] lg:max-h-[calc(100dvh-200px)]">
          {undatedTasks.map((task) => (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectTask(task.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectTask(task.id);
                }
              }}
              className="p-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={cn(
                    "text-[8px] font-mono uppercase tracking-wider px-1 py-0.2 rounded border font-semibold",
                    PRIORITY_PILL_STYLES[task.priority]
                  )}
                >
                  {task.priority}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task.id);
                  }}
                  aria-label="Selesaikan tugas"
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--border-strong)] hover:border-emerald-500 hover:bg-emerald-500/10"
                >
                  <Check className="w-2 h-2 text-transparent group-hover:text-emerald-500" />
                </button>
              </div>

              <div className="font-sans text-xs text-[var(--text-primary)] line-clamp-2">
                {task.title}
              </div>
            </div>
          ))}

          {undatedTasks.length === 0 && (
            <div className="p-6 text-center text-xs text-[var(--text-tertiary)]">
              Semua tugas memiliki tenggat waktu.
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Tugas Cepat di Tanggal Pilihan */}
      {addingDate && (
        <Modal
          isOpen={Boolean(addingDate)}
          onClose={() => setAddingDate(null)}
          title={`Tugas Baru: ${format(addingDate, "dd MMMM yyyy", { locale: idLocale })}`}
        >
          <form onSubmit={handleCreateTaskOnDate} className="space-y-4">
            <div>
              <label htmlFor="calendar-task-title" className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                Judul Tugas
              </label>
              <input
                id="calendar-task-title"
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Misal: Siapkan materi presentasi..."
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-xs font-sans text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setAddingDate(null)}
                className="px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="px-4 py-1.5 bg-[var(--accent-primary)] text-white text-xs font-semibold rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Menyimpan..." : "Buat Tugas"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Daftar Lengkap Tugas Hari Ini (+X Lainnya) */}
      {viewingDayTasks && (
        <Modal
          isOpen={Boolean(viewingDayTasks)}
          onClose={() => setViewingDayTasks(null)}
          title={`Tugas: ${format(viewingDayTasks.date, "dd MMMM yyyy", { locale: idLocale })}`}
        >
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {viewingDayTasks.tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  setViewingDayTasks(null);
                  onSelectTask(task.id);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] text-left transition-all"
              >
                <span className={cn("text-xs font-medium text-[var(--text-primary)] truncate flex-1 pr-2", task.status === "DONE" && "line-through text-[var(--text-tertiary)]")}>
                  {task.title}
                </span>
                <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0", PRIORITY_PILL_STYLES[task.priority])}>
                  {task.priority}
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
