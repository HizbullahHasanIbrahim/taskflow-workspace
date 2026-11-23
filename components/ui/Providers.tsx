"use client";

import React from "react";
import { MotionConfig } from "motion/react";
import { ToastProvider } from "./ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
