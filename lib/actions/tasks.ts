"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getCurrentUser } from "../auth";
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  toggleTaskCompleteSchema,
  moveTaskSchema,
} from "../validations";
import { ActionResponse, SerializedTaskWithRelations } from "../types";
import { calculateNextPosition, getAppendPosition } from "../position";
import { TaskStatus, TaskPriority } from "@prisma/client";

/**
 * Membuat tugas baru dengan dukungan tag otomatis (upsert) & posisi float gap
 */
export async function createTaskAction(input: {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  listId: string;
  tagNames?: string[];
}): Promise<ActionResponse<SerializedTaskWithRelations>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = createTaskSchema.safeParse(input);
  if (!validated.success) {
    return { ok: false, error: validated.error.issues[0].message };
  }

  const { title, description, status, priority, dueDate, listId, tagNames } = validated.data;

  try {
    // Verifikasi kepemilikan list (Anti-IDOR)
    const listCheck = await prisma.taskList.findFirst({
      where: { id: listId, userId: user.id },
    });
    if (!listCheck) return { ok: false, error: "List tujuan tidak valid." };

    // Hitung posisi append di status tersebut
    const existingTasks = await prisma.task.findMany({
      where: { userId: user.id, listId, status: status || TaskStatus.TODO },
      select: { position: true },
    });
    const position = getAppendPosition(existingTasks);

    // Proses tags (connectOrCreate)
    const tagConnectOrCreate = tagNames
      ? tagNames.map((tagName) => ({
          where: { userId_name: { userId: user.id, name: tagName } },
          create: { name: tagName, color: "#64748b", userId: user.id },
        }))
      : [];

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || TaskStatus.TODO,
        priority: priority || "MEDIUM",
        position,
        dueDate: dueDate ? new Date(dueDate) : null,
        listId,
        userId: user.id,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        subtasks: true,
        tags: true,
        list: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    revalidatePath("/app");
    return {
      ok: true,
      data: {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        subtasks: task.subtasks.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error("Create Task Error:", error);
    return { ok: false, error: "Gagal membuat tugas baru." };
  }
}

/**
 * Memperbarui tugas
 */
export async function updateTaskAction(input: {
  id: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  listId?: string;
}): Promise<ActionResponse<SerializedTaskWithRelations>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = updateTaskSchema.safeParse(input);
  if (!validated.success) {
    return { ok: false, error: validated.error.issues[0].message };
  }

  const { id, title, description, status, priority, dueDate, listId } = validated.data;

  try {
    const taskCheck = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!taskCheck) return { ok: false, error: "Tugas tidak ditemukan." };

    if (listId) {
      const listCheck = await prisma.taskList.findFirst({
        where: { id: listId, userId: user.id },
      });
      if (!listCheck) return { ok: false, error: "List tujuan tidak valid." };
    }

    let completedAt = taskCheck.completedAt;
    if (status) {
      if (status === TaskStatus.DONE && taskCheck.status !== TaskStatus.DONE) {
        completedAt = new Date();
      } else if (status !== TaskStatus.DONE && taskCheck.status === TaskStatus.DONE) {
        completedAt = null;
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(listId !== undefined && { listId }),
        completedAt,
      },
      include: {
        subtasks: true,
        tags: true,
        list: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    revalidatePath("/app");
    return {
      ok: true,
      data: {
        ...updated,
        dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        subtasks: updated.subtasks.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error("Update Task Error:", error);
    return { ok: false, error: "Gagal memperbarui tugas." };
  }
}

/**
 * Toggle cepat status selesai (DONE / TODO)
 */
export async function toggleTaskCompleteAction(id: string): Promise<ActionResponse<SerializedTaskWithRelations>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = toggleTaskCompleteSchema.safeParse({ id });
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  try {
    const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
    if (!task) return { ok: false, error: "Tugas tidak ditemukan." };

    const isDone = task.status === TaskStatus.DONE;
    const nextStatus = isDone ? TaskStatus.TODO : TaskStatus.DONE;
    const completedAt = isDone ? null : new Date();

    const updated = await prisma.task.update({
      where: { id },
      data: { status: nextStatus, completedAt },
      include: {
        subtasks: true,
        tags: true,
        list: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    revalidatePath("/app");
    return {
      ok: true,
      data: {
        ...updated,
        dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        subtasks: updated.subtasks.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error("Toggle Complete Error:", error);
    return { ok: false, error: "Gagal mengubah status tugas." };
  }
}

/**
 * Pindah posisi task (Drag-and-Drop) dengan algoritma Float Gap & auto-rebalance
 */
export async function moveTaskAction(input: {
  taskId: string;
  status: TaskStatus;
  targetListId?: string;
  prevTaskId?: string | null;
  nextTaskId?: string | null;
}): Promise<ActionResponse<{ success: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = moveTaskSchema.safeParse(input);
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  const { taskId, status, targetListId, prevTaskId, nextTaskId } = validated.data;

  try {
    const task = await prisma.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!task) return { ok: false, error: "Tugas tidak ditemukan." };

    const listId = targetListId || task.listId;
    if (targetListId) {
      const listCheck = await prisma.taskList.findFirst({ where: { id: listId, userId: user.id } });
      if (!listCheck) return { ok: false, error: "List tujuan tidak valid." };
    }

    let prevPos: number | null = null;
    let nextPos: number | null = null;

    if (prevTaskId) {
      const prevTask = await prisma.task.findFirst({ where: { id: prevTaskId, userId: user.id } });
      if (prevTask) prevPos = prevTask.position;
    }

    if (nextTaskId) {
      const nextTask = await prisma.task.findFirst({ where: { id: nextTaskId, userId: user.id } });
      if (nextTask) nextPos = nextTask.position;
    }

    const { position, needsRebalance } = calculateNextPosition(prevPos, nextPos);

    let completedAt = task.completedAt;
    if (status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
      completedAt = new Date();
    } else if (status !== TaskStatus.DONE && task.status === TaskStatus.DONE) {
      completedAt = null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          status,
          listId,
          position,
          completedAt,
        },
      });

      // Jika perlu rebalance, susun ulang seluruh posisi di list & status tersebut
      if (needsRebalance) {
        const siblings = await tx.task.findMany({
          where: { userId: user.id, listId, status },
          orderBy: { position: "asc" },
        });

        for (let i = 0; i < siblings.length; i++) {
          await tx.task.update({
            where: { id: siblings[i].id },
            data: { position: (i + 1) * 1024 },
          });
        }
      }
    });

    revalidatePath("/app");
    return { ok: true, data: { success: true } };
  } catch (error) {
    console.error("Move Task Error:", error);
    return { ok: false, error: "Gagal memindahkan tugas." };
  }
}

/**
 * Menghapus tugas (Anti-IDOR)
 */
export async function deleteTaskAction(input: { id: string }): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = deleteTaskSchema.safeParse(input);
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  const { id } = validated.data;

  try {
    const taskCheck = await prisma.task.findFirst({ where: { id, userId: user.id } });
    if (!taskCheck) return { ok: false, error: "Tugas tidak ditemukan." };

    await prisma.task.delete({ where: { id } });

    revalidatePath("/app");
    return { ok: true, data: { id } };
  } catch (error) {
    console.error("Delete Task Error:", error);
    return { ok: false, error: "Gagal menghapus tugas." };
  }
}

/**
 * Memulihkan tugas (untuk Undo Toast)
 */
export async function restoreTaskAction(snapshot: {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate?: string | null;
  listId: string;
  subtasks?: { title: string; isCompleted: boolean }[];
  tagNames?: string[];
}): Promise<ActionResponse<SerializedTaskWithRelations>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  try {
    const listCheck = await prisma.taskList.findFirst({
      where: { id: snapshot.listId, userId: user.id },
    });
    if (!listCheck) return { ok: false, error: "List tugas tidak ditemukan." };

    const tagConnectOrCreate = snapshot.tagNames
      ? snapshot.tagNames.map((name) => ({
          where: { userId_name: { userId: user.id, name } },
          create: { name, color: "#64748b", userId: user.id },
        }))
      : [];

    const restored = await prisma.task.create({
      data: {
        id: snapshot.id,
        title: snapshot.title,
        description: snapshot.description || null,
        status: snapshot.status,
        priority: snapshot.priority,
        position: snapshot.position,
        dueDate: snapshot.dueDate ? new Date(snapshot.dueDate) : null,
        listId: snapshot.listId,
        userId: user.id,
        subtasks: snapshot.subtasks
          ? {
              create: snapshot.subtasks.map((s, idx) => ({
                title: s.title,
                isCompleted: s.isCompleted,
                position: (idx + 1) * 1024,
              })),
            }
          : undefined,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        subtasks: true,
        tags: true,
        list: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    revalidatePath("/app");
    return {
      ok: true,
      data: {
        ...restored,
        dueDate: restored.dueDate ? restored.dueDate.toISOString() : null,
        completedAt: restored.completedAt ? restored.completedAt.toISOString() : null,
        createdAt: restored.createdAt.toISOString(),
        updatedAt: restored.updatedAt.toISOString(),
        subtasks: restored.subtasks.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error("Restore Task Error:", error);
    return { ok: false, error: "Gagal memulihkan tugas." };
  }
}
