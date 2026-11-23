"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Inbox,
  Briefcase,
  Sparkles,
  Folder,
  Code,
  Book,
  Heart,
  Star,
  Plus,
  LogOut,
  Pencil,
  Trash2,
  Check,
  X,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SerializedTaskList, SerializedUser, WorkspaceScope } from "@/lib/types";
import { logoutAction } from "@/lib/actions/auth";
import { Modal } from "@/components/ui/Modal";
import { createListAction, updateListAction, deleteListAction } from "@/lib/actions/lists";
import { useToast } from "@/components/ui/ToastProvider";

const ICON_MAP: Record<string, React.ElementType> = {
  inbox: Inbox,
  briefcase: Briefcase,
  sparkles: Sparkles,
  folder: Folder,
  code: Code,
  book: Book,
  heart: Heart,
  star: Star,
};

const APPLE_COLORS = [
  "#007aff", // Blue
  "#5856d6", // Indigo
  "#af52de", // Purple
  "#ff2d55", // Pink
  "#ff3b30", // Red
  "#ff9500", // Orange
  "#34c759", // Green
  "#0ea5e9", // Cyan
];

export function getListIcon(iconName: string) {
  return ICON_MAP[iconName.toLowerCase()] || Folder;
}

interface SidebarProps {
  user: SerializedUser;
  lists: SerializedTaskList[];
  taskCountsByScope: Record<string, number>;
  activeScope: WorkspaceScope;
  onSelectScope: (scope: WorkspaceScope) => void;
  isSidebarOpen: boolean;
  onToggleDesktopSidebar?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onListCreated?: (list: SerializedTaskList) => void;
  onListUpdated?: (list: SerializedTaskList) => void;
  onListDeleted?: (id: string) => void;
}

export function Sidebar({
  user,
  lists,
  taskCountsByScope,
  activeScope,
  onSelectScope,
  isSidebarOpen,
  onToggleDesktopSidebar,
  isOpenMobile,
  onCloseMobile,
  onListCreated,
  onListUpdated,
  onListDeleted,
}: SidebarProps) {
  const toast = useToast();
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<SerializedTaskList | null>(null);
  const [deletingList, setDeletingList] = useState<SerializedTaskList | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [listName, setListName] = useState("");
  const [listColor, setListColor] = useState(APPLE_COLORS[0]);
  const [listIcon, setListIcon] = useState("folder");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const smartViews = [
    { id: "all", label: "Semua Tugas", icon: Layers, count: taskCountsByScope.all || 0 },
    { id: "today", label: "Hari Ini", icon: Calendar, count: taskCountsByScope.today || 0 },
    { id: "upcoming", label: "Mendatang", icon: Clock, count: taskCountsByScope.upcoming || 0 },
    { id: "completed", label: "Selesai", icon: CheckCircle2, count: taskCountsByScope.completed || 0 },
  ];

  const handleOpenAddModal = () => {
    setEditingList(null);
    setListName("");
    setListColor(APPLE_COLORS[0]);
    setListIcon("folder");
    setIsListModalOpen(true);
  };

  const handleOpenEditModal = (list: SerializedTaskList, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingList(list);
    setListName(list.name);
    setListColor(list.color);
    setListIcon(list.icon);
    setIsListModalOpen(true);
  };

  const handlePromptDelete = (list: SerializedTaskList, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingList(list);
  };

  const handleConfirmDelete = async () => {
    if (!deletingList || isDeleting) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", deletingList.id);
      const res = await deleteListAction(formData);

      if (res.ok) {
        toast.success("List berhasil dihapus.");
        onListDeleted?.(deletingList.id);
        if (activeScope === `list:${deletingList.id}`) {
          onSelectScope("all");
        }
        setDeletingList(null);
      } else {
        toast.error(res.error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", listName.trim());
    formData.append("color", listColor);
    formData.append("icon", listIcon);

    let res;
    if (editingList) {
      formData.append("id", editingList.id);
      res = await updateListAction(formData);
    } else {
      res = await createListAction(formData);
    }

    setIsSubmitting(false);

    if (res.ok) {
      toast.success(editingList ? "List berhasil diperbarui." : "List baru berhasil dibuat.");
      if (editingList) {
        onListUpdated?.(res.data);
      } else {
        onListCreated?.(res.data);
      }
      setIsListModalOpen(false);
    } else {
      toast.error(res.error);
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-[var(--glass-sidebar)] text-[var(--text-primary)] font-sans">
      {/* Header / App Brand */}
      <div className="h-14 px-5 border-b border-[var(--border-hairline)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">TaskFlow</span>
        </div>

        {/* Tombol Hide Sidebar di Desktop (berada persis di samping tulisan TaskFlow) */}
        <button
          type="button"
          onClick={onToggleDesktopSidebar}
          className="hidden md:flex p-1.5 rounded-lg hover:bg-[var(--glass-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors min-w-[32px] min-h-[32px] items-center justify-center cursor-pointer"
          aria-label="Sembunyikan sidebar"
          title="Sembunyikan sidebar (⌘B)"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>

        {/* Tombol Tutup Sidebar di Mobile */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg hover:bg-[var(--glass-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
          aria-label="Tutup sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Nav Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Smart Views */}
        <div>
          <div className="px-3 mb-2 font-sans text-xs font-medium text-[var(--text-secondary)]">
            Tampilan Cerdas
          </div>
          <div className="space-y-0.5">
            {smartViews.map((sv) => {
              const Icon = sv.icon;
              const isActive = activeScope === sv.id;
              return (
                <button
                  key={sv.id}
                  type="button"
                  onClick={() => {
                    onSelectScope(sv.id as WorkspaceScope);
                    onCloseMobile();
                  }}
                  className={cn(
                    "relative w-full min-h-[44px] md:min-h-[36px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                    isActive
                      ? "text-[var(--text-primary)] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-xl bg-[var(--glass-active-pill)] border border-[var(--border-hairline)] shadow-sm -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-tertiary)]")} />
                    <span className="truncate">{sv.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)] tabular-nums px-1.5 py-0.5 rounded-md bg-[var(--surface-subtle)]">
                    {sv.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Lists */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[var(--text-secondary)]">
              Daftar Tugas
            </span>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="p-1 rounded-lg hover:bg-[var(--glass-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Tambah List Baru"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            {lists.map((list) => {
              const Icon = getListIcon(list.icon);
              const scopeKey = `list:${list.id}`;
              const isActive = activeScope === scopeKey;
              const count = taskCountsByScope[list.id] || 0;

              return (
                <div
                  key={list.id}
                  onClick={() => {
                    onSelectScope(scopeKey as WorkspaceScope);
                    onCloseMobile();
                  }}
                  className={cn(
                    "group relative min-h-[44px] md:min-h-[36px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors",
                    isActive
                      ? "text-[var(--text-primary)] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-xl bg-[var(--glass-active-pill)] border border-[var(--border-hairline)] shadow-sm -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: list.color }}
                    />
                    <Icon className="w-4 h-4 shrink-0 text-[var(--text-tertiary)]" />
                    <span className="truncate">{list.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)] tabular-nums px-1.5 py-0.5 rounded-md bg-[var(--surface-subtle)] group-hover:hidden">
                      {count}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(list, e)}
                        className="p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        aria-label="Edit list"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      {lists.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handlePromptDelete(list, e)}
                          className="p-1 rounded hover:bg-rose-500/10 text-[var(--text-tertiary)] hover:text-rose-500"
                          aria-label="Hapus list"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[var(--border-hairline)] bg-[var(--surface-subtle)]/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center font-bold text-xs text-[var(--accent-primary)] shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate leading-tight">{user.name}</div>
            <div className="text-[10px] font-mono text-[var(--text-tertiary)] truncate leading-tight">{user.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <form action={logoutAction}>
            <button
              type="submit"
              className="p-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-tertiary)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              aria-label="Keluar dari akun"
              title="Keluar (Log Out)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal CRUD List */}
      <Modal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        title={editingList ? "Edit List Tugas" : "Tambah List Tugas Baru"}
      >
        <form onSubmit={handleSaveList} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-sans text-xs font-medium text-[var(--text-secondary)]">Nama Daftar</label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="mis. Kuliah, Proyek Sampingan"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-sans text-xs font-medium text-[var(--text-secondary)]">Warna Daftar</label>
            <div className="flex items-center gap-2 flex-wrap">
              {APPLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setListColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90",
                    listColor === c ? "ring-2 ring-offset-2 ring-[var(--accent-primary)] scale-110" : ""
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Pilih warna ${c}`}
                >
                  {listColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-sans text-xs font-medium text-[var(--text-secondary)]">Ikon Daftar</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {Object.keys(ICON_MAP).map((iconKey) => {
                const IconComp = ICON_MAP[iconKey];
                const isSelected = listIcon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setListIcon(iconKey)}
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-[var(--accent-soft)] border-[var(--accent-primary)] text-[var(--accent-primary)]"
                        : "bg-[var(--surface-subtle)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                    aria-label={`Pilih ikon ${iconKey}`}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsListModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[var(--glass-hover)]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan List"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus List */}
      {deletingList && (
        <Modal
          isOpen={Boolean(deletingList)}
          onClose={() => setDeletingList(null)}
          title="Hapus Daftar Tugas"
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Apakah Anda yakin ingin menghapus daftar <strong>&ldquo;{deletingList.name}&rdquo;</strong>? Seluruh tugas di dalamnya akan terhapus secara permanen.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setDeletingList(null)}
                className="px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all"
              >
                {isDeleting ? "Menghapus..." : "Hapus List"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Animasi Hide / Expand */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="hidden md:flex flex-col h-[100dvh] shrink-0 border-r border-[var(--border-hairline)] z-20 overflow-hidden"
          >
            <div className="w-[260px] h-full flex flex-col">
              {content}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Slide-over */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="relative w-[280px] h-full z-10 shadow-2xl"
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
