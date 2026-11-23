"use client";

import { Search, X, RotateCcw, ArrowUpDown } from "lucide-react";
import { SerializedTag, SortOption, PriorityFilterOption } from "@/lib/types";

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: PriorityFilterOption;
  onPriorityChange: (p: PriorityFilterOption) => void;
  selectedTagId: string | null;
  onTagChange: (t: string | null) => void;
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
  tags: SerializedTag[];
  onResetFilters: () => void;
}

export function FilterToolbar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  selectedTagId,
  onTagChange,
  sortOption,
  onSortChange,
  tags,
  onResetFilters,
}: FilterToolbarProps) {
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    priorityFilter !== "ALL" ||
    selectedTagId !== null ||
    sortOption !== "manual";

  return (
    <div className="shrink-0 px-4 sm:px-8 py-2 border-b border-[var(--border-hairline)] bg-[var(--surface-subtle)]/60 backdrop-blur-xs">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Left: Search Input & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          {/* Quick Search */}
          <div className="relative flex items-center min-w-[160px] max-w-[240px] flex-1">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari tugas..."
              aria-label="Cari tugas berdasarkan judul atau deskripsi"
              className="w-full min-h-[44px] md:min-h-[34px] pl-8 pr-7 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-xs outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Hapus pencarian"
                className="absolute right-2 p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1">
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value as PriorityFilterOption)}
              aria-label="Filter berdasarkan prioritas"
              className="min-h-[44px] md:min-h-[34px] px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-[var(--text-secondary)] font-medium text-xs outline-none hover:border-[var(--border-strong)] focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="URGENT">Mendesak</option>
              <option value="HIGH">Tinggi</option>
              <option value="MEDIUM">Sedang</option>
              <option value="LOW">Rendah</option>
            </select>
          </div>

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                value={selectedTagId || ""}
                onChange={(e) => onTagChange(e.target.value ? e.target.value : null)}
                aria-label="Filter berdasarkan tag"
                className="min-h-[44px] md:min-h-[34px] px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-[var(--text-secondary)] font-medium text-xs outline-none hover:border-[var(--border-strong)] focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
              >
                <option value="">Semua Tag</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              aria-label="Reset semua filter"
              className="min-h-[44px] md:min-h-[34px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-tertiary)] hover:text-rose-500 hover:border-rose-500/30 transition-all text-xs font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Filter</span>
            </button>
          )}
        </div>

        {/* Right: Sorting Select */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-tertiary)] font-medium hidden md:inline">Urutkan:</span>
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            aria-label="Pilihan pengurutan"
            className="min-h-[44px] md:min-h-[34px] px-2.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-solid)] text-[var(--text-secondary)] font-medium text-xs outline-none hover:border-[var(--border-strong)] focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
          >
            <option value="manual">Manual (Drag)</option>
            <option value="dueDate">Tenggat Terdekat</option>
            <option value="priority">Prioritas Tertinggi</option>
            <option value="newest">Terbaru</option>
          </select>
        </div>
      </div>
    </div>
  );
}
