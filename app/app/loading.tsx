"use client";

import { motion } from "motion/react";

export default function AppLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[100dvh] w-full flex bg-[var(--bg-canvas)] overflow-hidden"
    >
      {/* Sidebar Skeleton */}
      <aside className="w-[260px] shrink-0 bg-[var(--glass-sidebar)] border-r border-[var(--border-hairline)] p-4 space-y-4 hidden md:block">
        <div className="flex items-center gap-3 px-2 py-2">
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-8 h-8 rounded-lg bg-[var(--surface-subtle)]"
          />
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            className="h-4 w-24 rounded bg-[var(--surface-subtle)]"
          />
        </div>

        <div className="space-y-2 pt-4">
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="h-8 w-full rounded-lg bg-[var(--surface-subtle)]"
          />
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="h-8 w-full rounded-lg bg-[var(--surface-subtle)]"
          />
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="h-8 w-full rounded-lg bg-[var(--surface-subtle)]"
          />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Skeleton */}
        <header className="h-[60px] shrink-0 border-b border-[var(--border-hairline)] flex items-center justify-between px-6">
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="h-6 w-32 rounded bg-[var(--surface-subtle)]"
          />
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="h-8 w-24 rounded-lg bg-[var(--surface-subtle)]"
          />
        </header>

        {/* Task List Skeleton */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 + i * 0.1 }}
              className="h-16 w-full rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)]"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}