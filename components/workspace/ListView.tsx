"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Tag as TagIcon,
  Inbox,
  GripVertical,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SerializedTaskWithRelations, SortOption } from "@/lib/types";
import { TaskStatus } from "@prisma/client";
import { PriorityBadge } from "./PriorityBadge";
import { TaskCheckbox, useDelayedCompletion } from "./TaskCheckbox";

interface ListViewProps {
  tasks: SerializedTaskWithRelations[];
  serverNow: string;
  sortOption: SortOption;
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onFocusQuickAdd?: () => void;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTaskInStatus: (status: TaskStatus, title: string) => Promise<void>;
  onMoveTask: (input: {
    taskId: string;
    status: TaskStatus;
    prevTaskId: string | null;
    nextTaskId: string | null;
  }) => Promise<void>;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dotClass: string }
> = {
  TODO: { label: "To Do", dotClass: "bg-[var(--status-todo)]" },
  IN_PROGRESS: { label: "In Progress", dotClass: "bg-[var(--status-progress)]" },
  REVIEW: { label: "Review", dotClass: "bg-[var(--status-review)]" },
  DONE: { label: "Done", dotClass: "bg-[var(--status-done)]" },
};

// Komponen baris tugas yang dapat di-drag urutannya
function SortableRow({
  task,
  serverNow,
  isDragDisabled,
  isCompleting,
  onSelectTask,
  onToggleComplete,
  onDeleteTask,
}: {
  task: SerializedTaskWithRelations;
  serverNow: string;
  isDragDisabled: boolean;
  isCompleting: boolean;
  onSelectTask: (id: string) => void;
  onToggleComplete: () => void;
  onDeleteTask: (id: string) => void;
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
      role="button"
      tabIndex={0}
      onClick={() => onSelectTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectTask(task.id);
        }
      }}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-solid)] p-3 text-left shadow-xs transition-all hover:shadow-md hover:border-[var(--border-strong)] cursor-pointer select-none",
        isDragging && "opacity-35 border-dashed border-2 border-[var(--accent-primary)] bg-[var(--accent-soft)]"
      )}
    >
      {/* Drag Handle Grip (muncul saat hover di desktop, samar di mobile) */}
      {!isDragDisabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Pindahkan urutan tugas"
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-[var(--text-tertiary)] opacity-30 md:opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] transition-opacity"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Checkbox dengan haptic spring & path draw */}
      <TaskCheckbox
        checked={task.status === "DONE"}
        isCompleting={isCompleting}
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        ariaLabel={task.status === "DONE" ? "Tandai belum selesai" : "Selesaikan tugas"}
        size="md"
      />

      {/* Title & Desc dengan garis coret animasi saat completing */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "font-sans text-xs font-medium relative inline-flex items-center max-w-full",
            task.status === "DONE" && "line-through text-[var(--text-tertiary)]",
            isCompleting && "opacity-60 text-[var(--text-tertiary)] transition-opacity"
          )}
        >
          <span className="truncate">{task.title}</span>
          {isCompleting && (
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] w-full bg-[var(--text-tertiary)] origin-left pointer-events-none"
            />
          )}
        </div>
      </div>

      {/* Badges and Metadata */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Color-Blind Safe Priority Badge */}
        <PriorityBadge priority={task.priority} size="sm" />

        {/* Subtask Progress (e.g. 2/4) */}
        {totalSubtasks > 0 && (
          <span className="flex items-center gap-1 font-mono text-[10px] tabular-nums text-[var(--text-tertiary)] bg-[var(--surface-subtle)] px-1.5 py-0.5 rounded border border-[var(--border-hairline)]">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {/* Tag Chips (Max 2 + +N) */}
        {task.tags && task.tags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1">
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
          </div>
        )}

        {/* Due Date (Red if overdue) */}
        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded border border-[var(--border-hairline)]",
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

        {/* Quick Delete button (visible on row hover) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask(task.id);
          }}
          aria-label={`Hapus ${task.title}`}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-tertiary)] transition-all min-w-[28px] min-h-[28px] flex items-center justify-center"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ListView({
  tasks,
  serverNow,
  sortOption,
  isFiltered = false,
  onResetFilters,
  onFocusQuickAdd,
  onSelectTask,
  onToggleComplete,
  onDeleteTask,
  onCreateTaskInStatus,
  onMoveTask,
}: ListViewProps) {
  const [isCollapsed, setIsCollapsed] = useState<Record<string, boolean>>({});
  const [inlineGroup, setInlineGroup] = useState<TaskStatus | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");
  const [isSubmittingInline, setIsSubmittingInline] = useState(false);
  const [activeTask, setActiveTask] = useState<SerializedTaskWithRelations | null>(null);

  // Hook anti-race-condition untuk delayed completion (280ms)
  const { completingIds, handleToggleComplete } = useDelayedCompletion(onToggleComplete);

  const isDragDisabled = sortOption !== "manual";

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

  const handleInlineSubmit = async (status: TaskStatus) => {
    const title = inlineTitle.trim();
    if (!title || isSubmittingInline) return;

    setIsSubmittingInline(true);
    try {
      await onCreateTaskInStatus(status, title);
      setInlineTitle("");
      setInlineGroup(null);
    } finally {
      setIsSubmittingInline(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const draggedTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);
    if (!draggedTask || !overTask) return;

    const targetStatus = overTask.status;
    const targetSiblings = (groupedTasks[targetStatus] || []).filter((t) => t.id !== activeId);
    const overIndex = targetSiblings.findIndex((t) => t.id === overId);

    if (overIndex === -1) return;

    // Perhitungan prev dan next task untuk float gap
    const prevTask = overIndex > 0 ? targetSiblings[overIndex - 1] : null;
    const nextTask = targetSiblings[overIndex];

    await onMoveTask({
      taskId: activeId,
      status: targetStatus,
      prevTaskId: prevTask ? prevTask.id : null,
      nextTaskId: nextTask ? nextTask.id : null,
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-tertiary)] mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="font-display font-semibold text-sm text-[var(--text-primary)] mb-1">
          {isFiltered ? "Tidak ada tugas yang sesuai filter" : "Belum ada tugas di scope ini"}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] max-w-xs mb-4">
          {isFiltered
            ? "Coba sesuaikan kata kunci pencarian, filter prioritas, atau filter tag."
            : "Tambahkan tugas baru melalui Smart Quick-Add atau tombol di bawah."}
        </p>
        {isFiltered ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
          >
            Reset Filter
          </button>
        ) : (
          <button
            type="button"
            onClick={onFocusQuickAdd}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-xs font-semibold text-white transition-all shadow-sm cursor-pointer"
          >
            Buat Tugas Baru (N)
          </button>
        )}
      </div>
    );
  }

  const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-8 py-4">
      {/* Wajib menyertakan id statis pada DndContext untuk mencegah error hydration mismatch pada aria-describedby di Next.js SSR */}
      <DndContext
        id="dnd-list-view"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <div className="mx-auto max-w-5xl space-y-6">
          {statuses.map((status) => {
            const config = STATUS_CONFIG[status];
            const groupList = groupedTasks[status];
            const isGroupCollapsed = isCollapsed[status];
            const groupTaskIds = groupList.map((t) => t.id);

            return (
              <section key={status} className="space-y-2">
                {/* Group Header */}
                <div className="flex items-center justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", config.dotClass)} />
                    <span className="font-sans text-xs font-semibold text-[var(--text-secondary)]">
                      {config.label}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-[var(--text-tertiary)] px-1.5 py-0.2 rounded bg-[var(--surface-solid)] border border-[var(--border-hairline)]">
                      {groupList.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))}
                    className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-hover)] hover:text-[var(--text-primary)] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                    aria-expanded={!isGroupCollapsed}
                    aria-label={isGroupCollapsed ? `Buka grup ${config.label}` : `Tutup grup ${config.label}`}
                  >
                    <motion.span
                      animate={{ rotate: isGroupCollapsed ? -90 : 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="inline-flex items-center justify-center"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.span>
                  </button>
                </div>

                {/* Group Content dengan transisi tinggi akordeon halus */}
                <AnimatePresence initial={false}>
                  {!isGroupCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 px-1 py-1">
                        <SortableContext items={groupTaskIds} strategy={verticalListSortingStrategy}>
                          {groupList.map((task) => (
                            <SortableRow
                              key={task.id}
                              task={task}
                              serverNow={serverNow}
                              isDragDisabled={isDragDisabled}
                              isCompleting={completingIds.has(task.id)}
                              onSelectTask={onSelectTask}
                              onToggleComplete={() => handleToggleComplete(task.id, task.status === "DONE")}
                              onDeleteTask={onDeleteTask}
                            />
                          ))}
                        </SortableContext>

                        {/* Inline Quick Add Per Group */}
                        {inlineGroup === status ? (
                          <div className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
                            <input
                              type="text"
                              autoFocus
                              value={inlineTitle}
                              onChange={(e) => setInlineTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void handleInlineSubmit(status);
                                } else if (e.key === "Escape") {
                                  setInlineGroup(null);
                                  setInlineTitle("");
                                }
                              }}
                              placeholder={`Tambah tugas di ${config.label}... (Enter simpan, Esc batal)`}
                              aria-label={`Judul tugas baru di ${config.label}`}
                              className="flex-1 bg-transparent text-xs font-sans text-[var(--text-primary)] outline-none px-2"
                            />
                            <button
                              type="button"
                              onClick={() => void handleInlineSubmit(status)}
                              disabled={isSubmittingInline || !inlineTitle.trim()}
                              className="px-3 py-1 bg-[var(--accent-primary)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all cursor-pointer"
                            >
                              {isSubmittingInline ? "Menyimpan..." : "Tambah"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInlineGroup(null);
                                setInlineTitle("");
                              }}
                              className="px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setInlineGroup(status);
                              setInlineTitle("");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] rounded-xl transition-colors w-full justify-start border border-dashed border-transparent hover:border-[var(--border-hairline)] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah tugas di grup ini</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })}
        </div>

        {/* DragOverlay untuk baris yang diangkat */}
        <DragOverlay>
          {activeTask ? (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-primary)] bg-[var(--surface-solid)] p-3 shadow-2xl opacity-95 fluid-glass-elevated">
              <GripVertical className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <div className="font-sans text-xs font-medium text-[var(--text-primary)] truncate">
                {activeTask.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
