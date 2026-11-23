# Product Requirements Document (PRD) — TaskFlow Workspace

## 1. Ringkasan Produk
**TaskFlow Workspace** adalah aplikasi manajemen tugas full-stack (*ClickUp / Linear-inspired Task Engine*) yang dibangun di atas **Next.js App Router, TypeScript, Tailwind CSS v4, dan Prisma ORM (MySQL)**. Aplikasi ini melampaui daftar tugas sederhana dengan menghadirkan hierarki ruang kerja (`List → Task → Subtask + Tag`), tiga sudut pandang data (*List, Kanban Board, Calendar*), *drag-and-drop* presisi berbasis *float gap positioning*, *Smart Quick-Add* berbahasa alami, serta pengalaman *keyboard-first* dengan **Optimistic UI**.

### Tujuan Utama
1. Menyediakan alur produk penuh dalam satu repositori: **Landing Page (`/`) → Autentikasi (`/login`, `/register`) → Workspace Full-Stack (`/app`)**.
2. Memisahkan secara tegas **Server Components** (fetching data awal & proteksi sesi) dan **Client Components** (interaksi *drag-and-drop*, *optimistic updates*, *command palette*, dan *drawer*).
3. Menjamin integritas data relasional di MySQL dengan validasi skema **Zod** dan otorisasi kepemilikan di setiap *Server Action*.

---

## 2. Tech Stack & Batasan Arsitektur
- **Framework:** Next.js (App Router, **tanpa folder `src/`** — seluruh kode berada di `app/`, `components/`, `lib/`, `prisma/`).
- **Bahasa & Styling:** TypeScript (strict), Tailwind CSS v4 (`@import "tailwindcss";`), `clsx`, `tailwind-merge`, `lucide-react`.
- **Database & ORM:** MySQL (XAMPP lokal di `127.0.0.1:3306/taskflow_db`) dengan **Prisma v6 (`@prisma/client@6`)**.
- **Autentikasi:** Custom JWT Session menggunakan `jose` (cookie `HTTP-only`, `SameSite=Lax`, `Secure` di production) dan hashing password dengan `bcryptjs`.
- **Validasi:** `zod` di sisi server (wajib) dan klien.
- **Interaksi & Utilitas:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `date-fns`.

---

## 3. Arsitektur Rute & Alur Pengguna (User Journey)

| Rute | Akses | Fungsi Utama |
| :--- | :--- | :--- |
| `/` | Publik | Landing page produk: hero interaktif, pratinjau fitur Multi-View, tombol CTA menuju `/register` atau `/login` (jika sudah login, tampilkan tombol langsung ke `/app`). |
| `/login` | Publik (redirect ke `/app` jika sudah login) | Halaman masuk dengan email & password, validasi pesan error yang jelas, dan tautan ke `/register`. |
| `/register` | Publik (redirect ke `/app` jika sudah login) | Halaman pendaftaran akun baru; otomatis membuat data awal (*onboarding seed*: 3 List contoh + beberapa tugas & tag) agar workspace langsung terasa hidup saat pertama masuk. |
| `/app` | Privat (wajib login) | Halaman utama Workspace. Mendukung query parameter tampilan dan filter (misal `?view=list|board|calendar&scope=inbox|today|upcoming|list:<id>`). |

---

## 4. Spesifikasi Fungsional Rinci

### 4.1 Autentikasi & Onboarding Otomatis
- **Registrasi:** Validasi `name` (min. 2 karakter), `email` (format valid & unik), dan `password` (min. 8 karakter). Hash password dengan `bcryptjs` (salt rounds `10`).
- **Auto-Seed Pengguna Baru:** Saat akun berhasil dibuat dalam 1 transaksi Prisma (`prisma.$transaction`), sistem otomatis membuat:
  - 3 `TaskList` default: **Inbox** (biru), **Kuliah / Kerja** (ungu), dan **Pribadi** (hijau).
  - 3 `Tag` default: `penting`, `cepat`, `riset`.
  - 4 `Task` contoh (tersebar di status `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) lengkap dengan minimal 2 `Subtask` agar tampilan List, Kanban, dan Kalender langsung terisi.
- **Sesi & Logout:** Token JWT bertanda tangan `AUTH_SECRET` disimpan di cookie `taskflow_session` (`httpOnly: true`, masa berlaku 7 hari). Tombol **Keluar** menghapus cookie dan mengarahkan ke `/login`.
- **Proteksi Sesi:** Fungsi helper server `requireUser()` wajib dipanggil pada layout `/app` dan di awal setiap *Server Action* privat.

### 4.2 Sidebar Navigasi & Manajemen List
- **Smart Views (Filter Bawaan):**
  - **Semua Tugas (`all`):** Seluruh tugas aktif milik pengguna lintas list.
  - **Hari Ini (`today`):** Tugas dengan `dueDate` hari ini + tugas terlambat (*overdue*) yang belum `DONE`.
  - **Mendatang (`upcoming`):** Tugas dengan `dueDate` dalam 7 hari ke depan.
  - **Selesai (`completed`):** Arsip tugas berstatus `DONE`.
- **Custom Lists (`TaskList`):**
  - Menampilkan daftar list pengguna di sidebar lengkap dengan titik warna, ikon, dan penghitung jumlah tugas aktif (*badge count*).
  - **CRUD List:** Pengguna dapat membuat list baru (nama, pilihan warna preset, pilihan ikon `lucide-react`), mengubah nama/warna, dan menghapus list (dengan konfirmasi karena menghapus list akan menghapus tugas di dalamnya secara *cascade*).
  - Pengguna tidak diizinkan menghapus list terakhir jika hanya tersisa 1 list agar setiap tugas selalu punya induk `listId`.

### 4.3 Smart Quick-Add (Natural Language Parser)
Komponen input cepat di bagian atas workspace (juga dapat dipicu lewat pintasan keyboard `N` atau `Q`) yang mendukung penulisan satu baris bergaya Todoist/ClickUp:
- **Token yang Dideteksi Otomatis (`lib/quickAddParser.ts`):**
  - **Tanggal:** `hari ini` / `today`, `besok` / `tomorrow`, `lusa`, nama hari (`senin`–`minggu`), atau format `dd/mm`.
  - **Prioritas:** `!urgent` / `!mendesak` (`URGENT`), `!high` / `!tinggi` (`HIGH`), `!medium` / `!sedang` (`MEDIUM`), `!low` / `!rendah` (`LOW`).
  - **Tag:** `#nama-tag` (jika tag sudah ada langsung ditautkan; jika belum ada otomatis dibuatkan dengan warna default).
- **Live Preview Chips:** Saat pengguna mengetik `"Kirim laporan besok !tinggi #kuliah"`, di bawah input langsung muncul pratinjau pil token (*Judul bersih:* `"Kirim laporan"`, *Due:* Besok, *Prioritas:* High, *Tag:* `#kuliah`) sebelum menekan `Enter`.
- **Target List:** Secara default masuk ke list yang sedang dibuka (atau list pertama/Inbox jika sedang di Smart View).

### 4.4 Multi-View Task Engine (1 Sumber Data, 3 Tampilan)
Pengguna dapat berpindah tampilan secara instan lewat *View Switcher* di header workspace tanpa kehilangan filter aktif:

1. **List View (ClickUp-style Grouped List):**
   - Tugas dikelompokkan per status (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) dalam grup yang bisa dilipat/dibuka (*collapsible*).
   - Tiap baris menampilkan: tombol ceklis status cepat, judul tugas, indikator jumlah subtask (`2/4`), chip tag, badge prioritas berkode warna, tenggat waktu (merah jika *overdue*), dan tombol aksi cepat.
   - Mendukung **Inline Quick Add** di bawah masing-masing grup status dan **Drag-and-Drop** pengurutan baris.
2. **Board View (Kanban 4 Kolom):**
   - 4 kolom berdasarkan enum `TaskStatus`: **To Do**, **In Progress**, **Review**, dan **Done**.
   - Setiap kartu menampilkan prioritas, judul, progres bar mini subtask, tag (maks. 3 + `+N`), dan *due date*.
   - Mendukung **Drag-and-Drop antar kolom** (otomatis memperbarui `status` & `position`) dan **pengurutan di dalam kolom yang sama** menggunakan `@dnd-kit`, dilengkapi `DragOverlay` yang halus serta dukungan *pointer* & *touch*.
3. **Calendar View (Kalender Bulanan):**
   - Grid kalender bulanan berbasis `date-fns` dengan navigasi Bulan Sebelumnya / Hari Ini / Bulan Berikutnya.
   - Tugas yang memiliki `dueDate` dirender sebagai pil berkode warna prioritas pada tanggal yang sesuai; klik pil langsung membuka **Task Detail Drawer**.
   - Klik tombol `+` pada kotak tanggal langsung membuka input tambah tugas dengan `dueDate` terisi otomatis ke tanggal tersebut.
   - Panel kecil **"Tanpa Tenggat"** di sisi/bawah kalender untuk menampilkan tugas yang belum memiliki `dueDate`.

### 4.5 Task Detail Drawer (Panel Samping & Sheet Mobile)
Muncul saat pengguna mengklik tugas mana pun dari List, Board, Calendar, atau Command Palette:
- **Edit Judul & Deskripsi:** Edit langsung (*auto-save* saat `onBlur` atau tombol simpan dengan indikator status *"Tersimpan"*).
- **Properti Terstruktur:** Pemilih `Status`, `Prioritas`, `List` (memindahkan tugas antar list), dan `Due Date` (dengan shortcut cepat: *Hari Ini*, *Besok*, *Minggu Depan*, *Hapus Tanggal*).
- **Manajemen Subtask (`Subtask`):**
  - Progress bar persentase penyelesaian (`completed / total`).
  - Tambah subtask baru (`Enter`), centang/batal centang, edit judul, dan hapus subtask.
- **Manajemen Tag (`Tag`):** Pasang/lepas tag yang ada atau buat tag baru dengan warna pilihan langsung dari drawer.
- **Metadata & Hapus:** Menampilkan waktu dibuat/diperbarui dan tombol hapus tugas (terintegrasi dengan mekanisme *Undo Toast*).

### 4.6 Drag-and-Drop & Algoritma Posisi (`Float Gap`)
- Setiap `Task` dan `TaskList` memiliki kolom `position: Float` dengan jarak default `1024`.
- **Pemindahan $O(1)$ (`lib/position.ts`):**
  - Pindah ke urutan paling atas: `firstPosition / 2`.
  - Pindah ke urutan paling bawah: `lastPosition + 1024`.
  - Pindah di antara dua item (`prev`, `next`): `(prev + next) / 2`.
- **Auto-Rebalance:** Jika selisih `Math.abs(next - prev) < 0.001`, server otomatis menormalkan ulang `position` item pada grup/status tersebut (`1024, 2048, 3072, ...`) di dalam transaksi Prisma.

### 4.7 Filter, Pencarian, Sorting & Command Palette (`Ctrl+K`)
- **Toolbar Filter & Sort:** Filter simultan berdasarkan `Priority`, `Tag`, dan pencarian teks judul/deskripsi; pengurutan berdasarkan `Manual (Drag Order)`, `Tenggat Terdekat`, `Prioritas Tertinggi`, atau `Terbaru`.
- **Command Palette (`Ctrl+K` / `Cmd+K`):**
  - Pencarian cepat lintas tugas dan list.
  - Aksi cepat dari keyboard: buat tugas baru, pindah tampilan (*List / Board / Calendar*), ganti tema (*Dark / Light*), dan lompat ke Smart View.
- **Pintasan Keyboard Global** (nonaktif otomatis saat fokus berada di `<input>`/`<textarea>`):
  - `Ctrl+K` / `Cmd+K`: Buka Command Palette.
  - `N`: Fokus ke Smart Quick-Add.
  - `1`, `2`, `3`: Ganti tampilan (*List*, *Board*, *Calendar*).
  - `Escape`: Tutup Modal / Command Palette / Detail Drawer.

### 4.8 Optimistic UI & Error Recovery
- Aksi berfrekuensi tinggi (centang selesai, pindah kartu Kanban, ubah prioritas/status, centang subtask, hapus tugas) wajib memperbarui UI secara **instan (Optimistic)** sebelum respons server selesai.
- Jika *Server Action* mengembalikan error validasi/jaringan, state UI wajib melakukan **rollback otomatis** ke snapshot sebelumnya disertai notifikasi toast error.
- Saat tugas diselesaikan (`status === 'DONE'`), sistem otomatis mengisi `completedAt = new Date()`; saat dikembalikan ke status aktif, `completedAt` diset `null`.

---

## 5. Model Data & Kontrak Server Actions

### 5.1 Entitas Database (Sinkron dengan `prisma/schema.prisma`)
- **`User`**: `id`, `name`, `email` (unique), `passwordHash`, relasi ke `TaskList[]`, `Task[]`, `Tag[]`.
- **`TaskList`**: `id`, `name`, `color`, `icon`, `position`, `userId`, relasi `Task[]`.
- **`Task`**: `id`, `title`, `description` (`Text`), `status` (`TODO | IN_PROGRESS | REVIEW | DONE`), `priority` (`URGENT | HIGH | MEDIUM | LOW`), `position` (`Float`), `dueDate`, `completedAt`, `listId`, `userId`, relasi `Subtask[]` & `Tag[]`.
- **`Subtask`**: `id`, `title`, `isCompleted`, `position`, `taskId`.
- **`Tag`**: `id`, `name`, `color`, `userId` (`@@unique([userId, name])`), relasi `Task[]`.

### 5.2 Daftar Server Actions (`lib/actions/`)
Seluruh aksi mengembalikan bentuk respons konsisten `{ ok: true, data } | { ok: false, error: string }`:
- **`auth.ts`:** `registerAction`, `loginAction`, `logoutAction`.
- **`lists.ts`:** `createListAction`, `updateListAction`, `deleteListAction`, `reorderListAction`.
- **`tasks.ts`:** `createTaskAction`, `updateTaskAction`, `deleteTaskAction`, `moveTaskAction` (update `status`, `listId`, `position` + auto-rebalance), `toggleTaskCompleteAction`.
- **`subtasks.ts`:** `createSubtaskAction`, `toggleSubtaskAction`, `updateSubtaskAction`, `deleteSubtaskAction`.
- **`tags.ts`:** `createTagAction`, `toggleTaskTagAction`, `deleteTagAction`.

---

## 6. Keamanan & Validasi
1. **Validasi Input Ketat:** Semua parameter Server Action wajib divalidasi dengan skema `zod` sebelum menyentuh Prisma.
2. **Isolasi Kepemilikan (IDOR Prevention):** Setiap query dan mutasi wajib memfilter berdasarkan `userId: session.userId` (termasuk memverifikasi bahwa `listId` dan `taskId` milik pengguna aktif sebelum mengubah subtask atau memindahkan tugas).
3. **Keamanan Cookie & Password:** Password tidak pernah dikirim balik ke client (`select` eksplisit tanpa `passwordHash`). Cookie sesi menggunakan `httpOnly: true`, `sameSite: "lax"`, dan `path: "/"`.

---

## 7. Kebutuhan Non-Fungsional
- **Dual Theme (Dark & Light Mode):** Mendukung tema gelap dan terang secara persisten (`localStorage` + anti-flash script) dengan kontras WCAG minimal `4.5:1`.
- **Zero Hydration Mismatch:** Pemformatan tanggal relatif/lokal dan state tema wajib aman terhadap SSR Next.js App Router.
- **Responsivitas Penuh:**
  - **Desktop (`>= 1024px`):** Sidebar kiri tetap (`240px–260px`), area kerja utama fleksibel, Task Detail Drawer melayang/tersemat di kanan (`420px`).
  - **Mobile (`< 768px`):** Sidebar menjadi *slide-over drawer*, Board Kanban dapat digeser horizontal dengan *snap*, Task Detail Drawer tampil sebagai *sheet* penuh/bawah yang nyaman dioperasikan dengan satu tangan (*touch target* `>= 44×44px`).
- **Aksesibilitas:** Navigasi keyboard lengkap, `aria-label` pada seluruh tombol ikon, `focus-visible` yang tegas, dan dukungan `prefers-reduced-motion`.

---

## 8. Peta Jalan Eksekusi Bertahap
1. **Fase 1 — Fondasi, Auth & Landing Page:** Setup singleton Prisma (`lib/prisma.ts`), utilitas sesi JWT + bcrypt (`lib/auth.ts`), Dual Theme CSS tokens, halaman `/` (Landing Page), `/login`, `/register` (dengan auto-seed), dan kerangka rute `/app` yang terproteksi.
2. **Fase 2 — Core Workspace, Sidebar Lists & List View:** Implementasi seluruh Server Actions CRUD (`lists`, `tasks`, `subtasks`, `tags`), Sidebar dengan Smart Views & Custom Lists, Smart Quick-Add Parser, Grouped List View, dan Task Detail Drawer lengkap.
3. **Fase 3 — Kanban Board (DnD), Calendar View & Command Palette:** Implementasi Board View dengan `@dnd-kit` + *float gap positioning* + Optimistic UI, Calendar View bulanan, Filter/Sort toolbar, dan Command Palette (`Ctrl+K`) + pintasan keyboard.
4. **Fase 4 — Audit Performa, Keamanan & Polish Mobile:** Audit keamanan IDOR/Zod, pengujian responsivitas Desktop/Mobile di Firefox, *hydration check*, `npx tsc --noEmit`, `npm run lint`, dan `npm run build` 0 error.