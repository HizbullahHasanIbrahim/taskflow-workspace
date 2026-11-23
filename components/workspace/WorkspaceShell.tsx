"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Sidebar } from "./Sidebar";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { ListView } from "./ListView";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { SmartQuickAdd } from "./SmartQuickAdd";
import { SerializedUser, SerializedTaskList, SerializedTaskWithRelations, SerializedSubtask, SerializedTag, WorkspaceScope, WorkspaceView } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";
import { createTaskAction, deleteTaskAction, updateTaskAction, toggleTaskCompleteAction, restoreTaskAction } from "@/lib/actions/tasks";
import { createSubtaskAction, toggleSubtaskAction, updateSubtaskAction, deleteSubtaskAction } from "@/lib/actions/subtasks";
import { toggleTaskTagAction, createTagAction } from "@/lib/actions/tags";

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

  const selectedTask = tasksState.find((t) => t.id === selectedTaskId) || null;

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
        tagNames: taskPayload.tags.map(t => t.name),
      });

      if (res.ok) {
        setTasksState((prev) => prev.map((t) => (t.id === tempId ? res.data : t)));
        if (res.data.tags.length > 0) {
          setTagsState((prev) => {
            const existingIds = new Set(prev.map(t => t.id));
            const newTags = res.data.tags.filter(t => !existingIds.has(t.id));
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

  // Optimistic Toggle Complete dengan rollback
  const handleToggleTaskComplete = async (taskId: string) => {
    const snapshot = [...tasksState];

    setTasksState((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      const nextStatus = t.status === "DONE" ? "TODO" : "DONE";
      return {
        ...t,
        status: nextStatus as TaskStatus,
        completedAt: nextStatus === "DONE" ? new Date().toISOString() : null,
      };
    }));

    try {
      const res = await toggleTaskCompleteAction(taskId);
      if (!res.ok) throw new Error(res.error);
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status tugas.");
    }
  };

  // Optimistic Delete + Undo Toast dengan restoreTaskAction
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
                subtasks: task.subtasks.map(s => ({ title: s.title, isCompleted: s.isCompleted })),
                tagNames: task.tags.map(t => t.name),
              });

              if (restoreRes.ok) {
                setTasksState((prev) => [restoreRes.data, ...prev]);
                if (restoreRes.data.tags.length > 0) {
                  setTagsState((prev) => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const newTags = restoreRes.data.tags.filter(t => !existingIds.has(t.id));
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

  // Optimistic subtask toggle dengan rollback
  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const snapshot = [...tasksState];

    setTasksState((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
        ),
      };
    }));

    try {
      const res = await toggleSubtaskAction({ id: subtaskId });
      if (!res.ok) throw new Error(res.error);
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal mengubah subtask.");
    }
  };

  // Optimistic tag toggle dengan rollback & pengecekan targetTag
  const handleToggleTaskTag = async (taskId: string, tagId: string) => {
    const snapshot = [...tasksState];
    const targetTag = tagsState.find(tg => tg.id === tagId);
    if (!targetTag) return;

    setTasksState((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      const hasTag = t.tags.some(tg => tg.id === tagId);
      return {
        ...t,
        tags: hasTag
          ? t.tags.filter(tg => tg.id !== tagId)
          : [...t.tags, targetTag],
      };
    }));

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
        setTasksState((prev) => prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            tags: [...t.tags, newTag],
          };
        }));

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

    setTasksState((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t
    ));

    try {
      const res = await createSubtaskAction({ taskId, title });
      if (res.ok) {
        setTasksState((prev) => prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((s) => (s.id === tempSubId ? res.data : s)) }
            : t
        ));
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal membuat subtask.");
    }
  };

  // Optimistic subtask update tanpa merusak array tugas
  const handleUpdateSubtask = async (taskId: string, subtaskId: string, title: string) => {
    const snapshot = [...tasksState];

    setTasksState((prev) => prev.map((t) => (
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, title } : s)) }
        : t
    )));

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

    setTasksState((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) } : t
    ));

    try {
      const res = await deleteSubtaskAction({ id: subtaskId });
      if (!res.ok) throw new Error(res.error);
    } catch (err) {
      setTasksState(snapshot);
      toast.error(err instanceof Error ? err.message : "Gagal menghapus subtask.");
    }
  };

  const scopeTitle =
    activeScope === "all" ? "Semua Tugas"
    : activeScope === "today" ? "Hari Ini"
    : activeScope === "upcoming" ? "Mendatang"
    : activeScope === "completed" ? "Selesai"
    : listsState.find((l) => `list:${l.id}` === activeScope)?.name || "Tugas";

  const filteredTasks = tasksState.filter((t) => {
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

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[var(--bg-canvas)]">
      <WorkspaceHeader
        title={scopeTitle}
        taskCount={filteredTasks.length}
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onOpenCommandPalette={() => toast.info("Command Palette tersedia di Fase 3")}
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
          onListUpdated={(list) => setListsState((prev) => prev.map((l) => l.id === list.id ? list : l))}
          onListDeleted={(id) => {
            setListsState((prev) => prev.filter((l) => l.id !== id));
            setTasksState((prev) => prev.filter((t) => t.listId !== id));
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <SmartQuickAdd
            onCreateTask={handleCreateTask}
            serverNow={serverNow}
          />

          {activeView === "list" && (
            <ListView
              tasks={filteredTasks}
              serverNow={serverNow}
              onSelectTask={(id) => setSelectedTaskId(id)}
              onToggleComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
              onCreateTaskInStatus={handleCreateTaskInStatus}
            />
          )}

          {activeView === "board" && (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <h3 className="font-display font-bold text-lg mb-1">Kanban Board View</h3>
              <p className="text-xs text-[var(--text-tertiary)]">Akan hadir di Fase 3 dengan Drag-and-Drop presisi.</p>
            </div>
          )}

          {activeView === "calendar" && (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <h3 className="font-display font-bold text-lg mb-1">Calendar View</h3>
              <p className="text-xs text-[var(--text-tertiary)]">Akan hadir di Fase 3 dengan manajemen tenggat waktu.</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}