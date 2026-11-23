"use client";

import { useEffect, useRef, RefObject } from "react";

/**
 * Hook aksesibilitas Focus Trap untuk modal, drawer, dan dialog overlay.
 * Mengunci navigasi tombol Tab / Shift+Tab di dalam elemen aktif agar fokus tidak bocor ke latar belakang.
 * Menyimpan elemen yang aktif sebelum overlay dibuka dan mengembalikan fokus saat ditutup.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isOpen: boolean,
  externalRef?: RefObject<T | null>
): RefObject<T | null> {
  const internalRef = useRef<T | null>(null);
  const targetRef = externalRef || internalRef;
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Simpan elemen yang sedang aktif di dokumen sebelum overlay terbuka
    if (typeof document !== "undefined") {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
    }

    const element = targetRef.current;
    if (!element) return;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    // Berikan sedikit jeda frame agar elemen selesai me-mount sebelum memfokuskan elemen interaktif pertama
    const focusTimer = setTimeout(() => {
      const focusable = element.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length > 0) {
        // Hanya fokuskan jika fokus saat ini belum berada di dalam kontainer
        if (!element.contains(document.activeElement)) {
          focusable[0].focus();
        }
      }
    }, 20);

    // Kunci siklus Tab dan Shift+Tab di dalam kontainer
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = element.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Mundur ke belakang: jika di item pertama, putar ke item terakhir
        if (document.activeElement === firstItem) {
          e.preventDefault();
          lastItem.focus();
        }
      } else {
        // Maju ke depan: jika di item terakhir, putar ke item pertama
        if (document.activeElement === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };

    element.addEventListener("keydown", handleKeyDown);

    // Saat ditutup, kembalikan fokus ke elemen pemicu sebelumnya
    return () => {
      clearTimeout(focusTimer);
      element.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, targetRef]);

  return targetRef;
}
