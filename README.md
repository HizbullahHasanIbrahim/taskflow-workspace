# TaskFlow Workspace

> **ClickUp & Linear-Inspired Full-Stack Task Engine** yang dibangun di atas Next.js App Router, TypeScript, Tailwind CSS v4, dan Prisma ORM (MySQL), dibalut dengan filosofi desain **Apple Fluid Glass**.

TaskFlow Workspace dirancang untuk produktivitas berkecepatan tinggi dengan menggabungkan arsitektur *Multi-View* (List, Kanban Board, Kalender), pemrosesan bahasa alami pada input tugas (*Smart Quick-Add*), algoritma pengurutan *Float Gap Positioning $O(1)$* dengan auto-rebalance terurut, serta pembaruan antarmuka instan (*Optimistic UI*) berfitur pemulihan (*Undo Toast*).

---

## Fitur Utama & Arsitektur

### 1. Multi-View Task Engine
Satu sumber data relasional disajikan secara instan dalam 3 sudut pandang berbeda tanpa kehilangan status filter:
- **List View:** Daftar tugas hierarkis dikelompokkan berdasarkan status (`To Do`, `In Progress`, `Review`, `Done`) dengan collapsible group, inline add, subtask counter, dan row drag-and-drop.
- **Kanban Board:** Papan 4 kolom interaktif berbasis `@dnd-kit` dengan sensor pointer & keyboard, `DragOverlay` terangkat halus, dan transisi fluid antar kolom.
- **Calendar View:** Grid bulanan berbasis `date-fns` (lokalisasi bahasa Indonesia) dengan navigasi bulan, penanda hari ini, pembuatan tugas langsung pada tanggal target, serta panel samping *"Tanpa Tenggat"*.

### 2. Smart Quick-Add (NLP Parser)
Kotak masukan cerdas satu baris di bagian atas workspace yang otomatis mendeteksi:
- **Tenggat Waktu:** `hari ini`, `besok`, `lusa`, nama hari (`senin`–`minggu`), atau format `dd/mm`.
- **Tingkat Prioritas:** `!urgent` / `!mendesak`, `!high` / `!tinggi`, `!medium` / `!sedang`, `!low` / `!rendah`.
- **Label / Tag:** `#nama-tag` (otomatis ditautkan atau dibuatkan tag baru).
Dilengkapi *live token chips preview* sebelum tugas disimpan ke database.

### 3. $O(1)$ Float-Gap Positioning & Auto-Rebalance
Pengurutan drag-and-drop tidak menggunakan penulisan ulang seluruh array baris ($O(N)$), melainkan menghitung posisi desimal baru di antara dua item ($O(1)$) dengan jarak default `1024`. Jika selisih posisi antar tugas menjadi terlalu rapat (`< 0.001`), server secara otomatis melakukan *rebalance* normalisasi terurut di dalam transaksi Prisma (`prisma.$transaction`).

### 4. Optimistic UI & Error Rollback
Seluruh mutasi berfrekuensi tinggi (centang tugas selesai, pindah kolom Kanban, ubah prioritas, checklist subtask, pasang tag, dan hapus tugas) langsung memperbarui UI di sisi browser dalam 0ms, menyimpan snapshot state, dan otomatis melakukan rollback disertai notifikasi error jika Server Action gagal. Penghapusan tugas dilindungi toast *"Urungkan"* (Undo) selama 5 detik.

### 5. Apple Fluid Glass Dual Theme
Sistem desain berbasis translusensi material kaca (`backdrop-filter: blur(22px) saturate(180%)`) dengan *specular top highlight* dan bayangan halus. Mendukung dua tema visual setara dengan kontras WCAG AA (>= 4.5:1):
- **Light Porcelain Mode:** Latar kanvas cerah dengan permukaan solid dan border lembut.
- **Dark Obsidian Mode:** Latar gelap pekat dengan aksen neon terkontrol.
- Inisialisasi anti-flash di `<head>` dan dukungan penuh untuk `@media (prefers-reduced-motion: reduce)` serta `@media (prefers-reduced-transparency: reduce)`.

### 6. Keamanan & Anti-IDOR Berlapis
- Sesi autentikasi aman menggunakan token JWT bertanda tangan (`jose`) yang disimpan di dalam cookie `taskflow_session` (`HttpOnly`, `SameSite=Lax`, `Secure` di production).
- Validasi parameter input di sisi server menggunakan skema ketat **Zod v4**.
- Perlindungan **Anti-IDOR (Insecure Direct Object Reference)** di setiap *Server Action*: setiap query dan mutasi data (`Task`, `TaskList`, `Subtask`, `Tag`) selalu memverifikasi kepemilikan pengguna aktif (`userId`).
- Password dienkripsi dengan salt round `bcryptjs` dan tidak pernah diekspos ke client (`select` eksplisit).
- Auto-seeding akun baru (3 List contoh, 3 Tag default, 4 Task lengkap dengan subtask) dalam 1 transaksi Prisma saat registrasi.

---

## Tech Stack

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Server Components, Server Actions, Dynamic Routing, Metadata API |
| **Runtime & Lib** | [React 19](https://react.dev/) | React Server Components, Suspense, `useMemo`, `useCallback` |
| **Bahasa** | [TypeScript 5](https://www.typescriptlang.org/) | Strict Type-Safety menyeluruh (0 `any` policy) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | `@import "tailwindcss";`, `@theme inline`, CSS Custom Properties |
| **Database & ORM** | [MySQL](https://www.mysql.com/) + [Prisma v6](https://www.prisma.io/) | Relasional Schema, Indexes, Cascading Delete, Transactions |
| **Drag & Drop** | [@dnd-kit](https://dndkit.com/) | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Animasi** | [Motion](https://motion.dev/) (`motion/react`) | Fluid spring transitions, `AnimatePresence`, segmented switchers |
| **Smooth Scroll** | [Lenis](https://lenis.darkroom.engineering/) | Khusus pada Landing Page (`/`), dinonaktifkan otomatis di `/app` |
| **Autentikasi** | [jose](https://github.com/panva/jose) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | JWT HttpOnly Cookie Session & Password Hashing |
| **Validasi** | [Zod v4](https://zod.dev/) | Validasi skema input form & Server Actions |
| **Tanggal & Waktu** | [date-fns v4](https://date-fns.org/) | Manipulasi tanggal & kalender bulanan (locale `id`) |
| **Ikon** | [Lucide React](https://lucide.dev/) | Ikon antarmuka seragam `strokeWidth={1.75}` (Zero Emoji) |

---

## Struktur Direktori

Proyek ini menggunakan struktur standar Next.js App Router **tanpa folder `src/`**:

```
taskflow-workspace/
├── app/
│   ├── (auth)/
│   │   ├── login/               # Halaman Masuk & LoginForm
│   │   └── register/            # Halaman Daftar & RegisterForm
│   ├── app/
│   │   ├── error.tsx            # Client Error Boundary khusus Workspace
│   │   ├── layout.tsx           # Layout proteksi sesi requireUser()
│   │   ├── loading.tsx          # Skeleton loading state
│   │   └── page.tsx             # Server Component fetching & Date serialization
│   ├── globals.css              # Tailwind CSS v4 & Apple Fluid Glass design tokens
│   ├── layout.tsx               # Root Layout + Anti-flash theme script + Fonts
│   ├── not-found.tsx            # Halaman 404 bergaya Fluid Glass
│   └── page.tsx                 # Landing Page interaktif
├── components/
│   ├── landing/                 # Navbar, InteractivePreview, SmoothScroll (Lenis)
│   ├── ui/                      # Modal, ThemeToggle, ToastProvider, Providers
│   └── workspace/               # WorkspaceShell, Sidebar, WorkspaceHeader,
│                                # SmartQuickAdd, ListView, BoardView,
│                                # CalendarView, FilterToolbar, CommandPalette,
│                                # TaskDetailDrawer
├── lib/
│   ├── actions/                 # Server Actions: auth, tasks, lists, subtasks, tags
│   ├── auth.ts                  # Utilitas JWT session (jose) & requireUser()
│   ├── position.ts              # Algoritma Float Gap O(1) & auto-rebalance threshold
│   ├── prisma.ts                # PrismaClient singleton instance
│   ├── quickAddParser.ts        # NLP parser untuk ekstraksi tanggal, prioritas, & tag
│   ├── types.ts                 # Definisi interface Serialized data & Workspace types
│   ├── utils.ts                 # Helper cn (clsx + tailwind-merge)
│   └── validations.ts           # Skema validasi Zod v4 untuk seluruh input
├── prisma/
│   └── schema.prisma            # Skema database MySQL (User, TaskList, Task, Subtask, Tag)
└── public/                      # Aset statis & favicon
```

---

## Pintasan Keyboard (Keyboard Shortcuts)

Antarmuka dirancang *keyboard-first* untuk kecepatan navigasi maksimal:

| Pintasan | Lingkup | Fungsi |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> | Global | Membuka / menutup **Command Palette** |
| <kbd>N</kbd> | Workspace Canvas | Fokus instan ke input **Smart Quick-Add** |
| <kbd>1</kbd> | Workspace Canvas | Berpindah ke **List View** |
| <kbd>2</kbd> | Workspace Canvas | Berpindah ke **Kanban Board View** |
| <kbd>3</kbd> | Workspace Canvas | Berpindah ke **Calendar View** |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Command Palette | Navigasi item daftar hasil pencarian |
| <kbd>Enter</kbd> | Command Palette | Menjalankan aksi / memilih item aktif |
| <kbd>Escape</kbd> | Global | Menutup Command Palette, Modal, atau Task Detail Drawer |

> *Catatan: Pintasan huruf tunggal (`N`, `1`, `2`, `3`) secara otomatis dinonaktifkan saat kursor berada di dalam elemen input teks, textarea, atau dropdown.*

---

## Panduan Instalasi & Menjalankan Lokal

### Prasyarat
1. **Node.js** versi 20.x atau yang lebih baru.
2. **MySQL Server** (misalnya melalui XAMPP atau MySQL Service lokal).

### Langkah-Langkah

1. **Clone Repositori & Masuk ke Direktori:**
   ```bash
   git clone <repository-url>
   cd taskflow-workspace
   ```

2. **Instal Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable (`.env`):**
   Pastikan file `.env` di root proyek memiliki konfigurasi koneksi database MySQL dan secret key autentikasi:
   ```env
   DATABASE_URL="mysql://root:@127.0.0.1:3306/taskflow_db"
   AUTH_SECRET="ganti_dengan_secret_acak_minimal_32_karakter_untuk_jwt"
   ```

4. **Siapkan Database MySQL:**
   Pastikan service MySQL berjalan pada port `3306`, lalu sinkronkan skema Prisma:
   ```bash
   npx prisma db push
   ```
   *(Opsional: Jalankan `npx prisma studio` jika ingin menginspeksi tabel database melalui browser).*

5. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) pada peramban Anda.

6. **Membuat Akun Pertama:**
   Buka halaman `/register` untuk membuat akun. Sistem akan langsung menginisialisasi workspace Anda dengan data onboarding awal (3 List, 3 Tag, 4 Tugas lengkap dengan subtask).

---

## Pengujian Kualitas Kode

Proyek ini mematuhi standar nol peringatan (*zero-warning policy*):

```bash
# 1. Pengecekan tipe statis TypeScript (0 Error)
npx tsc --noEmit

# 2. Linting kode ESLint (0 Error, 0 Warning)
npm run lint

# 3. Build optimasi produksi Next.js
npm run build
```

---

## Lisensi
Proyek ini dibuat untuk keperluan portofolio rekayasa perangkat lunak full-stack modern.
