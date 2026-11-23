import { TaskStatus, TaskPriority } from "@prisma/client";

export interface SerializedUser {
  id: string;
  name: string;
  email: string;
}

export interface SerializedTaskList {
  id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate: string | null;
  completedAt: string | null;
  listId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
  position: number;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedTag {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export type ActionResponse<T = unknown> = 
  | { ok: true; data: T }
  | { ok: false; error: string };
