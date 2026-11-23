import { Suspense } from "react";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Proteksi sesi: redirect ke /login jika tidak ada user
  await requireUser();

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)]">
      <Suspense fallback={<div>Loading Shell...</div>}>
        {children}
      </Suspense>
    </div>
  );
}
