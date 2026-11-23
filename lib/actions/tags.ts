"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getCurrentUser } from "../auth";
import {
  createTagSchema,
  toggleTaskTagSchema,
  deleteTagSchema,
} from "../validations";
import { ActionResponse, SerializedTag } from "../types";

/**
 * Membuat tag baru
 */
export async function createTagAction(input: {
  name: string;
  color: string;
}): Promise<ActionResponse<SerializedTag>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = createTagSchema.safeParse(input);
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  const { name, color } = validated.data;

  try {
    const tagCheck = await prisma.tag.findFirst({
      where: { userId: user.id, name: name },
    });
    if (tagCheck) return { ok: false, error: "Tag sudah ada." };

    const tag = await prisma.tag.create({
      data: {
        name,
        color,
        userId: user.id,
      },
    });

    revalidatePath("/app");
    return {
      ok: true,
      data: {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        userId: tag.userId,
      },
    };
  } catch (error) {
    console.error("Create Tag Error:", error);
    return { ok: false, error: "Gagal membuat tag." };
  }
}

/**
 * Menghapus tag
 */
export async function deleteTagAction(input: { id: string }): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = deleteTagSchema.safeParse(input);
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  const { id } = validated.data;

  try {
    const tag = await prisma.tag.findFirst({
      where: { id, userId: user.id },
    });
    if (!tag) return { ok: false, error: "Tag tidak ditemukan." };

    await prisma.tag.delete({ where: { id } });

    revalidatePath("/app");
    return { ok: true, data: { id } };
  } catch (error) {
    console.error("Delete Tag Error:", error);
    return { ok: false, error: "Gagal menghapus tag." };
  }
}

/**
 * Menghubungkan/disconnect tag pada task
 */
export async function toggleTaskTagAction(input: { taskId: string; tagId: string }): Promise<ActionResponse<{ success: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const validated = toggleTaskTagSchema.safeParse(input);
  if (!validated.success) return { ok: false, error: validated.error.issues[0].message };

  const { taskId, tagId } = validated.data;

  try {
    const task = await prisma.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!task) return { ok: false, error: "Tugas tidak ditemukan." };

    const tag = await prisma.tag.findFirst({ where: { id: tagId, userId: user.id } });
    if (!tag) return { ok: false, error: "Tag tidak ditemukan." };

    const alreadyConnected = await prisma.task.findFirst({
      where: { id: taskId, tags: { some: { id: tag.id } } },
    });

    if (alreadyConnected) {
      await prisma.task.update({
        where: { id: taskId },
        data: { tags: { disconnect: { id: tag.id } } },
      });
    } else {
      await prisma.task.update({
        where: { id: taskId },
        data: { tags: { connect: { id: tag.id } } },
      });
    }

    revalidatePath("/app");
    return { ok: true, data: { success: true } };
  } catch (error) {
    console.error("Toggle Task Tag Error:", error);
    return { ok: false, error: "Gagal menghubungkan tag." };
  }
}