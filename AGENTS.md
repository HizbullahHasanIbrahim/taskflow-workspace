# Project Instructions — TaskFlow Workspace

- **`motion` (`motion/react`):** Mesin animasi utama untuk `/` dan `/app` (transisi *spring*, `layoutId` pada segmented switcher/navigasi, `AnimatePresence` untuk drawer/modal/toast). Bungkus root aplikasi dengan `<MotionConfig reducedMotion="user">`.
- **Aturan Anti-Konflik DnD:** Di fase Kanban nanti, DILARANG memasang prop `layout` dari `motion` pada elemen DOM yang sama dengan `useSortable` dari `@dnd-kit`.
- **`lenis`:** Hanya boleh dipasang pada **Landing Page (`/`)** melalui komponen khusus `components/landing/SmoothScroll.tsx`. **Dilarang keras** memasang Lenis di `/app`, `/login`, atau `/register`. Wajib membersihkan instance (`cancelAnimationFrame` + `lenis.destroy()`) pada cleanup `useEffect` dan menonaktifkan Lenis otomatis jika `prefers-reduced-motion: reduce` aktif.

## 1. Sumber Kebenaran (Wajib Dibaca Sebelum Coding)
- Selalu baca `PRD.md`, `SYSTEM_DESIGN.md`, dan `prisma/schema.prisma` sebelum membuat atau mengubah file apa pun.
- **Struktur Folder Wajib (TANPA `src/`):** Proyek ini menggunakan Next.js App Router langsung di root (`app/`, `components/`, `lib/`, `prisma/`). Dilarang membuat folder `src/` atau memindahkan file ke dalamnya.
- **Kunci Versi Prisma (Prisma v6):** Proyek ini menggunakan **Prisma v6 (`6.19.3`)** dengan MySQL (`127.0.0.1:3306/taskflow_db`).
  - **DILARANG** menjalankan perintah CLI Prisma v8 (`prisma orm init`, `prisma contract emit`, `prisma db update`) dan **DILARANG** menaikkan versi `prisma` / `@prisma/client` ke v8 RC.
  - Gunakan perintah Prisma v6 standar (`npx prisma generate`, `npx prisma db push`).

## 2. Arsitektur Next.js App Router, Database & Keamanan
- **Singleton Prisma:** Semua akses database wajib mengimpor instance dari `lib/prisma.ts` (menggunakan `globalThis` agar tidak terjadi kebocoran koneksi saat HMR development).
- **Pemisahan Server vs Client Component:**
  - Gunakan **Server Components** untuk proteksi sesi (`requireUser()`), pengambilan data awal Prisma di `/app`, dan metadata.
  - Wajib melakukan serialisasi seluruh field `Date` (`dueDate`, `completedAt`, `createdAt`, `updatedAt`) menjadi string ISO (`toISOString()`) sebelum dikirim dari Server Component ke Client Component agar 0 warning Next.js.
  - Gunakan `'use client'` hanya pada komponen interaktif (`WorkspaceShell`, `@dnd-kit`, Drawer, Command Palette, ThemeToggle, Toast).
- **Aturan Ketat Server Actions (`lib/actions/*.ts`):**
  1. Setiap fungsi wajib diawali validasi skema **Zod** (`lib/validations.ts`).
  2. Setiap aksi privat wajib memanggil `requireUser()` dari `lib/auth.ts` di baris awal.
  3. **Anti-IDOR (Wajib Cek Kepemilikan):** Setiap query, update, dan delete wajib menyertakan filter `userId: session.userId` (termasuk memverifikasi bahwa `listId` dan `taskId` milik pengguna aktif sebelum mengubah `Subtask` atau memindahkan `Task`).
  4. **Kontrak Respons Konsisten:** Seluruh Server Action wajib mengembalikan `{ ok: true, data }` atau `{ ok: false, error: string }`.
  5. **Privasi Data:** Jangan pernah menyertakan `passwordHash` pada respons client (gunakan `select` eksplisit).
- **Integritas Transaksi & Posisi:**
  - Auto-seed akun baru saat registrasi (3 List, 3 Tag, 4 Task, minimal 2 Subtask) wajib dibungkus dalam `prisma.$transaction`.
  - Pengurutan Drag-and-Drop menggunakan algoritma *Float Gap* (`1024`) di `lib/position.ts`. Jika selisih antar item `< 0.001`, lakukan *auto-rebalance* di dalam `prisma.$transaction`.

## 3. Aturan UI/UX, Apple Fluid Glass & Zero Hydration Error
- **Dual Theme (`data-theme="light" | "dark"`):**
  - Kendalikan tema melalui atribut `[data-theme]` pada `<html>` dengan token CSS di `app/globals.css` (Tailwind CSS v4 `@import "tailwindcss";`) serta sinkronisasi `color-scheme`.
  - **Penting:** Jangan bergantung pada prefix `dark:` bawaan Tailwind untuk warna semantik prioritas/status. Gunakan CSS custom properties (`--prio-*-bg`, `--prio-*-text`, `--prio-*-border`, `--status-*`) agar kontras Light Mode tetap >= 4.5:1 (terutama prioritas Medium/Amber).
- **Apple Fluid Glass:**
  - Terapkan `.fluid-glass` / `.fluid-glass-elevated` (lengkap dengan `-webkit-backdrop-filter` dan *specular top highlight* `inset 0 1px 0 var(--glass-specular)`) pada Sidebar, Header, Detail Drawer, Command Palette, Modal, dan Toast.
  - Dukung `@media (prefers-reduced-transparency: reduce)` dan `@media (prefers-reduced-motion: reduce)`.
- **Zero-Emoji & Tipografi:**
  - Dilarang memakai emoji sebagai ikon antarmuka; wajib gunakan `lucide-react` (`strokeWidth={1.75}`).
  - Seluruh angka counter, tanggal, progres subtask (`2/4`), dan keycap shortcut wajib memakai `font-mono tabular-nums`.
- **Zero Hydration Mismatch:**
  - Dilarang membaca `localStorage`, `window.innerWidth`, atau menghitung selisih `Date.now()` langsung saat render SSR pertama tanpa *mount guard* / state klien yang stabil.
  - Gunakan script inisialisasi tema ringan di `<head>` (`app/layout.tsx`) untuk mencegah kedipan (*flash*) tema.
- **Optimistic UI & Rollback:**
  - Aksi cepat (centang tugas, pindah kartu Kanban, ubah status/prioritas, centang subtask, hapus tugas) wajib memperbarui UI secara instan, menyimpan snapshot state sebelumnya, dan melakukan *rollback* otomatis disertai Toast error bila Server Action gagal.
- **Responsivitas & Aksesibilitas:**
  - Seluruh tombol interaktif di mobile wajib memiliki *touch target* minimal `44x44px` (`min-h-[44px] min-w-[44px]`) dan menghormati `env(safe-area-inset-*)`.
  - Gunakan `overscroll-behavior: contain` pada panel scrollable (Sidebar, Main Canvas, Detail Drawer).
  - Wajib sertakan atribut ARIA (`aria-label`, `aria-pressed`, `aria-expanded`, `role="dialog"`, `role="combobox"`, `role="listbox"`, `role="option"`) serta `focus-visible` yang jelas.

## 4. Standar Kualitas Kode & Anti-Shortcut
- **Anti-Placeholder & Anti-Mock:** Dilarang meninggalkan komentar `// TODO`, tombol tidak berfungsi, timestamp hardcoded, atau data statis palsu pada komponen yang seharusnya terhubung ke database.
- **Komentar Kode Berbahasa Indonesia:** Sertakan komentar singkat berbahasa Indonesia pada bagian logika kompleks: utilitas sesi JWT (`lib/auth.ts`), parser NLP Quick-Add (`lib/quickAddParser.ts`), algoritma *float gap* & rebalance (`lib/position.ts`), handler `@dnd-kit`, serta pola *Optimistic UI rollback*.

## 5. Peta Jalan Eksekusi Bertahap
1. **Fase 1 — Fondasi, Auth & Landing Page:** `lib/prisma.ts`, `lib/auth.ts`, `lib/validations.ts`, `lib/types.ts`, `lib/utils.ts`, `lib/actions/auth.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, serta proteksi dasar `app/app/layout.tsx` & `app/app/page.tsx`.
2. **Fase 2 — Core Workspace, Lists, Quick-Add & List View:** `lib/position.ts`, `lib/quickAddParser.ts`, seluruh Server Actions (`lists`, `tasks`, `subtasks`, `tags`), `WorkspaceShell`, `Sidebar`, `WorkspaceHeader`, `SmartQuickAdd`, `ListView`, `TaskDetailDrawer`, dan `ToastProvider`.
3. **Fase 3 — Kanban Board (DnD), Calendar View & Command Palette:** `BoardView` (`@dnd-kit` + `DragOverlay` + Optimistic move), `CalendarView` + tray tanpa tenggat, toolbar Filter/Sort, `CommandPalette` (`Ctrl+K`), dan pintasan keyboard global.
4. **Fase 4 — Audit Keamanan, Performa & Polish Mobile:** Audit anti-IDOR/Zod, pengujian responsivitas Desktop & Mobile (portrait/landscape), verifikasi *hydration* & kontras Dual Theme.

## 6. Verifikasi Wajib Sebelum Melaporkan Selesai
Setiap selesai satu fase, WAJIB jalankan seluruh pemeriksaan berikut dan pastikan bersih sebelum melapor:
1. `npx tsc --noEmit` — wajib **0 error TypeScript**.
2. `npm run lint` — wajib **0 error dan 0 warning ESLint**.
3. `npm run build` — wajib sukses tanpa error SSR/prerender.
4. Pastikan tidak ada file di dalam folder `src/` dan tidak ada pemanggilan perintah Prisma v8.