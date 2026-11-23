"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const baseId = useId();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, type = "info", action }: Omit<ToastItem, "id">) => {
      const id = `${baseId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type, action }]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [baseId, removeToast]
  );

  const success = useCallback((message: string) => toast({ message, type: "success" }), [toast]);
  const error = useCallback((message: string) => toast({ message, type: "error" }), [toast]);
  const info = useCallback((message: string) => toast({ message, type: "info" }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, removeToast }}>
      {children}
      <aside aria-label="Notifikasi" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none items-center max-w-[90vw]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.34, 1.45, 0.64, 1] }}
              className="pointer-events-auto fluid-glass-elevated rounded-2xl px-4 py-3 flex items-center gap-3 text-sm font-medium shadow-2xl"
            >
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              {t.type === "info" && <Info className="w-5 h-5 text-blue-500 shrink-0" />}

              <span className="text-[var(--text-primary)]">{t.message}</span>

              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    removeToast(t.id);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-all active:scale-95 ml-1"
                >
                  {t.action.label}
                </button>
              )}

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Tutup notifikasi"
                className="p-1 rounded-lg hover:bg-[var(--glass-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus digunakan di dalam ToastProvider");
  }
  return context;
}
