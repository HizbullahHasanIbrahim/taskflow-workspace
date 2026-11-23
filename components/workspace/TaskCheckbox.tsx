"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TaskCheckboxProps {
  checked: boolean;
  isCompleting?: boolean;
  onClick: (e: React.MouseEvent) => void;
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Komponen tombol centang tugas dengan animasi spring tap dan path draw SVG
 */
export function TaskCheckbox({
  checked,
  isCompleting = false,
  onClick,
  ariaLabel = "Tandai tugas selesai",
  size = "md",
  className,
}: TaskCheckboxProps) {
  const isChecked = checked || isCompleting;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.82 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      aria-label={ariaLabel}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer select-none",
        size === "sm" ? "h-4 w-4" : "h-5 w-5",
        isChecked
          ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
          : "border-[var(--border-strong)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-soft)]",
        className
      )}
    >
      {isChecked && (
        <svg
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3", "text-white")}
        >
          <motion.path
            d="M3.5 7.5L5.5 10L10.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />
        </svg>
      )}
    </motion.button>
  );
}

/**
 * Hook pengelola jeda penyelesaian tugas (280ms) dengan penjaga anti-race-condition
 */
export function useDelayedCompletion(onToggleComplete: (taskId: string) => void) {
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  // Menyimpan referensi timer untuk setiap taskId guna mencegah race condition saat klik berulang
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Bersihkan semua timer aktif saat komponen unmount untuk mencegah memory leak
  useEffect(() => {
    const currentTimers = timersRef.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const handleToggleComplete = useCallback(
    (taskId: string, isDone: boolean) => {
      // Jika tugas sudah selesai (ingin dibatalkan / uncheck), langsung eksekusi tanpa jeda 280ms
      if (isDone) {
        if (timersRef.current.has(taskId)) {
          clearTimeout(timersRef.current.get(taskId)!);
          timersRef.current.delete(taskId);
          setCompletingIds((prev) => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
        }
        onToggleComplete(taskId);
        return;
      }

      // Guard anti-race-condition: jika user mengklik ulang sebelum 280ms habis, batalkan timer
      if (timersRef.current.has(taskId)) {
        clearTimeout(timersRef.current.get(taskId)!);
        timersRef.current.delete(taskId);
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        return;
      }

      // Masukkan taskId ke daftar completing untuk memicu garis coret dan efek visual
      setCompletingIds((prev) => new Set(prev).add(taskId));

      // Jadwalkan pemanggilan onToggleComplete setelah animasi coret 280ms selesai
      const timer = setTimeout(() => {
        timersRef.current.delete(taskId);
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        onToggleComplete(taskId);
      }, 280);

      timersRef.current.set(taskId, timer);
    },
    [onToggleComplete]
  );

  return {
    completingIds,
    handleToggleComplete,
  };
}
