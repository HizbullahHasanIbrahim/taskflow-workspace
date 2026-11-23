import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { SerializedTaskList, SerializedTaskWithRelations, SerializedTag } from "@/lib/types";

export default async function AppPage() {
  const user = await requireUser();

  const [lists, tasks, tags] = await Promise.all([
    prisma.taskList.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      include: {
        subtasks: { orderBy: { position: "asc" } },
        tags: true,
        list: { select: { id: true, name: true, color: true, icon: true } },
      },
      orderBy: { position: "asc" },
    }),
    prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialisasi seluruh field Date menjadi ISO string sebelum dikirim ke Client Component
  const serializedLists: SerializedTaskList[] = lists.map((list) => ({
    id: list.id,
    name: list.name,
    color: list.color,
    icon: list.icon,
    position: list.position,
    userId: list.userId,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  }));

  const serializedTasks: SerializedTaskWithRelations[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    position: task.position,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    listId: task.listId,
    userId: task.userId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    subtasks: task.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      isCompleted: s.isCompleted,
      position: s.position,
      taskId: s.taskId,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    tags: task.tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      userId: t.userId,
    })),
    list: task.list ? {
      id: task.list.id,
      name: task.list.name,
      color: task.list.color,
      icon: task.list.icon,
    } : undefined,
  }));

  const serializedTags: SerializedTag[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    userId: t.userId,
  }));

  return (
    <WorkspaceShell
      user={user}
      lists={serializedLists}
      tasks={serializedTasks}
      tags={serializedTags}
      serverNow={new Date().toISOString()}
    />
  );
}
