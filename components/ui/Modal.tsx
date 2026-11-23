"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

export function Modal({ title, children, onClose, isOpen, className = "" }: ModalProps) {
  const modalClassName = className;
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title || "Modal"}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className={`fluid-glass-elevated rounded-2xl shadow-2xl w-full max-w-md p-6 relative ${modalClassName}`}
            role="document"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                {title || "Modal"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup dialog"
                className="p-1.5 -mr-1 rounded-lg hover:bg-[var(--glass-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}