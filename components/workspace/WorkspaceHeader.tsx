"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Menu,
  LayoutList,
  LayoutGrid,
  Calendar,
  Search,
  PanelLeftOpen,
  LogOut,
  User as UserIcon,
  Check,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceView, SerializedUser } from "@/lib/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Modal } from "@/components/ui/Modal";
import { logoutAction, updateProfileAction } from "@/lib/actions/auth";
import { useToast } from "@/components/ui/ToastProvider";

interface WorkspaceHeaderProps {
  title: string;
  taskCount: number;
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  onOpenCommandPalette?: () => void;
  user: SerializedUser;
  onUserUpdated?: (user: SerializedUser) => void;
}

const VIEW_OPTIONS: { id: WorkspaceView; label: string; icon: React.ElementType }[] = [
  { id: "list", label: "List", icon: LayoutList },
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "calendar", label: "Kalender", icon: Calendar },
];

export function WorkspaceHeader({
  title,
  taskCount,
  activeView,
  onSelectView,
  isSidebarOpen,
  onToggleSidebar,
  onOpenMobileSidebar,
  onOpenCommandPalette,
  user,
  onUserUpdated,
}: WorkspaceHeaderProps) {
  const toast = useToast();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State Form Edit Profil
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setCurrentPassword("");
    setNewPassword("");
    setIsChangingPassword(false);
    setIsProfileMenuOpen(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim() || isSavingProfile) return;

    setIsSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      formData.append("email", editEmail.trim());
      if (isChangingPassword && newPassword) {
        formData.append("currentPassword", currentPassword);
        formData.append("newPassword", newPassword);
      }

      const res = await updateProfileAction(formData);
      if (res.ok) {
        toast.success("Profil berhasil diperbarui.");
        onUserUpdated?.(res.data);
        setIsEditModalOpen(false);
      } else {
        toast.error(res.error);
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <header className="h-14 shrink-0 border-b border-[var(--border-hairline)] bg-[var(--glass-header)] backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Sisi Kiri: Toggle Sidebar & Judul Scope */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {/* Tombol Drawer Sidebar Mobile (< md) */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
          aria-label="Buka Menu Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Tombol Tampilkan Sidebar di Desktop (hanya muncul saat sidebar sedang tertutup) */}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-w-[36px] min-h-[36px] items-center justify-center cursor-pointer"
            aria-label="Tampilkan sidebar"
            title="Tampilkan sidebar (⌘B)"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-display font-bold text-base sm:text-xl truncate tracking-tight">
            {title}
          </h1>
          <span className="font-mono text-xs text-[var(--text-tertiary)] tabular-nums px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-hairline)] hidden sm:inline-block">
            {taskCount} tugas
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Switcher View, Search, ThemeToggle, & Profile User */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* View Switcher Segmented Control */}
        <div
          role="tablist"
          aria-label="Pilihan tampilan workspace"
          className="relative inline-flex items-center p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)]"
        >
          {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Tampilan ${label}`}
                onClick={() => onSelectView(id)}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors select-none min-h-[32px] min-w-[34px] sm:min-w-[80px]",
                  isActive
                    ? "text-[var(--text-primary)] font-semibold"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="workspace-view-pill"
                    className="absolute inset-0 rounded-lg bg-[var(--glass-active-pill)] border border-[var(--border-hairline)] shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Cmd+K Search Button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all min-h-[36px] cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Cari...</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface-solid)]">
            ⌘K
          </kbd>
        </button>

        {/* Ganti Tema (Dipindahkan ke Header, sangat smooth) */}
        <ThemeToggle />

        {/* Profile Avatar & Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label="Menu akun pengguna"
            aria-expanded={isProfileMenuOpen}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-[var(--glass-hover)] border border-[var(--border-hairline)] bg-[var(--surface-subtle)] transition-all min-h-[36px] cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-[var(--accent-primary)] text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline font-sans text-xs font-medium text-[var(--text-primary)] max-w-[110px] truncate">
              {user.name}
            </span>
          </button>

          {/* Popover Menu Profil & Log Out */}
          {isProfileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-60 rounded-2xl fluid-glass-elevated border border-[var(--border-strong)] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2.5 border-b border-[var(--border-hairline)] mb-1">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name}</div>
                  <div className="text-[11px] font-mono text-[var(--text-tertiary)] truncate">{user.email}</div>
                </div>

                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] transition-colors text-left cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span>Edit Profil Pengguna</span>
                  </button>

                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Log Out)</span>
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Edit Profil Pengguna */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profil Pengguna"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-sans text-xs font-medium text-[var(--text-secondary)]">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nama lengkap Anda..."
              required
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-xs font-sans text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-sans text-xs font-medium text-[var(--text-secondary)]">
              Alamat Email
            </label>
            <input
              type="email"
              name="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="Alamat email Anda..."
              required
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-xs font-sans text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>

          {/* Accordion Ganti Password */}
          <div className="pt-2 border-t border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setIsChangingPassword((prev) => !prev)}
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline flex items-center gap-1.5 py-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isChangingPassword ? "Batal ubah password" : "Ubah Password"}</span>
            </button>

            {isChangingPassword && (
              <div className="mt-3 space-y-3 p-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Password Saat Ini
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini..."
                    required={isChangingPassword}
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-xs font-sans text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter..."
                    required={isChangingPassword}
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-xs font-sans text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingProfile || !editName.trim() || !editEmail.trim()}
              className="min-h-[40px] px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              {isSavingProfile ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
