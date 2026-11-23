"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getCurrentUser } from "../auth";
import {
  createSubtaskSchema,
  updateSubtaskSchema,
  toggleSubtaskSchema,
  deleteSubtaskSchema,
} from "../validations";
import { ActionResponse, SerializedSubtask } from "../types";
import { getAppendPosition } from "../position";

/**
 * Membuat subtask baru
 */
export async function createSubtaskAction(input: {
  taskId: string;
  title: string;
}): Promise<ActionResponse<SerializedSubtask>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = createSubtaskSchema.safeParse(input);
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  const { taskId, title } = validated.data;

  try {
    const taskCheck = await prisma.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!taskCheck) return { ok: false, error: "Tugas tidak ditemukan." };

    const existing = await prisma.subtask.findMany({
      where: { taskId },
      select: { position: true },
    });
    const position = getAppendPosition(existing);

    const subtask = await prisma.subtask.create({
      data: {
        title,
        taskId,
        position,
      },
    });

    revalidatePath("/app");
    return {
      ok: true,
      data: {
        ...subtask,
        createdAt: subtask.createdAt.toISOString(),
        updatedAt: subtask.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Create Subtask Error:", error);
    return { ok: false, error: "Gagal membuat subtask." };
  }
}

/**
 * Toggle status subtask
 */
export async function toggleSubtaskAction(input: { id: string }): Promise<ActionResponse<SerializedSubtask>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = toggleSubtaskSchema.safeParse(input);
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  const { id } = validated.data;

  try {
    const subtask = await prisma.subtask.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!subtask || subtask.task.userId !== user.id) {
      return { ok: false, error: "Subtask tidak ditemukan." };
    }

    const updated = await prisma.subtask.update({
      where: { id },
      data: { isCompleted: !subtask.isCompleted },
    });

    revalidatePath("/app");
    return {
      ok: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Toggle Subtask Error:", error);
    return { ok: false, error: "Gagal mengubah status subtask." };
  }
}

/**
 * Memperbarui judul subtask
 */
export async function updateSubtaskAction(input: { id: string; title: string }): Promise<ActionResponse<SerializedSubtask>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = updateSubtaskSchema.safeParse(input);
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  const { id, title } = validated.data;

  try {
    const subtask = await prisma.subtask.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!subtask || subtask.task.userId !== user.id) {
      return { ok: false, error: "Subtask tidak ditemukan." };
    }

    const updated = await prisma.subtask.update({
      where: { id },
      data: { title },
    });

    revalidatePath("/app");
    return {
      ok: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Update Subtask Error:", error);
    return { ok: false, error: "Gagal memperbarui subtask." };
  }
}

/**
 * Menghapus subtask
 */
export async function deleteSubtaskAction(input: { id: string }): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = deleteSubtaskSchema.safeParse(input);
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  const { id } = validated.data;

  try {
    const subtask = await prisma.subtask.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!subtask || subtask.task.userId !== user.id) {
      return { ok: false, error: "Subtask tidak ditemukan." };
    }

    await prisma.subtask.delete({ where: { id } });

    revalidatePath("/app");
    return { ok: true, data: { id } };
  } catch (error) {
    console.error("Delete Subtask Error:", error);
    return { ok: false, error: "Gagal menghapus subtask." };
  }
}
