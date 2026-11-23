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
import { ChevronLeft, ChevronRight, Plus, Clock, Check, Calendar as CalendarIcon, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { SerializedTaskWithRelations } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { PriorityBadge } from "./PriorityBadge";

interface CalendarViewProps {
  tasks: SerializedTaskWithRelations[];
  serverNow: string;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onCreateTaskWithDate: (title: string, dueDate: string) => Promise<void>;
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function CalendarView({
  tasks,
  serverNow,
  onSelectTask,
  onToggleComplete,
  onCreateTaskWithDate,
}: CalendarViewProps) {
  // Inisialisasi bulan aktif memakai serverNow agar zero hydration mismatch
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(serverNow));

  // Toggle tampilan mobile (Agenda vs Grid). Default ke Agenda di layar kecil
  const [mobileMode, setMobileMode] = useState<"agenda" | "grid">("agenda");

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

  // Daftar hari di bulan berjalan yang memiliki tugas (khusus Agenda Mode mobile)
  const agendaDays = useMemo(() => {
    return calendarDays
      .filter((day) => isSameMonth(day, monthStart))
      .map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayTasks = tasksByDate.get(dateKey) || [];
        return { day, dateKey, tasks: dayTasks };
      })
      .filter((item) => item.tasks.length > 0);
  }, [calendarDays, monthStart, tasksByDate]);

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
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)] gap-2">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)] capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
            </h2>

            {/* Mobile View Switcher (Agenda vs Grid) */}
            <div className="sm:hidden flex items-center p-0.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-solid)]">
              <button
                type="button"
                onClick={() => setMobileMode("agenda")}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                  mobileMode === "agenda"
                    ? "bg-[var(--accent-primary)] text-white shadow-xs"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                )}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileMode("grid")}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                  mobileMode === "grid"
                    ? "bg-[var(--accent-primary)] text-white shadow-xs"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              aria-label="Bulan sebelumnya"
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(serverNow))}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-solid)] hover:bg-[var(--glass-hover)] text-xs font-semibold text-[var(--text-secondary)] transition-colors min-h-[36px] cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              aria-label="Bulan berikutnya"
              className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Agenda Mode (< 640px saat mobileMode === 'agenda') */}
        <div className={cn("flex-1 overflow-y-auto p-4 space-y-4", mobileMode === "agenda" ? "block sm:hidden" : "hidden")}>
          {agendaDays.length > 0 ? (
            agendaDays.map(({ day, dateKey, tasks: dayTasks }) => {
              const isDayToday = isToday(day);
              return (
                <div key={dateKey} className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold tabular-nums",
                          isDayToday ? "bg-[var(--accent-primary)] text-white shadow-xs" : "bg-[var(--surface-solid)] text-[var(--text-primary)] border border-[var(--border-hairline)]"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <span className="font-sans text-xs font-medium text-[var(--text-secondary)] capitalize">
                        {format(day, "EEEE, d MMMM", { locale: idLocale })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAddingDate(day);
                        setNewTitle("");
                      }}
                      aria-label={`Tambah tugas pada ${format(day, "d MMMM yyyy", { locale: idLocale })}`}
                      className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task.id)}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-all cursor-pointer min-h-[44px]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleComplete(task.id);
                            }}
                            className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                              task.status === "DONE"
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-[var(--border-strong)]"
                            )}
                          >
                            {task.status === "DONE" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>
                          <span
                            className={cn(
                              "font-sans text-xs font-medium text-[var(--text-primary)] truncate",
                              task.status === "DONE" && "line-through text-[var(--text-tertiary)]"
                            )}
                          >
                            {task.title}
                          </span>
                        </div>
                        <PriorityBadge priority={task.priority} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
              <h3 className="font-sans text-xs font-medium text-[var(--text-primary)] mb-1">
                Tidak ada tugas bertenggat di bulan ini
              </h3>
              <p className="text-[11px] text-[var(--text-tertiary)] max-w-xs mb-3">
                Gunakan tombol + pada tanggal atau input cepat di atas untuk menambahkan tugas.
              </p>
            </div>
          )}
        </div>

        {/* 7-Col Monthly Grid (Ditampilkan di Desktop atau di Mobile saat mobileMode === 'grid') */}
        <div className={cn("flex-1 flex-col overflow-hidden", mobileMode === "grid" ? "flex" : "hidden sm:flex")}>
          {/* Baris Nama Hari */}
          <div className="grid grid-cols-7 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)]/40 text-center py-2 text-[11px] font-medium text-[var(--text-secondary)]">
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
                    "min-h-[84px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col justify-between group transition-colors relative hover:bg-[var(--glass-hover)]/40",
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
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-[var(--accent-soft)] hover:text-[var(--accent-primary)] text-[var(--text-tertiary)] transition-all min-h-[24px] min-w-[24px] flex items-center justify-center cursor-pointer"
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
                          "w-full text-left truncate px-1.5 py-0.5 rounded text-[10px] font-medium border border-[var(--border-hairline)] bg-[var(--surface-subtle)] transition-transform hover:scale-[1.01] active:scale-[0.99] block",
                          task.status === "DONE" && "line-through opacity-60 text-[var(--text-tertiary)]"
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
      </div>

      {/* Tray Kaca: Panel "Tanpa Tenggat" */}
      <div className="lg:w-[280px] shrink-0 flex flex-col rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-solid)] overflow-hidden shadow-xs">
        <div className="flex items-center justify-between p-3.5 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h3 className="font-sans text-xs font-semibold text-[var(--text-secondary)]">
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
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <PriorityBadge priority={task.priority} size="sm" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task.id);
                  }}
                  aria-label="Selesaikan tugas"
                  className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-strong)] hover:border-emerald-500 hover:bg-emerald-500/10 min-h-[24px] min-w-[24px]"
                >
                  <Check className="w-2.5 h-2.5 text-transparent group-hover:text-emerald-500" />
                </button>
              </div>

              <div className="font-sans text-xs font-medium text-[var(--text-primary)] line-clamp-2">
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
              <label htmlFor="calendar-task-title" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Judul Tugas
              </label>
              <input
                id="calendar-task-title"
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Misal: Siapkan materi presentasi..."
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-xs font-sans text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setAddingDate(null)}
                className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="min-h-[40px] px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
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
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] text-left transition-all min-h-[44px]"
              >
                <span className={cn("text-xs font-medium text-[var(--text-primary)] truncate flex-1 pr-2", task.status === "DONE" && "line-through text-[var(--text-tertiary)]")}>
                  {task.title}
                </span>
                <PriorityBadge priority={task.priority} size="sm" />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
