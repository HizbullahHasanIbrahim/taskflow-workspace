import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

// TaskList Schemas
export const createListSchema = z.object({
  name: z.string().min(1, "Nama list wajib diisi"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format hex valid"),
  icon: z.string().min(1, "Ikon wajib diisi"),
});

export const updateListSchema = createListSchema.extend({
  id: z.string().cuid("ID list tidak valid"),
});

export const deleteListSchema = z.object({
  id: z.string().cuid("ID list tidak valid"),
});

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Judul tugas wajib diisi"),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  dueDate: z.string().optional().nullable(),
  listId: z.string().cuid("ID list wajib valid"),
  tagNames: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  id: z.string().cuid("ID tugas tidak valid"),
  title: z.string().min(1, "Judul tugas tidak boleh kosong").optional(),
  description: z.string().optional().nullable(),
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
  title: z.string().min(1, "Judul subtask wajib diisi"),
});

export const updateSubtaskSchema = z.object({
  id: z.string().cuid("ID subtask tidak valid"),
  title: z.string().min(1, "Judul subtask tidak boleh kosong"),
});

export const toggleSubtaskSchema = z.object({
  id: z.string().cuid("ID subtask tidak valid"),
});

export const deleteSubtaskSchema = z.object({
  id: z.string().cuid("ID subtask tidak valid"),
});

// Tag Schemas
export const createTagSchema = z.object({
  name: z.string().min(1, "Nama tag wajib diisi"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format hex valid"),
});

export const toggleTaskTagSchema = z.object({
  taskId: z.string().cuid("ID tugas tidak valid"),
  tagId: z.string().cuid("ID tag tidak valid"),
});

export const deleteTagSchema = z.object({
  id: z.string().cuid("ID tag tidak valid"),
});
