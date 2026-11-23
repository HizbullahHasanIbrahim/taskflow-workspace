# System & UI Design Specification — TaskFlow Workspace

## 1. Filosofi Desain: Apple Fluid Productivity

**TaskFlow Workspace** memadukan kejernihan ruang kerja produktivitas ala **Things 3 & macOS Sequoia** dengan kedalaman material kaca dinamis (**Apple Fluid Glass**).

### Prinsip Utama
1. **Translusensi yang Disiplin (*Hierarchy of Glass*):**
   - Efek *frosted glass* (`backdrop-filter: blur() saturate()`) + *specular top highlight* (`inset 0 1px 0`) diterapkan pada lapisan **navigasi, chrome, dan overlay** (Sidebar, Sticky Header, Task Detail Drawer, Command Palette, Popover, Toast, DragOverlay).
   - Permukaan baca padat (baris tugas di List View, kartu Kanban, sel Kalender) menggunakan permukaan **semi-solid kontras tinggi** agar nyaman dibaca dan diedit berjam-jam tanpa kelelahan mata.
2. **Fluid & Tactile Motion:**
   - Setiap perubahan tampilan (pindah *View Switcher*, membuka *Drawer*, mencentang tugas, menyeret kartu Kanban) bergerak memakai kurva *spring* dan *fluid deceleration* sehingga tidak terasa kaku atau patah.
   - Seluruh animasi hanya menggerakkan properti *compositor-friendly* (`transform`, `opacity`) agar tetap terkunci di 60 FPS.
3. **Dual Theme Sejati (*Light Mode Porcelain* & *Dark Mode Obsidian*):**
   - Kedua tema dirancang setara dengan rasio kontras WCAG AA (`>= 4.5:1`), termasuk untuk seluruh badge status dan prioritas (terutama warna kuning/amber pada Light Mode).
4. **Zero-Emoji Iconography:**
   - Dilarang memakai emoji untuk ikon antarmuka. Seluruh ikon wajib menggunakan `lucide-react` dengan `strokeWidth={1.75}` agar konsisten tajam di layar standar maupun Retina/HiDPI.

---

## 2. Sistem Design Tokens (Tailwind CSS v4 Ready)

Seluruh token ditempatkan di `app/globals.css` dengan sintaks Tailwind CSS v4 (`@import "tailwindcss";`). Tema dikendalikan melalui atribut `data-theme="light" | "dark"` pada elemen `<html>` disertai sinkronisasi `color-scheme` agar scrollbar dan input bawaan browser selalu serasi.

```css
@import "tailwindcss";

:root,
[data-theme="light"] {
  color-scheme: light;

  /* Canvas & Ambient Surfaces */
  --bg-canvas: #f3f5f9;
  --bg-ambient-1: rgba(0, 122, 255, 0.08);
  --bg-ambient-2: rgba(94, 92, 230, 0.07);

  /* Surface & Fluid Glass Layers */
  --surface-solid: #ffffff;
  --surface-subtle: #f8fafc;
  --glass-sidebar: rgba(248, 250, 252, 0.72);
  --glass-header: rgba(255, 255, 255, 0.76);
  --glass-elevated: rgba(255, 255, 255, 0.86);
  --glass-hover: rgba(15, 23, 42, 0.05);
  --glass-active-pill: rgba(255, 255, 255, 0.96);

  /* Borders & Specular Highlights */
  --border-hairline: rgba(15, 23, 42, 0.08);
  --border-strong: rgba(15, 23, 42, 0.14);
  --glass-specular: rgba(255, 255, 255, 0.92);

  /* Typography */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;

  /* Brand Accent (Apple System Blue) */
  --accent-primary: #007aff;
  --accent-hover: #0066d6;
  --accent-soft: rgba(0, 122, 255, 0.12);
  --accent-border: rgba(0, 122, 255, 0.28);

  /* Semantic Priority Tokens (Kontras WCAG >= 4.5:1 di Light Mode) */
  --prio-urgent-bg: rgba(239, 68, 68, 0.12);
  --prio-urgent-text: #b91c1c;
  --prio-urgent-border: rgba(220, 38, 38, 0.26);

  --prio-high-bg: rgba(249, 115, 22, 0.13);
  --prio-high-text: #c2410c;
  --prio-high-border: rgba(234, 88, 12, 0.28);

  --prio-medium-bg: rgba(217, 119, 6, 0.14);
  --prio-medium-text: #92400e;
  --prio-medium-border: rgba(180, 83, 9, 0.30);

  --prio-low-bg: rgba(100, 116, 139, 0.12);
  --prio-low-text: #334155;
  --prio-low-border: rgba(100, 116, 139, 0.24);

  /* Semantic Status Dots & Badges */
  --status-todo: #64748b;
  --status-progress: #007aff;
  --status-review: #7c3aed;
  --status-done: #15803d;

  /* Shadows */
  --shadow-card: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03);
  --shadow-glass: 0 16px 40px rgba(15, 23, 42, 0.09), 0 2px 8px rgba(15, 23, 42, 0.04);
  --shadow-drag: 0 24px 54px rgba(15, 23, 42, 0.18), 0 6px 16px rgba(15, 23, 42, 0.08);

  /* Motion Curves */
  --ease-fluid: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.45, 0.64, 1);
  --ease-tactile: cubic-bezier(0.2, 0, 0, 1);
}

[data-theme="dark"] {
  color-scheme: dark;

  /* Canvas & Ambient Surfaces */
  --bg-canvas: #090d16;
  --bg-ambient-1: rgba(10, 132, 255, 0.12);
  --bg-ambient-2: rgba(94, 92, 230, 0.10);

  /* Surface & Fluid Glass Layers */
  --surface-solid: #111827;
  --surface-subtle: rgba(255, 255, 255, 0.035);
  --glass-sidebar: rgba(14, 19, 31, 0.72);
  --glass-header: rgba(14, 19, 31, 0.74);
  --glass-elevated: rgba(20, 27, 45, 0.84);
  --glass-hover: rgba(255, 255, 255, 0.07);
  --glass-active-pill: rgba(255, 255, 255, 0.14);

  /* Borders & Specular Highlights */
  --border-hairline: rgba(255, 255, 255, 0.09);
  --border-strong: rgba(255, 255, 255, 0.16);
  --glass-specular: rgba(255, 255, 255, 0.22);

  /* Typography */
  --text-primary: #f5f7fa;
  --text-secondary: #9aa7bc;
  --text-tertiary: #64748b;

  /* Brand Accent (Apple System Blue Dark) */
  --accent-primary: #0a84ff;
  --accent-hover: #3399ff;
  --accent-soft: rgba(10, 132, 255, 0.18);
  --accent-border: rgba(10, 132, 255, 0.36);

  /* Semantic Priority Tokens (Dark Mode) */
  --prio-urgent-bg: rgba(239, 68, 68, 0.18);
  --prio-urgent-text: #fca5a5;
  --prio-urgent-border: rgba(248, 113, 113, 0.34);

  --prio-high-bg: rgba(249, 115, 22, 0.18);
  --prio-high-text: #fdba74;
  --prio-high-border: rgba(251, 146, 60, 0.34);

  --prio-medium-bg: rgba(245, 158, 11, 0.18);
  --prio-medium-text: #fcd34d;
  --prio-medium-border: rgba(251, 191, 36, 0.34);

  --prio-low-bg: rgba(148, 163, 184, 0.14);
  --prio-low-text: #cbd5e1;
  --prio-low-border: rgba(148, 163, 184, 0.26);

  /* Semantic Status Dots & Badges */
  --status-todo: #94a3b8;
  --status-progress: #38bdf8;
  --status-review: #c084fc;
  --status-done: #4ade80;

  /* Shadows */
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.28), 0 6px 16px rgba(0, 0, 0, 0.22);
  --shadow-glass: 0 22px 54px rgba(0, 0, 0, 0.48), 0 4px 12px rgba(0, 0, 0, 0.28);
  --shadow-drag: 0 28px 64px rgba(0, 0, 0, 0.62), 0 8px 20px rgba(0, 0, 0, 0.36);
}
```

### Utility Glass & Baseline Fallbacks (`app/globals.css`)
- **`.fluid-glass`:** `backdrop-filter: blur(22px) saturate(180%); -webkit-backdrop-filter: blur(22px) saturate(180%); border: 1px solid var(--border-hairline); box-shadow: inset 0 1px 0 0 var(--glass-specular), var(--shadow-glass);`
- **`.fluid-glass-elevated`:** `background: var(--glass-elevated); backdrop-filter: blur(28px) saturate(200%); -webkit-backdrop-filter: blur(28px) saturate(200%); border: 1px solid var(--border-strong); box-shadow: inset 0 1px 0 0 var(--glass-specular), var(--shadow-glass);`
- **Fallback Aksesibilitas (`@media (prefers-reduced-transparency: reduce)`):** Nonaktifkan `backdrop-filter` dan naikkan latar belakang seluruh `.fluid-glass*` menjadi `var(--surface-solid)` solid.
- **Fallback Gerakan (`@media (prefers-reduced-motion: reduce)`):** Turunkan durasi seluruh transisi dan animasi ke `0.01ms`.

### Preset Warna `TaskList` (8 Warna Harmonis Apple)
`#007aff` (Blue), `#5856d6` (Indigo), `#af52de` (Purple), `#ff2d55` (Pink), `#ff3b30` (Red), `#ff9500` (Orange), `#34c759` (Green), `#0ea5e9` (Cyan).

---

## 3. Tipografi & Skala Teks

Muat 3 font Google di `app/layout.tsx` melalui `next/font/google`:
- `--font-sans`: **Plus Jakarta Sans** (`400, 500, 600, 700`) — UI utama, judul tugas, deskripsi, navigasi.
- `--font-display`: **Space Grotesk** (`500, 600, 700`) — Headline Landing Page, judul autentikasi, judul halaman workspace.
- `--font-mono`: **JetBrains Mono** (`400, 500`) — wajib dipadukan dengan `tabular-nums` untuk counter badge, progres subtask (`2/4`), tanggal jatuh tempo, dan keycap shortcut (`Ctrl+K`, `N`, `1`).

| Peran | Font | Ukuran & Weight | Tracking / Leading |
| :--- | :--- | :--- | :--- |
| Landing Hero H1 | `--font-display` | `clamp(2.25rem, 5vw, 4rem)` / `700` | `-0.035em` / `1.06` |
| Workspace View Title | `--font-display` | `1.375rem` (`22px`) / `600` | `-0.025em` / `1.2` |
| Status Group / Column Header | `--font-sans` | `0.8125rem` (`13px`) / `600` | `0.01em` / `1.3` |
| Task Title (List & Kanban) | `--font-sans` | `0.875rem` (`14px`) / `500` | `-0.01em` / `1.4` |
| Metadata & Tanggal | `--font-mono` | `0.75rem` (`12px`) / `500` | `tabular-nums` |
| Keyboard Shortcut Keycap | `--font-mono` | `0.6875rem` (`11px`) / `500` | `px-1.5 py-0.5 rounded-md border` |

---

## 4. Koreografi Gerakan (Fluid Motion Specs)

| Interaksi | Transisi / Efek | Kurva & Durasi |
| :--- | :--- | :--- |
| **Segmented View Switcher** | Pil aktif (`List / Board / Calendar`) bergeser halus memakai `transform` + bayangan ringan | `280ms var(--ease-fluid)` |
| **Checkbox Selesai** | Lingkaran terisi warna hijau/aksen dengan *micro-bounce* (`scale(0.85 -> 1.12 -> 1)`), teks meredup ke `opacity: 0.55` + `line-through` | `260ms var(--ease-spring)` |
| **Kanban Drag-and-Drop (`DragOverlay`)** | Kartu terangkat (`scale(1.03) rotate(0.8deg)`), memakai `--shadow-drag` dan sedikit efek frosted; placeholder asal tampil sebagai siluet garis putus-putus (`border-dashed`) | `180ms var(--ease-tactile)` |
| **Task Detail Drawer** | Desktop: meluncur dari kanan (`translateX(24px) -> 0`, `opacity: 0 -> 1`). Mobile: *bottom sheet* naik dari bawah (`translateY(100%) -> 0`) | `340ms var(--ease-fluid)` |
| **Command Palette (`Ctrl+K`)** | Muncul dari `scale(0.96) translateY(-8px)` ke `scale(1) translateY(0)` di atas backdrop blur gelap lembut | `220ms var(--ease-fluid)` |
| **Tactile Button Press** | Seluruh tombol utama & chip filter menyusut halus saat ditekan (`active:scale-[0.97]`) | `120ms var(--ease-tactile)` |
| **Undo / Error Toast** | Pil kaca melayang di tengah bawah (`bottom-5`), masuk dengan `translateY(16px) -> 0` dan hilang mulus setelah 5 detik | `300ms var(--ease-spring)` |

---

## 5. Arsitektur Layout & Responsivitas

### 5.1 Rute Publik (`/`, `/login`, `/register`)
- **Landing Page (`/`):**
  - Latar belakang `--bg-canvas` dengan dua *radial ambient glow* sangat lembut (`--bg-ambient-1`, `--bg-ambient-2`) yang mengikuti Dark/Light Mode.
  - **Floating Glass Navbar** di bagian atas (`rounded-full`, `max-w-5xl`, `sticky top-4`): Logo + nama `TaskFlow`, tautan bagian (*Fitur*, *Multi-View*, *Keamanan*), tombol Toggle Tema, dan CTA (`Masuk` / `Mulai Gratis`, atau `Buka Workspace` jika sesi sudah aktif).
  - **Hero Section:** Headline tegas + subheadline ringkas + 2 tombol CTA + **Interactive Static Preview Window** bergaya jendela macOS (menampilkan simulasi tab List / Kanban / Quick-Add yang bisa diklik langsung oleh pengunjung sebelum mendaftar).
  - **Bento Feature Grid (4 Kartu Glass):** *Smart Quick-Add Parser*, *3 Tampilan dari 1 Data*, *Float-Gap Drag & Drop*, dan *Optimistic UI + MySQL*.
- **Auth Pages (`/login`, `/register`):**
  - Layout terpusat penuh (`min-h-[100dvh]`) di atas latar ambient lembut.
  - Kartu `.fluid-glass-elevated` (`max-w-[420px]`, `rounded-3xl`, `p-7 sm:p-8`) dengan header logo, input ber-`focus-visible` ring biru Apple, tombol submit dengan loading spinner, pesan error validasi *inline* di bawah tiap field, serta toggle tema di pojok kanan atas.

### 5.2 Workspace Shell (`/app`) — 3 Mode Layar

```text
+-------------------------------------------------------------------+
| [Sidebar Glass 260px] | [Sticky Header Glass 56px]                |
|  - Brand + Collapse   |  [List Title] [List|Board|Cal] [Filter|⌘K]|
|  - Smart Views (4)    |-------------------------------------------|
|  - Custom Lists (+)   | [Smart Quick-Add Floating Bar]            |
|  - Tags Summary       |                                           |
|  - User + Theme + Out | [Main Fluid Canvas — scrollable]          |
|                       |    +----------------------------------+   |
|                       |    | [Task Detail Drawer 420px]       |   |
|                       |    | (Floating inset right on desktop)|   |
|                       |    +----------------------------------+   |
+-------------------------------------------------------------------+
```

1. **Desktop (`>= 1024px`):**
   - Shell layar penuh `h-[100dvh] overflow-hidden flex` dengan scroll internal terpisah (`overscroll-behavior: contain`) di Sidebar dan Main Canvas.
   - Sidebar kiri lebar `260px` (`--glass-sidebar`, border kanan `--border-hairline`) dapat dilipat agar Kanban 4 kolom lebih lega.
   - **Task Detail Drawer** tampil sebagai panel melayang *inset* di sisi kanan (`top-3 right-3 bottom-3 w-[420px] rounded-2xl fluid-glass-elevated`) ala macOS Inspector.
2. **Tablet (`768px - 1023px`):**
   - Sidebar berubah menjadi *slide-over drawer* kiri (dibuka lewat tombol menu di header).
   - Main Canvas memanfaatkan 100% lebar layar; Detail Drawer tampil sebagai *overlay* di kanan (`w-[380px]`).
3. **Mobile (`< 768px`):**
   - Header ringkas dengan tombol menu sidebar (`min-w-[44px] min-h-[44px]`), judul list, tombol Search, dan View Switcher berikon kompak.
   - **Kanban Board Mobile:** Kolom tersusun horizontal dengan `overflow-x-auto snap-x snap-mandatory`, lebar tiap kolom `w-[84vw]` sehingga tepi kolom berikutnya mengintip sebagai petunjuk gestur geser.
   - **Task Detail Drawer Mobile:** Otomatis menjadi **Bottom Sheet** (`inset-x-0 bottom-0 max-h-[86dvh] rounded-t-3xl pb-[max(16px,env(safe-area-inset-bottom))]`) lengkap dengan *drag handle* tipis di tengah atas.
   - Seluruh tombol interaktif wajib memiliki *touch target* minimal `44x44px`.

---

## 6. Spesifikasi Komponen Utama

### 6.1 `SmartQuickAdd` (`components/workspace/SmartQuickAdd.tsx`)
- Bar input melayang bergaya kaca halus (`rounded-2xl`) tepat di atas area tampilan aktif.
- Ikon `+` di kiri, input teks `"Tambah tugas... mis. Revisi laporan besok !tinggi #kuliah"`, dan tombol `Enter` + hint shortcut `N` di kanan.
- **Live Parsed Preview Row:** Begitu `parseQuickAdd(input)` mendeteksi token tanggal, prioritas, atau `#tag`, baris chip kecil langsung muncul mulus di bawah input (warna sesuai token semantik) sehingga pengguna tahu persis apa yang akan disimpan sebelum menekan `Enter`.

### 6.2 `ListView` (`components/workspace/ListView.tsx`)
- Grup per `TaskStatus` (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`), masing-masing punya header pil status berwarna + jumlah tugas (`font-mono tabular-nums`) + chevron lipat/buka.
- Setiap baris tugas (`rounded-xl`, `bg-[var(--surface-solid)]`, border hairline, hover lift halus) memuat:
  - Grip drag kiri (muncul saat hover di desktop, selalu dapat dijangkau di mobile).
  - Checkbox bulat dengan warna border sesuai prioritas.
  - Judul tugas (`truncate` + `min-w-0 flex-1`), indikator subtask (`CheckSquare` + `2/4`), maksimal 2 chip tag (`+N`), badge prioritas (memakai `--prio-*-*`), dan pil tanggal (`text-red-500` jika *overdue* dan belum `DONE`).
- Tombol `+ Tambah tugas di grup ini` di bagian bawah tiap grup untuk *inline quick-create* langsung ke status tersebut.

### 6.3 `BoardView` (`components/workspace/BoardView.tsx`)
- Grid 4 kolom (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4` di desktop; horizontal snap-scroll di mobile).
- Tiap kolom dibungkus kontainer kaca halus (`rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)]`) dengan *highlight* border biru (`--accent-border`) saat kartu diseret melintasi kolom (*droppable over state*).
- Kartu Kanban (`rounded-xl bg-[var(--surface-solid)] p-3.5 shadow-[var(--shadow-card)]`):
  - Baris atas: Badge Prioritas + Nama List (saat berada di Smart View lintas list).
  - Tengah: Judul tugas (maks 2 baris `line-clamp-2`) + mini progress bar subtask (jika `subtasks.length > 0`).
  - Bawah: Chip Tag + pil tanggal jatuh tempo (`font-mono`).

### 6.4 `CalendarView` (`components/workspace/CalendarView.tsx`)
- Header kalender: Judul Bulan & Tahun (`Space Grotesk`), tombol `<`, `Hari Ini`, `>`.
- Grid 7 kolom (`Sen`–`Min`) responsif. Hari ini ditandai lingkaran solid `--accent-primary` pada angka tanggal (gaya Apple Calendar).
- Tiap sel menampilkan maksimal 3 pil tugas berkode warna prioritas + indikator `+X lainnya`. Hover pada sel menampilkan tombol `+` kecil untuk langsung menambah tugas dengan `dueDate` pada tanggal tersebut.
- Tray **"Tanpa Tenggat"** di sisi kanan (desktop) atau bawah (mobile) agar tugas tanpa tanggal tetap mudah dilihat dan dibuka untuk diberi tenggat.

### 6.5 `TaskDetailDrawer` (`components/workspace/TaskDetailDrawer.tsx`)
- Header: Breadcrumb List asal, indikator status simpan (`Menyimpan...` / `Tersimpan`), tombol Hapus (`Trash2`), dan Tutup (`X`).
- Isi scrollable (`overscroll-behavior: contain`):
  - Input judul besar tanpa border (*borderless seamless edit*) yang otomatis menyimpan saat `onBlur` / `Enter`.
  - Grid properti 2 kolom rapi: **Status**, **Prioritas**, **List**, dan **Tenggat Waktu** (dilengkapi tombol cepat *Hari Ini*, *Besok*, *+7 Hari*, *Hapus*).
  - **Deskripsi:** Textarea *auto-resize* dengan gaya bersih.
  - **Subtask Section:** Header dengan progress bar animasi (`transition-[width] duration-300`), daftar subtask dengan checkbox taktil & tombol hapus, plus input tambah subtask cepat.
  - **Tag Section:** Pil tag aktif + popover pemilih/pembuat tag baru.

### 6.6 `CommandPalette` (`components/workspace/CommandPalette.tsx`)
- Dipicu oleh `Ctrl+K` / `Cmd+K` atau tombol Search di header.
- Modal `.fluid-glass-elevated` (`max-w-[560px] rounded-2xl`), input pencarian di atas, hasil terkelompok dalam 3 bagian: **Aksi Cepat** (Buat tugas, Ganti View, Toggle Tema), **List**, dan **Tugas**.
- Mendukung penuh navigasi keyboard `ArrowUp`, `ArrowDown`, `Enter`, `Escape` dengan `role="dialog"`, `role="combobox"`, `role="listbox"`, dan `role="option"`.

### 6.7 Empty States, Skeletons & Toasts
- **Empty State:** Ilustrasi ikon `lucide-react` lembut di dalam lingkaran kaca, pesan kontekstual (berbeda untuk *Inbox kosong*, *Hasil filter kosong*, dan *Hari ini tuntas*), serta 1 tombol aksi langsung (*"Buat Tugas Pertama"* atau *"Reset Filter"*).
- **Loading Skeleton:** Shimmer halus pada rute `/app/loading.tsx` yang meniru proporsi Sidebar + Header + List agar 0 *Layout Shift* (CLS).
- **Undo Toast:** Saat tugas dihapus, tampilkan toast kaca di bawah dengan tombol **Urungkan** selama 5 detik; untuk kegagalan jaringan, tampilkan toast error dengan tombol tutup.

---

## 7. Arsitektur Teknis & Batasan Server vs Client

### 7.1 Struktur Folder (Tanpa `src/`)

```text
taskflow-workspace/
├── prisma/
│   └── schema.prisma              # Model User, TaskList, Task, Subtask, Tag
├── lib/
│   ├── prisma.ts                  # Singleton PrismaClient (anti-leak HMR dev)
│   ├── auth.ts                    # JWT jose (sign/verify), cookie, requireUser()
│   ├── validations.ts             # Skema Zod untuk auth, list, task, subtask, tag
│   ├── position.ts                # Algoritma float gap O(1) + threshold rebalance
│   ├── quickAddParser.ts          # Parser NLP tanggal, !prioritas, #tag (pure TS)
│   ├── types.ts                   # Serialized DTO types (ISO date strings aman RSC->Client)
│   ├── utils.ts                   # cn(), format tanggal aman hydration
│   └── actions/
│       ├── auth.ts                # registerAction (+ auto-seed), loginAction, logoutAction
│       ├── lists.ts               # CRUD & reorder TaskList
│       ├── tasks.ts               # CRUD, moveTask (+ auto-rebalance), toggleComplete
│       ├── subtasks.ts            # CRUD & toggle Subtask
│       └── tags.ts                # createTag, toggleTaskTag, deleteTag
├── components/
│   ├── ui/
│   │   ├── ThemeToggle.tsx        # Toggle Dark/Light (client)
│   │   ├── ToastProvider.tsx      # Floating glass toast queue
│   │   └── Modal.tsx              # Reusable accessible glass dialog
│   ├── landing/
│   │   ├── Navbar.tsx             # Floating glass navbar
│   │   └── InteractivePreview.tsx # Pratinjau mini List/Board interaktif
│   └── workspace/
│       ├── WorkspaceShell.tsx     # Orchestrator client state + Optimistic UI + shortcuts
│       ├── Sidebar.tsx            # Smart views, custom lists CRUD, user footer
│       ├── WorkspaceHeader.tsx    # Title, View Switcher, Filter/Sort popover, Cmd+K
│       ├── SmartQuickAdd.tsx      # NLP Quick-Add bar + live token preview
│       ├── ListView.tsx           # Grouped collapsible list + sortable rows
│       ├── BoardView.tsx          # 4-column @dnd-kit Kanban + DragOverlay
│       ├── CalendarView.tsx       # Monthly grid + unscheduled tray
│       ├── TaskDetailDrawer.tsx   # Inspector right (desktop) / bottom sheet (mobile)
│       └── CommandPalette.tsx     # Ctrl+K search & quick actions
└── app/
    ├── layout.tsx                 # Fonts, viewport, anti-flash theme script
    ├── globals.css                # Tailwind v4 + Dual Theme tokens + fluid-glass classes
    ├── page.tsx                   # Landing Page (Server Component)
    ├── (auth)/
    │   ├── login/page.tsx         # Halaman Login
    │   └── register/page.tsx      # Halaman Register
    └── app/
        ├── layout.tsx             # Proteksi sesi requireUser() (Server Component)
        ├── loading.tsx            # Fluid Glass Skeleton
        └── page.tsx               # Fetch initial lists/tasks/tags (RSC) -> WorkspaceShell
```

### 7.2 Batasan Server Component vs Client Component

| Lapisan | Jenis | Tanggung Jawab |
| :--- | :--- | :--- |
| `app/page.tsx`, `app/app/layout.tsx`, `app/app/page.tsx` | **Server Component** | Cek sesi JWT (`requireUser()`), query Prisma awal (hanya milik `userId` aktif), serialisasi `Date` ke ISO string (`toISOString()`) sebelum dikirim ke Client agar 0 warning Next.js dan 0 *hydration mismatch*. |
| `lib/actions/*.ts` | **Server Actions (`'use server'`)** | Validasi Zod, verifikasi `requireUser()` + kepemilikan resource (anti-IDOR), mutasi Prisma (dengan `$transaction` untuk auto-seed & rebalance posisi), dan `revalidatePath('/app')`. |
| `WorkspaceShell.tsx` & turunannya | **Client Component (`'use client'`)** | Mengelola state lokal responsif (snapshot & rollback untuk **Optimistic UI**), interaksi `@dnd-kit`, filter/sort klien yang instan, *Command Palette*, *Task Detail Drawer*, dan pintasan keyboard global. |

### 7.3 Pola Optimistic UI & Konsistensi Data
1. Saat user melakukan mutasi cepat (`toggleComplete`, `moveTask`, `updatePriority`, `toggleSubtask`, `deleteTask`):
   - Simpan `previousTasks` sebagai snapshot.
   - Langsung perbarui state `tasks` di `WorkspaceShell` (`0ms` latensi visual).
   - Panggil *Server Action* secara asinkron.
   - Jika server mengembalikan `{ ok: true, data }`, sinkronkan item (termasuk `id` asli untuk item baru atau `position` hasil rebalance).
   - Jika `{ ok: false, error }` atau *network reject*, kembalikan state ke `previousTasks` dan munculkan Toast error.
2. **Keamanan Hydration Next.js:**
   - Gunakan script inline minimal di `<head>` (`app/layout.tsx`) untuk memasang `data-theme` sebelum *first paint*.
   - Seluruh perhitungan relatif berbasis waktu sekarang (seperti status *overdue* / *"Hari Ini"*) disinkronkan memakai state tanggal klien yang stabil pasca-mount agar SSR dan Client HTML selalu identik 100%.

### 7.4 Standar Aksesibilitas & Verifikasi Akhir
- Semua tombol toggle (View Switcher, Filter, Collapse Group, Theme) memiliki `aria-pressed` / `aria-expanded` dan `aria-label`.
- Fokus keyboard (`focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] focus-visible:outline-offset-2`) terlihat jelas di kedua tema.
- Setiap fase pengerjaan wajib lulus `npx tsc --noEmit`, `npm run lint`, dan `npm run build` dengan **0 error**.