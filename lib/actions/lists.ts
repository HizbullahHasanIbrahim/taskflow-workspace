"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { getCurrentUser } from "../auth";
import { createListSchema, updateListSchema, deleteListSchema } from "../validations";
import { ActionResponse, SerializedTaskList } from "../types";
import { getAppendPosition } from "../position";

/**
 * Membuat list tugas baru
 */
export async function createListAction(formData: FormData): Promise<ActionResponse<SerializedTaskList>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const raw = Object.fromEntries(formData.entries());
  const validated = createListSchema.safeParse(raw);

  if (!validated.success) {
    return { ok: false, error: validated.error.issues[0].message };
  }

  const { name, color, icon } = validated.data;

  try {
    const existingLists = await prisma.taskList.findMany({
      where: { userId: user.id },
      select: { position: true },
    });

    const position = getAppendPosition(existingLists);

    const list = await prisma.taskList.create({
      data: {
        name,
        color,
        icon,
        position,
        userId: user.id,
      },
    });

    revalidatePath("/app");
    return {
      ok: true,
      data: {
        ...list,
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Create List Error:", error);
    return { ok: false, error: "Gagal membuat list baru." };
  }
}

/**
 * Memperbarui list tugas
 */
export async function updateListAction(formData: FormData): Promise<ActionResponse<SerializedTaskList>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const raw = Object.fromEntries(formData.entries());
  const validated = updateListSchema.safeParse(raw);

  if (!validated.success) {
    return { ok: false, error: validated.error.issues[0].message };
  }

  const { id, name, color, icon } = validated.data;

  try {
    const listCheck = await prisma.taskList.findFirst({
      where: { id, userId: user.id },
    });

    if (!listCheck) return { ok: false, error: "List tidak ditemukan atau bukan milik Anda." };

    const updated = await prisma.taskList.update({
      where: { id },
      data: { name, color, icon },
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
    console.error("Update List Error:", error);
    return { ok: false, error: "Gagal memperbarui list." };
  }
}

/**
 * Menghapus list tugas (Anti-IDOR & Minimal 1 list check)
 */
export async function deleteListAction(formData: FormData): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir." };

  const raw = Object.fromEntries(formData.entries());
  const validated = deleteListSchema.safeParse(raw);

  if (!validated.success) {
    return { ok: false, error: validated.error.issues[0].message };
  }

  const { id } = validated.data;

  try {
    const totalLists = await prisma.taskList.count({ where: { userId: user.id } });
    if (totalLists <= 1) {
      return { ok: false, error: "Minimal harus ada 1 list di workspace." };
    }

    const listCheck = await prisma.taskList.findFirst({
      where: { id, userId: user.id },
    });

    if (!listCheck) return { ok: false, error: "List tidak ditemukan." };

    await prisma.taskList.delete({ where: { id } });

    revalidatePath("/app");
    return { ok: true, data: { id } };
  } catch (error) {
    console.error("Delete List Error:", error);
    return { ok: false, error: "Gagal menghapus list." };
  }
}
