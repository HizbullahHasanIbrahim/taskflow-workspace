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

export interface SerializedTaskWithRelations extends SerializedTask {
  subtasks: SerializedSubtask[];
  tags: SerializedTag[];
  list?: Pick<SerializedTaskList, "id" | "name" | "color" | "icon">;
}

export type WorkspaceScope = "all" | "today" | "upcoming" | "completed" | `list:${string}`;
export type WorkspaceView = "list" | "board" | "calendar";

export type SortOption = "manual" | "dueDate" | "priority" | "newest";
export type PriorityFilterOption = "ALL" | TaskPriority;

export interface MoveTaskResult {
  taskId: string;
  status: TaskStatus;
  listId: string;
  position: number;
  completedAt: string | null;
  rebalanced?: { id: string; position: number }[];
}

export type ActionResponse<T = unknown> = 
  | { ok: true; data: T }
  | { ok: false; error: string };
