import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid").max(255, "Email maksimal 255 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter").max(100, "Password maksimal 100 karakter"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80, "Nama maksimal 80 karakter"),
  email: z.string().trim().toLowerCase().email("Format email tidak valid").max(255, "Email maksimal 255 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter").max(100, "Password maksimal 100 karakter"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80, "Nama maksimal 80 karakter"),
  email: z.string().trim().toLowerCase().email("Format email tidak valid").max(255, "Email maksimal 255 karakter"),
  currentPassword: z.string().max(100).optional(),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter").max(100, "Password baru maksimal 100 karakter").optional(),
});

// TaskList Schemas
export const createListSchema = z.object({
  name: z.string().trim().min(1, "Nama list wajib diisi").max(80, "Nama list maksimal 80 karakter"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format hex valid"),
  icon: z.string().trim().min(1, "Ikon wajib diisi").max(50, "Ikon maksimal 50 karakter"),
});

export const updateListSchema = createListSchema.extend({
  id: z.string().cuid("ID list tidak valid"),
});

export const deleteListSchema = z.object({
  id: z.string().cuid("ID list tidak valid"),
});

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Judul tugas wajib diisi").max(200, "Judul tugas maksimal 200 karakter"),
  description: z.string().max(5000, "Deskripsi maksimal 5000 karakter").optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  dueDate: z.string().optional().nullable(),
  listId: z.string().cuid("ID list wajib valid"),
  tagNames: z.array(z.string().trim().toLowerCase().min(1).max(32)).optional(),
});

export const updateTaskSchema = z.object({
  id: z.string().cuid("ID tugas tidak valid"),
  title: z.string().trim().min(1, "Judul tugas tidak boleh kosong").max(200, "Judul tugas maksimal 200 karakter").optional(),
  description: z.string().max(5000, "Deskripsi maksimal 5000 karakter").optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().optional().nullable(),
  listId: z.string().cuid().optional(),
});

export const deleteTaskSchema = z.object({
  id: z.string().cuid("ID tugas tidak valid"),
});

export const toggleTaskCompleteSchema = z.object({
  id: z.string().cuid("ID tugas tidak valid"),
});

export const moveTaskSchema = z.object({
  taskId: z.string().cuid("ID tugas tidak valid"),
  status: z.nativeEnum(TaskStatus),
  targetListId: z.string().cuid().optional(),
  prevTaskId: z.string().cuid().nullable().optional(),
  nextTaskId: z.string().cuid().nullable().optional(),
});

// Subtask Schemas
export const createSubtaskSchema = z.object({
  taskId: z.string().cuid("ID tugas tidak valid"),
  title: z.string().trim().min(1, "Judul subtask wajib diisi").max(200, "Judul subtask maksimal 200 karakter"),
});

export const updateSubtaskSchema = z.object({
  id: z.string().cuid("ID subtask tidak valid"),
  title: z.string().trim().min(1, "Judul subtask tidak boleh kosong").max(200, "Judul subtask maksimal 200 karakter"),
});

export const toggleSubtaskSchema = z.object({
  id: z.string().cuid("ID subtask tidak valid"),
});

export const deleteSubtaskSchema = z.object({
  id: z.string().cuid("ID subtask tidak valid"),
});

// Tag Schemas
export const createTagSchema = z.object({
  name: z.string().trim().toLowerCase().min(1, "Nama tag wajib diisi").max(32, "Nama tag maksimal 32 karakter"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format hex valid"),
});

export const toggleTaskTagSchema = z.object({
  taskId: z.string().cuid("ID tugas tidak valid"),
  tagId: z.string().cuid("ID tag tidak valid"),
});

export const deleteTagSchema = z.object({
  id: z.string().cuid("ID tag tidak valid"),
});
