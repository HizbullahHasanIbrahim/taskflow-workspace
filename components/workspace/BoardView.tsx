"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  CollisionDetection,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskStatus } from "@prisma/client";
import { Plus, Calendar, Tag as TagIcon, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SerializedTaskWithRelations, SortOption } from "@/lib/types";
import { PriorityBadge } from "./PriorityBadge";
import { TaskCheckbox, useDelayedCompletion } from "./TaskCheckbox";

interface BoardViewProps {
  tasks: SerializedTaskWithRelations[];
  serverNow: string;
  sortOption: SortOption;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onCreateTaskInStatus: (status: TaskStatus, title: string) => Promise<void>;
  onMoveTask: (input: {
    taskId: string;
    status: TaskStatus;
    prevTaskId: string | null;
    nextTaskId: string | null;
  }) => Promise<void>;
}

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

const STATUS_CONFIG: Record<TaskStatus, { label: string; dotClass: string }> = {
  TODO: { label: "To Do", dotClass: "bg-[var(--status-todo)]" },
  IN_PROGRESS: { label: "In Progress", dotClass: "bg-[var(--status-progress)]" },
  REVIEW: { label: "Review", dotClass: "bg-[var(--status-review)]" },
  DONE: { label: "Done", dotClass: "bg-[var(--status-done)]" },
};

// Komponen kartu Kanban yang dapat di-drag
function SortableCard({
  task,
  serverNow,
  isDragDisabled,
  isCompleting,
  onSelectTask,
  onToggleComplete,
}: {
  task: SerializedTaskWithRelations;
  serverNow: string;
  isDragDisabled: boolean;
  isCompleting: boolean;
  onSelectTask: (id: string) => void;
  onToggleComplete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate &&
    task.status !== "DONE" &&
    new Date(task.dueDate).getTime() < new Date(serverNow).getTime();

  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelectTask(task.id)}
      className={cn(
        "rounded-xl bg-[var(--surface-solid)] p-3.5 shadow-xs border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-all cursor-pointer group select-none",
        isDragging && "opacity-35 border-dashed border-2 border-[var(--accent-primary)] bg-[var(--accent-soft)]"
      )}
    >
      {/* Baris Atas: Priority Badge + List Name + Quick Checkbox */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} size="sm" />
          {task.list && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-tertiary)] truncate max-w-[100px]"
              style={{ borderLeftColor: task.list.color, borderLeftWidth: 3 }}
            >
              {task.list.name}
            </span>
          )}
        </div>

        {/* Checkbox dengan haptic spring & path draw */}
        <TaskCheckbox
          checked={task.status === "DONE"}
          isCompleting={isCompleting}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          ariaLabel={task.status === "DONE" ? "Tandai belum selesai" : "Selesaikan tugas"}
          size="sm"
        />
      </div>

      {/* Tengah: Judul Tugas dengan garis coret animasi saat completing */}
      <div
        className={cn(
          "font-sans text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-relaxed mb-2.5 relative inline-block",
          task.status === "DONE" && "line-through text-[var(--text-tertiary)]",
          isCompleting && "opacity-60 text-[var(--text-tertiary)] transition-opacity"
        )}
      >
        <span>{task.title}</span>
        {isCompleting && (
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] w-full bg-[var(--text-tertiary)] origin-left pointer-events-none"
          />
        )}
      </div>

      {/* Progress Bar Subtask (jika ada) */}
      {totalSubtasks > 0 && (
        <div className="mb-2.5 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] tabular-nums text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Subtask
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="h-1 w-full bg-[var(--surface-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Bawah: Tag Chips & Tenggat Waktu */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-hairline)] text-[10px]">
        {/* Tag Chips */}
        <div className="flex items-center gap-1 flex-wrap min-w-0">
          {task.tags && task.tags.length > 0 ? (
            <>
              {task.tags.slice(0, 2).map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[9px] text-[var(--text-secondary)] bg-[var(--surface-subtle)] border border-[var(--border-hairline)]"
                >
                  <TagIcon className="w-2.5 h-2.5 text-[var(--text-tertiary)]" />
                  {t.name}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="font-mono text-[9px] text-[var(--text-tertiary)] px-1 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-hairline)]">
                  +{task.tags.length - 2}
                </span>
              )}
            </>
          ) : (
            <span />
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded border border-[var(--border-hairline)] shrink-0",
              isOverdue
                ? "text-rose-500 border-rose-500/30 bg-rose-500/10 font-bold"
                : "text-[var(--text-tertiary)] bg-[var(--surface-subtle)]"
            )}
          >
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString("id-ID", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// Kolom Droppable Kanban
function KanbanColumn({
  status,
  tasks,
  serverNow,
  isDragDisabled,
  completingIds,
  onSelectTask,
  onToggleComplete,
  onCreateTaskInStatus,
}: {
  status: TaskStatus;
  tasks: SerializedTaskWithRelations[];
  serverNow: string;
  isDragDisabled: boolean;
  completingIds: Set<string>;
  onSelectTask: (id: string) => void;
  onToggleComplete: (id: string, isDone: boolean) => void;
  onCreateTaskInStatus: (status: TaskStatus, title: string) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${status}`,
    data: { status },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = STATUS_CONFIG[status];
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const handleInlineSubmit = async () => {
    const title = inlineTitle.trim();
    if (!title || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateTaskInStatus(status, title);
      setInlineTitle("");
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[84vw] md:min-w-0 flex-1 snap-center rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] p-3 transition-colors max-h-[calc(100dvh-170px)]",
        isOver && "border-[var(--accent-border)] bg-[var(--accent-soft)]/40 ring-2 ring-[var(--accent-primary)]/20"
      )}
    >
      {/* Header Kolom */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", config.dotClass)} />
          <h2 className="font-sans text-xs font-semibold text-[var(--text-secondary)]">
            {config.label}
          </h2>
          <span className="font-mono text-[10px] tabular-nums text-[var(--text-tertiary)] px-1.5 py-0.2 rounded bg-[var(--surface-solid)] border border-[var(--border-hairline)]">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setInlineTitle("");
          }}
          aria-label={`Tambah tugas di kolom ${config.label}`}
          className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Daftar Kartu (Sortable) */}
      <div className="flex-1 overflow-y-auto overscroll-contain space-y-2.5 pr-0.5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              task={task}
              serverNow={serverNow}
              isDragDisabled={isDragDisabled}
              isCompleting={completingIds.has(task.id)}
              onSelectTask={onSelectTask}
              onToggleComplete={() => onToggleComplete(task.id, task.status === "DONE")}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-[var(--border-hairline)] rounded-xl my-2">
            <span className="text-xs font-medium text-[var(--text-tertiary)]">Belum ada tugas</span>
          </div>
        )}

        {/* Inline Quick-Add Form */}
        {isAdding && (
          <div className="p-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-solid)] shadow-xs space-y-2">
            <input
              type="text"
              autoFocus
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleInlineSubmit();
                } else if (e.key === "Escape") {
                  setIsAdding(false);
                  setInlineTitle("");
                }
              }}
              placeholder="Tulis judul tugas... (Enter simpan, Esc batal)"
              aria-label={`Judul tugas baru di kolom ${config.label}`}
              className="w-full bg-transparent text-xs font-sans text-[var(--text-primary)] outline-none"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setInlineTitle("");
                }}
                className="px-2 py-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleInlineSubmit()}
                disabled={isSubmitting || !inlineTitle.trim()}
                className="px-3 py-1 bg-[var(--accent-primary)] text-white text-[11px] font-semibold rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Menyimpan..." : "Tambah"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tombol Tambah di Bawah Kolom */}
      {!isAdding && (
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            setInlineTitle("");
          }}
          className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] rounded-xl transition-colors border border-dashed border-transparent hover:border-[var(--border-hairline)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah tugas</span>
        </button>
      )}
    </div>
  );
}

export function BoardView({
  tasks,
  serverNow,
  sortOption,
  onSelectTask,
  onToggleComplete,
  onCreateTaskInStatus,
  onMoveTask,
}: BoardViewProps) {
  const [activeTask, setActiveTask] = useState<SerializedTaskWithRelations | null>(null);

  // Hook anti-race-condition untuk delayed completion (280ms)
  const { completingIds, handleToggleComplete } = useDelayedCompletion(onToggleComplete);

  const isDragDisabled = sortOption !== "manual";

  // Sensor pointer dengan distance threshold 6px agar klik buka drawer tidak bentrok dengan drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mengelompokkan tugas per kolom status
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, SerializedTaskWithRelations[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
    };
    tasks.forEach((task) => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      } else {
        groups.TODO.push(task);
      }
    });
    return groups;
  }, [tasks]);

  // Strategi deteksi kolisi kombinasi pointerWithin dan closestCorners
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask) return;

    // Menentukan status target (apakah over ke kolom langsung atau ke kartu lain)
    let targetStatus: TaskStatus = draggedTask.status;

    if (overId.startsWith("col-")) {
      targetStatus = overId.replace("col-", "") as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) targetStatus = overTask.status;
    }

    // Mendapatkan daftar kartu di kolom tujuan (tidak termasuk item yang sedang dipindahkan)
    const targetSiblings = (groupedTasks[targetStatus] || []).filter((t) => t.id !== activeId);

    // Menentukan index target penempatan
    let insertIndex = targetSiblings.length;

    if (!overId.startsWith("col-")) {
      const overIndex = targetSiblings.findIndex((t) => t.id === overId);
      if (overIndex !== -1) {
        insertIndex = overIndex;
      }
    }

    // Ambil prevTaskId dan nextTaskId untuk perhitungan float gap
    const prevTask = insertIndex > 0 ? targetSiblings[insertIndex - 1] : null;
    const nextTask = insertIndex < targetSiblings.length ? targetSiblings[insertIndex] : null;

    // Jika posisi dan status sama persis, abaikan
    if (draggedTask.status === targetStatus && prevTask?.id === activeId) {
      return;
    }

    await onMoveTask({
      taskId: activeId,
      status: targetStatus,
      prevTaskId: prevTask ? prevTask.id : null,
      nextTaskId: nextTask ? nextTask.id : null,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-8 py-4">
      {/* Banner peringatan jika drag nonaktif karena mode sort selain Manual */}
      {isDragDisabled && (
        <div className="mb-3 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Pengurutan kartu via drag-and-drop hanya aktif pada mode sortir <strong>Manual (Drag)</strong>.
          </span>
        </div>
      )}

      {/* Kontainer Grid / Horisontal Scroll Kanban (id statis mencegah hydration mismatch aria-describedby di SSR) */}
      <DndContext
        id="dnd-board-view"
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <div className="flex-1 flex md:grid md:grid-cols-2 xl:grid-cols-4 overflow-x-auto snap-x snap-mandatory gap-4 pb-2">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={groupedTasks[status]}
              serverNow={serverNow}
              isDragDisabled={isDragDisabled}
              completingIds={completingIds}
              onSelectTask={onSelectTask}
              onToggleComplete={handleToggleComplete}
              onCreateTaskInStatus={onCreateTaskInStatus}
            />
          ))}
        </div>

        {/* DragOverlay yang melayang saat kartu diseret */}
        <DragOverlay>
          {activeTask ? (
            <div className="rounded-xl bg-[var(--surface-solid)] p-3.5 shadow-2xl border border-[var(--accent-primary)] scale-[1.03] rotate-[0.8deg] fluid-glass-elevated cursor-grabbing opacity-95">
              <div className="flex items-center justify-between gap-2 mb-2">
                <PriorityBadge priority={activeTask.priority} size="sm" />
                <span className="text-[10px] font-sans text-[var(--text-tertiary)]">Memindahkan...</span>
              </div>
              <div className="font-sans text-xs font-medium text-[var(--text-primary)] line-clamp-2">
                {activeTask.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
