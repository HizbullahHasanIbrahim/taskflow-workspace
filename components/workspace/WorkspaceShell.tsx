"use client";

import { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Sidebar } from "./Sidebar";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { ListView } from "./ListView";
import { BoardView } from "./BoardView";
import { CalendarView } from "./CalendarView";
import { FilterToolbar } from "./FilterToolbar";
import { CommandPalette } from "./CommandPalette";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { SmartQuickAdd } from "./SmartQuickAdd";
import {
  SerializedUser,
  SerializedTaskList,
  SerializedTaskWithRelations,
  SerializedSubtask,
  SerializedTag,
  WorkspaceScope,
  WorkspaceView,
  SortOption,
  PriorityFilterOption,
} from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
  toggleTaskCompleteAction,
  restoreTaskAction,
  moveTaskAction,
} from "@/lib/actions/tasks";
import {
  createSubtaskAction,
  toggleSubtaskAction,
  updateSubtaskAction,
  deleteSubtaskAction,
} from "@/lib/actions/subtasks";
import { toggleTaskTagAction, createTagAction } from "@/lib/actions/tags";
import { calculateNextPosition } from "@/lib/position";

interface WorkspaceShellProps {
  user: SerializedUser;
  lists: SerializedTaskList[];
  tasks: SerializedTaskWithRelations[];
  tags: SerializedTag[];
  serverNow: string;
}

export function WorkspaceShell({ user, lists, tasks, tags, serverNow }: WorkspaceShellProps) {
  const toast = useToast();

  const [listsState, setListsState] = useState<SerializedTaskList[]>(lists);
  const [tasksState, setTasksState] = useState<SerializedTaskWithRelations[]>(tasks);
  const [tagsState, setTagsState] = useState<SerializedTag[]>(tags);

  const [activeScope, setActiveScope] = useState<WorkspaceScope>("all");
  const [activeView, setActiveView] = useState<WorkspaceView>("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // State Filter & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterOption>("ALL");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("manual");

  // State Command Palette (Ctrl+K / Cmd+K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const selectedTask = tasksState.find((t) => t.id === selectedTaskId) || null;

  // Hitung jumlah tugas aktif untuk lencana sidebar
  const taskCountsByScope: Record<string, number> = {};
  taskCountsByScope.all = tasksState.filter((t) => t.status !== "DONE").length;
  taskCountsByScope.today = tasksState.filter((t) => {
    if (!t.dueDate || t.status === "DONE") return false;
    const d = new Date(t.dueDate);
    const today = new Date(serverNow);
    return d.toDateString() === today.toDateString();
  }).length;
  taskCountsByScope.upcoming = tasksState.filter((t) => {
    if (!t.dueDate || t.status === "DONE") return false;
    return new Date(t.dueDate) > new Date(serverNow);
  }).length;
  taskCountsByScope.completed = tasksState.filter((t) => t.status === "DONE").length;

  listsState.forEach((list) => {
    taskCountsByScope[list.id] = tasksState.filter((t) => t.listId === list.id && t.status !== "DONE").length;
  });

  const handleSelectScope = (scope: WorkspaceScope) => setActiveScope(scope);
  const handleSelectView = (view: WorkspaceView) => setActiveView(view);

  // Filter & Sort Simultan terpadu untuk seluruh tampilan (List, Board, Calendar)
  const filteredAndSortedTasks = useMemo(() => {
    // 1. Filter Scope (Smart View / Custom List)
    let list = tasksState.filter((t) => {
      if (activeScope === "all") return t.status !== "DONE";
      if (activeScope === "today") {
        if (!t.dueDate || t.status === "DONE") return false;
        return new Date(t.dueDate).toDateString() === new Date(serverNow).toDateString();
      }
      if (activeScope === "upcoming") {
        if (!t.dueDate || t.status === "DONE") return false;
        return new Date(t.dueDate) > new Date(serverNow);
      }
      if (activeScope === "completed") return t.status === "DONE";
      if (activeScope.startsWith("list:")) {
        return t.listId === activeScope.replace("list:", "");
      }
      return true;
    });

    // 2. Filter Pencarian Teks (judul dan deskripsi)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 3. Filter Prioritas
    if (priorityFilter !== "ALL") {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // 4. Filter Tag
    if (selectedTagId !== null) {
      list = list.filter((t) => t.tags.some((tg) => tg.id === selectedTagId));
    }

    // 5. Pengurutan (Sorting)
    const sorted = [...list];
    if (sortOption === "manual") {
      sorted.sort((a, b) => a.position - b.position);
    } else if (sortOption === "dueDate") {
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return a.position - b.position;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortOption === "priority") {
      const rank: Record<TaskPriority, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };
      sorted.sort((a, b) => {
        const diff = rank[b.priority] - rank[a.priority];
        if (diff !== 0) return diff;
        return a.position - b.position;
      });
    } else if (sortOption === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return sorted;
  }, [tasksState, activeScope, serverNow, searchQuery, priorityFilter, selectedTagId, sortOption]);

  // Reset seluruh filter & pencarian ke default
  const handleResetFilters = () => {
    setSearchQuery("");
    setPriorityFilter("ALL");
    setSelectedTagId(null);
    setSortOption("manual");
  };

  // Fokus cepat ke input SmartQuickAdd
  const handleFocusQuickAdd = () => {
    const el = document.getElementById("smart-quick-add-input") as HTMLInputElement | null;
    el?.focus();
  };

  // Pintasan Keyboard Global (Ctrl+K, 1, 2, 3, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K atau Cmd+K: Buka/Tutup Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Escape: Tutup Command Palette atau TaskDetailDrawer
      if (e.key === "Escape") {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          return;
        }
        if (selectedTaskId) {
          setSelectedTaskId(null);
          return;
        }
      }

      // Periksa apakah fokus sedang berada pada elemen input
      const activeTag = document.activeElement?.tagName;
      const isContentEditable = (document.activeElement as HTMLElement | null)?.isContentEditable;
      const isInputActive =
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        activeTag === "SELECT" ||
        isContentEditable;

      if (isInputActive || isCommandPaletteOpen) {
        return;
      }

      // Tombol 1, 2, 3 untuk mengganti tampilan
      if (e.key === "1") {
        e.preventDefault();
        setActiveView("list");
      } else if (e.key === "2") {
        e.preventDefault();
        setActiveView("board");
      } else if (e.key === "3") {
        e.preventDefault();
        setActiveView("calendar");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, selectedTaskId]);

  // Handler Pindah Tugas DnD (BoardView & ListView) dengan Float Gap & auto-rebalance
  const handleMoveTask = async (input: {
    taskId: string;
    status: TaskStatus;
    prevTaskId: string | null;
    nextTaskId: string | null;
  }) => {
    const { taskId, status, prevTaskId, nextTaskId } = input;
    const snapshot = [...tasksState];

    const currentTask = tasksState.find((t) => t.id === taskId);
    if (!currentTask) return;

    // Hitung posisi float gap O(1) di klien
    const prevTask = prevTaskId ? tasksState.find((t) => t.id === prevTaskId) : null;
    const nextTask = nextTaskId ? tasksState.find((t) => t.id === nextTaskId) : null;
    const prevPos = prevTask ? prevTask.position : null;
    const nextPos = nextTask ? nextTask.position : null;
    const { position } = calculateNextPosition(prevPos, nextPos);

    const isDone = status === "DONE";
    const completedAt = isDone ? (currentTask.completedAt || new Date().toISOString()) : null;

    // Optimistic Update instan pada state tugas
    setTasksState((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              position,
              completedAt,
            }
          : t
      )
    );

    try {
      const res = await moveTaskAction({
        taskId,
        status,
        prevTaskId,
        nextTaskId,
      });

      if (res.ok) {
        // Jika server melakukan rebalance, sinkronkan ulang seluruh posisi yang diperbarui
        if (res.data.rebalanced && res.data.rebalanced.length > 0) {
          const rebalanceMap = new Map(res.data.rebalanced.map((r) => [r.id, r.position]));
          setTasksState((prev) =>
            prev.map((t) =>
              rebalanceMap.has(t.id) ? { ...t, position: rebalanceMap.get(t.id)! } : t
            )
          );
        } else {
          setTasksState((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, position: res.data.position } : t))
          );
        }
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal memindahkan tugas.");
    }
  };

  // Optimistic Create Task dengan rollback otomatis
  const handleCreateTask = async (taskPayload: SerializedTaskWithRelations) => {
    let targetListId = listsState[0]?.id ?? "";
    if (activeScope.startsWith("list:")) targetListId = activeScope.replace("list:", "");

    const snapshot = [...tasksState];
    const tempId = `temp-${Date.now()}`;

    const tempTask: SerializedTaskWithRelations = {
      id: tempId,
      title: taskPayload.title,
      description: taskPayload.description,
      status: taskPayload.status as TaskStatus,
      priority: taskPayload.priority as TaskPriority,
      position: 1024,
      dueDate: taskPayload.dueDate,
      completedAt: null,
      listId: targetListId,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: [],
      tags: [],
      list: undefined,
    };

    setTasksState((prev) => [tempTask, ...prev]);

    try {
      const res = await createTaskAction({
        title: taskPayload.title,
        description: taskPayload.description,
        status: taskPayload.status as TaskStatus,
        priority: taskPayload.priority as TaskPriority,
        dueDate: taskPayload.dueDate,
        listId: targetListId,
        tagNames: taskPayload.tags.map((t) => t.name),
      });

      if (res.ok) {
        setTasksState((prev) => prev.map((t) => (t.id === tempId ? res.data : t)));
        if (res.data.tags.length > 0) {
          setTagsState((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newTags = res.data.tags.filter((t) => !existingIds.has(t.id));
            return [...prev, ...newTags];
          });
        }
        toast.success("Tugas berhasil dibuat.");
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal membuat tugas.");
    }
  };

  // Buat tugas langsung dengan tenggat tanggal tertentu (CalendarView)
  const handleCreateTaskWithDate = async (title: string, dueDate: string) => {
    let targetListId = listsState[0]?.id ?? "";
    if (activeScope.startsWith("list:")) targetListId = activeScope.replace("list:", "");

    const tempTask: SerializedTaskWithRelations = {
      id: `temp-${Date.now()}`,
      title,
      description: null,
      status: "TODO",
      priority: "MEDIUM",
      position: 1024,
      dueDate,
      completedAt: null,
      listId: targetListId,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: [],
      tags: [],
      list: undefined,
    };

    await handleCreateTask(tempTask);
  };

  // Optimistic Toggle Complete dengan rollback
  const handleToggleTaskComplete = async (taskId: string) => {
    const snapshot = [...tasksState];

    setTasksState((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus = t.status === "DONE" ? "TODO" : "DONE";
        return {
          ...t,
          status: nextStatus as TaskStatus,
          completedAt: nextStatus === "DONE" ? new Date().toISOString() : null,
        };
      })
    );

    try {
      const res = await toggleTaskCompleteAction(taskId);
      if (!res.ok) throw new Error(res.error);
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status tugas.");
    }
  };

  // Optimistic Delete + Undo Toast
  const handleDeleteTask = async (taskId: string) => {
    const task = tasksState.find((t) => t.id === taskId);
    if (!task) return;

    const snapshot = [...tasksState];

    setTasksState((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTaskId(null);

    try {
      const res = await deleteTaskAction({ id: taskId });
      if (!res.ok) throw new Error(res.error);

      toast.toast({
        message: "Tugas dihapus",
        type: "info",
        action: {
          label: "Urungkan",
          onClick: async () => {
            try {
              const restoreRes = await restoreTaskAction({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                position: task.position,
                dueDate: task.dueDate,
                listId: task.listId,
                subtasks: task.subtasks.map((s) => ({ title: s.title, isCompleted: s.isCompleted })),
                tagNames: task.tags.map((t) => t.name),
              });

              if (restoreRes.ok) {
                setTasksState((prev) => [restoreRes.data, ...prev]);
                if (restoreRes.data.tags.length > 0) {
                  setTagsState((prev) => {
                    const existingIds = new Set(prev.map((t) => t.id));
                    const newTags = restoreRes.data.tags.filter((t) => !existingIds.has(t.id));
                    return [...prev, ...newTags];
                  });
                }
              } else {
                setTasksState(snapshot);
                toast.error("Gagal memulihkan tugas.");
              }
            } catch {
              setTasksState(snapshot);
              toast.error("Gagal memulihkan tugas.");
            }
          },
        },
      });
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal menghapus tugas.");
    }
  };

  // Optimistic subtask toggle
  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const snapshot = [...tasksState];

    setTasksState((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
          ),
        };
      })
    );

    try {
      const res = await toggleSubtaskAction({ id: subtaskId });
      if (!res.ok) throw new Error(res.error);
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal mengubah subtask.");
    }
  };

  // Optimistic tag toggle
  const handleToggleTaskTag = async (taskId: string, tagId: string) => {
    const snapshot = [...tasksState];
    const targetTag = tagsState.find((tg) => tg.id === tagId);
    if (!targetTag) return;

    setTasksState((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const hasTag = t.tags.some((tg) => tg.id === tagId);
        return {
          ...t,
          tags: hasTag
            ? t.tags.filter((tg) => tg.id !== tagId)
            : [...t.tags, targetTag],
        };
      })
    );

    try {
      const res = await toggleTaskTagAction({ taskId, tagId });
      if (!res.ok) throw new Error(res.error);
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal menghubungkan tag.");
    }
  };

  // Optimistic tag create
  const handleCreateTag = async (taskId: string, name: string, color: string) => {
    try {
      const res = await createTagAction({ name, color });
      if (res.ok) {
        const newTag = res.data;
        setTagsState((prev) => [...prev, newTag]);

        const snapshot = [...tasksState];
        setTasksState((prev) =>
          prev.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              tags: [...t.tags, newTag],
            };
          })
        );

        const linkRes = await toggleTaskTagAction({ taskId, tagId: newTag.id });
        if (!linkRes.ok) {
          setTasksState(snapshot);
          throw new Error(linkRes.error);
        }
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat tag.");
    }
  };

  // Optimistic subtask create
  const handleCreateSubtask = async (taskId: string, title: string) => {
    const snapshot = [...tasksState];
    const tempSubId = `temp-sub-${Date.now()}`;
    const newSubtask: SerializedSubtask = {
      id: tempSubId,
      title,
      isCompleted: false,
      position: 1024,
      taskId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasksState((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t
      )
    );

    try {
      const res = await createSubtaskAction({ taskId, title });
      if (res.ok) {
        setTasksState((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.map((s) => (s.id === tempSubId ? res.data : s)) }
              : t
          )
        );
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal membuat subtask.");
    }
  };

  // Optimistic subtask update
  const handleUpdateSubtask = async (taskId: string, subtaskId: string, title: string) => {
    const snapshot = [...tasksState];

    setTasksState((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, title } : s)) }
          : t
      )
    );

    try {
      const res = await updateSubtaskAction({ id: subtaskId, title });
      if (!res.ok) throw new Error(res.error);
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui subtask.");
    }
  };

  const handleCreateTaskInStatus = async (status: TaskStatus, title: string) => {
    let targetListId = listsState[0]?.id ?? "";
    if (activeScope.startsWith("list:")) targetListId = activeScope.replace("list:", "");

    const tempTask: SerializedTaskWithRelations = {
      id: `temp-${Date.now()}`,
      title,
      description: null,
      status,
      priority: "MEDIUM",
      position: 1024,
      dueDate: null,
      completedAt: null,
      listId: targetListId,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: [],
      tags: [],
      list: undefined,
    };

    await handleCreateTask(tempTask);
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    const snapshot = [...tasksState];

    setTasksState((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t
      )
    );

    try {
      const res = await deleteSubtaskAction({ id: subtaskId });
      if (!res.ok) throw new Error(res.error);
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal menghapus subtask.");
    }
  };

  const scopeTitle =
    activeScope === "all"
      ? "Semua Tugas"
      : activeScope === "today"
      ? "Hari Ini"
      : activeScope === "upcoming"
      ? "Mendatang"
      : activeScope === "completed"
      ? "Selesai"
      : listsState.find((l) => `list:${l.id}` === activeScope)?.name || "Tugas";

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[var(--bg-canvas)]">
      <WorkspaceHeader
        title={scopeTitle}
        taskCount={filteredAndSortedTasks.length}
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={user}
          lists={listsState}
          taskCountsByScope={taskCountsByScope}
          activeScope={activeScope}
          onSelectScope={handleSelectScope}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onListCreated={(list) => setListsState((prev) => [list, ...prev])}
          onListUpdated={(list) =>
            setListsState((prev) => prev.map((l) => (l.id === list.id ? list : l)))
          }
          onListDeleted={(id) => {
            setListsState((prev) => prev.filter((l) => l.id !== id));
            setTasksState((prev) => prev.filter((t) => t.listId !== id));
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <SmartQuickAdd onCreateTask={handleCreateTask} serverNow={serverNow} />

          {/* Toolbar Filter dan Sorting Simultan */}
          <FilterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            selectedTagId={selectedTagId}
            onTagChange={setSelectedTagId}
            sortOption={sortOption}
            onSortChange={setSortOption}
            tags={tagsState}
            onResetFilters={handleResetFilters}
          />

          {activeView === "list" && (
            <ListView
              tasks={filteredAndSortedTasks}
              serverNow={serverNow}
              sortOption={sortOption}
              onSelectTask={(id) => setSelectedTaskId(id)}
              onToggleComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
              onCreateTaskInStatus={handleCreateTaskInStatus}
              onMoveTask={handleMoveTask}
            />
          )}

          {activeView === "board" && (
            <BoardView
              tasks={filteredAndSortedTasks}
              serverNow={serverNow}
              sortOption={sortOption}
              onSelectTask={(id) => setSelectedTaskId(id)}
              onToggleComplete={handleToggleTaskComplete}
              onCreateTaskInStatus={handleCreateTaskInStatus}
              onMoveTask={handleMoveTask}
            />
          )}

          {activeView === "calendar" && (
            <CalendarView
              tasks={filteredAndSortedTasks}
              serverNow={serverNow}
              onSelectTask={(id) => setSelectedTaskId(id)}
              onToggleComplete={handleToggleTaskComplete}
              onCreateTaskWithDate={handleCreateTaskWithDate}
            />
          )}
        </div>
      </div>

      {/* Task Detail Drawer */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailDrawer
            key={selectedTask.id}
            task={selectedTask}
            lists={listsState}
            tags={tagsState}
            onClose={() => setSelectedTaskId(null)}
            onSave={async (updated) => {
              const res = await updateTaskAction({ id: selectedTask.id, ...updated });
              if (res.ok) {
                setTasksState((prev) => prev.map((t) => (t.id === res.data.id ? res.data : t)));
              }
            }}
            onDelete={() => handleDeleteTask(selectedTask.id)}
            onCreateSubtask={handleCreateSubtask}
            onUpdateSubtask={handleUpdateSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onToggleSubtask={handleToggleSubtask}
            onToggleTag={handleToggleTaskTag}
            onCreateTag={handleCreateTag}
          />
        )}
      </AnimatePresence>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        lists={listsState}
        tasks={tasksState}
        onSelectTask={(id) => setSelectedTaskId(id)}
        onSelectScope={(scope) => setActiveScope(scope)}
        onSelectView={(view) => setActiveView(view)}
        onFocusQuickAdd={handleFocusQuickAdd}
      />
    </div>
  );
}
