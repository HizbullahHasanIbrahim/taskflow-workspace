import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Gabungkan class Tailwind dengan cerdas (clsx + tailwind-merge)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format tanggal ke ISO String untuk serialisasi aman RSC -> Client
 */
export function serializeDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}
