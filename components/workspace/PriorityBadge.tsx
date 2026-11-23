"use client";

import { TaskPriority } from "@prisma/client";
import { AlertCircle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const PRIORITY_CONFIG: Record<
  TaskPriority,
  {
    label: string;
    icon: React.ElementType;
    bg: string;
    text: string;
    border: string;
  }
> = {
  URGENT: {
    label: "Mendesak",
    icon: AlertCircle,
    bg: "bg-[var(--prio-urgent-bg)]",
    text: "text-[var(--prio-urgent-text)]",
    border: "border-[var(--prio-urgent-border)]",
  },
  HIGH: {
    label: "Tinggi",
    icon: ArrowUp,
    bg: "bg-[var(--prio-high-bg)]",
    text: "text-[var(--prio-high-text)]",
    border: "border-[var(--prio-high-border)]",
  },
  MEDIUM: {
    label: "Sedang",
    icon: Minus,
    bg: "bg-[var(--prio-medium-bg)]",
    text: "text-[var(--prio-medium-text)]",
    border: "border-[var(--prio-medium-border)]",
  },
  LOW: {
    label: "Rendah",
    icon: ArrowDown,
    bg: "bg-[var(--prio-low-bg)]",
    text: "text-[var(--prio-low-text)]",
    border: "border-[var(--prio-low-border)]",
  },
};

/**
 * Lencana Prioritas yang ramah buta warna (Color-Blind Safe).
 * Menggabungkan warna kontras tinggi, ikon penanda bentuk (shape cue),
 * dan teks deskriptif dalam sentence case.
 */
export function PriorityBadge({
  priority,
  className = "",
  size = "sm",
  showLabel = true,
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-sans font-medium transition-colors select-none",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        className
      )}
      title={`Prioritas: ${config.label}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3 stroke-[2]" : "w-3.5 h-3.5 stroke-[2]"} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
