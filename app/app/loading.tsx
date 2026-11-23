"use client";

import { motion } from "motion/react";

export default function AppLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[100dvh] w-full flex bg-[var(--bg-canvas)] overflow-hidden"
    >
      {/* Sidebar Skeleton (hanya tampil di desktop md+) */}
      <aside className="w-[260px] shrink-0 bg-[var(--glass-sidebar)] border-r border-[var(--border-hairline)] flex flex-col justify-between hidden md:flex">
        <div>
          {/* Header Brand */}
          <div className="h-14 px-5 border-b border-[var(--border-hairline)] flex items-center gap-2.5">
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-8 h-8 rounded-xl bg-[var(--surface-subtle)]"
            />
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
              className="h-4 w-24 rounded bg-[var(--surface-subtle)]"
            />
          </div>

          {/* Navigation Items Skeleton */}
          <div className="p-3 space-y-4">
            <div className="space-y-1.5 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 + i * 0.08 }}
                  className="h-9 w-full rounded-xl bg-[var(--surface-subtle)]"
                />
              ))}
            </div>

            <div className="pt-2 space-y-1.5">
              <motion.div
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="h-3 w-20 rounded bg-[var(--surface-subtle)] mx-2 mb-2"
              />
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.55 + i * 0.08 }}
                  className="h-9 w-full rounded-xl bg-[var(--surface-subtle)]"
                />
              ))}
            </div>
          </div>
        </div>

        {/* User Footer Skeleton */}
        <div className="p-3 border-t border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-8 h-8 rounded-full bg-[var(--surface-subtle)]"
            />
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
              className="h-3 w-20 rounded bg-[var(--surface-subtle)]"
            />
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* WorkspaceHeader Skeleton (h-14 / 56px) */}
        <header className="h-14 shrink-0 border-b border-[var(--border-hairline)] bg-[var(--glass-header)] px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
              className="h-5 w-32 rounded bg-[var(--surface-subtle)]"
            />
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
              className="h-4 w-8 rounded-full bg-[var(--surface-subtle)] hidden sm:block"
            />
          </div>

          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              className="h-9 w-32 rounded-xl bg-[var(--surface-subtle)]"
            />
          </div>
        </header>

        {/* SmartQuickAdd Skeleton Bar */}
        <div className="shrink-0 border-t border-[var(--border-hairline)] bg-[var(--glass-header)] p-4">
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
            className="h-11 max-w-4xl mx-auto rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)]"
          />
        </div>

        {/* FilterToolbar Skeleton Bar */}
        <div className="shrink-0 px-4 sm:px-8 py-2 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)]/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="h-8 w-44 rounded-lg bg-[var(--surface-subtle)]"
            />
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
              className="h-8 w-28 rounded-lg bg-[var(--surface-subtle)]"
            />
          </div>
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="h-8 w-32 rounded-lg bg-[var(--surface-subtle)]"
          />
        </div>

        {/* Tasks View Skeleton */}
        <div className="flex-1 p-4 sm:p-8 space-y-3 overflow-y-auto max-w-5xl mx-auto w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.45 + i * 0.08 }}
              className="h-14 w-full rounded-xl bg-[var(--surface-solid)] border border-[var(--border-hairline)]"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
