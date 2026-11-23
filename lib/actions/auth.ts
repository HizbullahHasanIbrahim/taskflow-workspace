"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { signJWT, requireUser } from "../auth";
import { loginSchema, registerSchema, updateProfileSchema } from "../validations";
import { ActionResponse, SerializedUser } from "../types";

/**
 * Pendaftaran akun baru + Auto-Seed onboarding data
 */
export async function registerAction(formData: FormData): Promise<ActionResponse> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = registerSchema.safeParse(rawData);

  if (!validated.success) {
    return { ok: false, error: validated.error.issues[0].message };
  }

  const { name, email, password } = validated.data;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) return { ok: false, error: "Email sudah terdaftar." };

    const passwordHash = await bcrypt.hash(password, 10);

    // Jalankan User creation + Auto-seed dalam satu transaksi
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name: normalizedName, email: normalizedEmail, passwordHash },
        select: { id: true, name: true, email: true },
      });

      // 1. Seed TaskLists
      const inboxList = await tx.taskList.create({
        data: { name: "Inbox", color: "#007aff", icon: "inbox", position: 1024, userId: newUser.id },
      });
      const workList = await tx.taskList.create({
        data: { name: "Kuliah & Kerja", color: "#af52de", icon: "briefcase", position: 2048, userId: newUser.id },
      });
      const personalList = await tx.taskList.create({
        data: { name: "Pribadi", color: "#34c759", icon: "sparkles", position: 3072, userId: newUser.id },
      });

      // 2. Seed Tags
      const tagPenting = await tx.tag.create({
        data: { name: "penting", color: "#ef4444", userId: newUser.id },
      });
      await tx.tag.create({ data: { name: "cepat", color: "#007aff", userId: newUser.id } });
      await tx.tag.create({ data: { name: "riset", color: "#af52de", userId: newUser.id } });

      // 3. Seed Tasks
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const task1 = await tx.task.create({
        data: {
          title: "Selesaikan desain sistem TaskFlow",
          status: "IN_PROGRESS",
          priority: "HIGH",
          position: 1024,
          dueDate: tomorrow,
          listId: workList.id,
          userId: newUser.id,
          tags: { connect: { id: tagPenting.id } },
        },
      });

      // Subtasks untuk task1
      await tx.subtask.createMany({
        data: [
          { title: "Definisikan warna semantic", isCompleted: true, position: 1024, taskId: task1.id },
          { title: "Implementasi fluid glass CSS", isCompleted: false, position: 2048, taskId: task1.id },
        ],
      });

      await tx.task.create({
        data: {
          title: "Beli kopi & stok cemilan",
          status: "TODO",
          priority: "LOW",
          position: 1024,
          listId: personalList.id,
          userId: newUser.id,
        },
      });

      await tx.task.create({
        data: {
          title: "Cek email masuk",
          status: "DONE",
          priority: "MEDIUM",
          position: 1024,
          completedAt: new Date(),
          listId: inboxList.id,
          userId: newUser.id,
        },
      });

      await tx.task.create({
        data: {
          title: "Riset library DnD",
          status: "REVIEW",
          priority: "MEDIUM",
          position: 2048,
          listId: workList.id,
          userId: newUser.id,
        },
      });

      return newUser;
    });

    const token = await signJWT({ userId: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set("taskflow_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { ok: true, data: { id: user.id, name: user.name, email: user.email } };
  } catch (error) {
    console.error("Register Error:", error);
    return { ok: false, error: "Terjadi kesalahan saat pendaftaran." };
  }
}

/**
 * Masuk ke akun
 */
export async function loginAction(formData: FormData): Promise<ActionResponse> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    return { ok: false, error: validated.error.issues[0].message };
  }

  const { email, password } = validated.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, passwordHash: true },
    });
    if (!user) return { ok: false, error: "Email atau password salah." };

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return { ok: false, error: "Email atau password salah." };

    const token = await signJWT({ userId: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set("taskflow_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { ok: true, data: { id: user.id, name: user.name, email: user.email } };
  } catch (error) {
    console.error("Login Error:", error);
    return { ok: false, error: "Terjadi kesalahan saat masuk." };
  }
}

/**
 * Keluar dari akun
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("taskflow_session");
  redirect("/login");
}

/**
 * Memperbarui profil pengguna (Nama, Email, dan opsional Password Baru)
 */
export async function updateProfileAction(formData: FormData): Promise<ActionResponse<SerializedUser>> {
  const sessionUser = await requireUser();
  const rawData = Object.fromEntries(formData.entries());
  const validated = updateProfileSchema.safeParse(rawData);

  if (!validated.success) {
    return { ok: false, error: validated.error.issues[0].message };
  }

  const { name, email, currentPassword, newPassword } = validated.data;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  try {
    // 1. Cek apakah email diubah dan sudah terdaftar pada akun lain
    if (normalizedEmail !== sessionUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (existingUser && existingUser.id !== sessionUser.id) {
        return { ok: false, error: "Email sudah digunakan oleh akun lain." };
      }
    }

    // 2. Cek verifikasi password jika ingin mengganti password
    let passwordHashToUpdate: string | undefined;
    if (newPassword) {
      if (!currentPassword) {
        return { ok: false, error: "Password saat ini wajib diisi untuk mengganti password." };
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { passwordHash: true },
      });

      if (!dbUser) {
        return { ok: false, error: "Pengguna tidak ditemukan." };
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!isCurrentValid) {
        return { ok: false, error: "Password saat ini tidak sesuai." };
      }

      passwordHashToUpdate = await bcrypt.hash(newPassword, 10);
    }

    // 3. Update data di database dengan select eksplisit (anti bocor passwordHash)
    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        name: normalizedName,
        email: normalizedEmail,
        ...(passwordHashToUpdate ? { passwordHash: passwordHashToUpdate } : {}),
      },
      select: { id: true, name: true, email: true },
    });

    // 4. Perbarui cookie sesi JWT jika email berubah
    if (normalizedEmail !== sessionUser.email) {
      const token = await signJWT({ userId: updatedUser.id, email: updatedUser.email });
      const cookieStore = await cookies();
      cookieStore.set("taskflow_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return { ok: true, data: updatedUser };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return { ok: false, error: "Terjadi kesalahan saat memperbarui profil." };
  }
}
