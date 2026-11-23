export const DEFAULT_GAP = 1024;
export const REBALANCE_THRESHOLD = 0.001;

/**
 * Menghitung posisi Float Gap O(1) untuk item di antara dua item
 */
export function calculateNextPosition(
  prev: number | null,
  next: number | null
): { position: number; needsRebalance: boolean } {
  if (prev === null && next === null) {
    return { position: DEFAULT_GAP, needsRebalance: false };
  }

  if (prev === null && next !== null) {
    const pos = next / 2;
    return { position: pos, needsRebalance: pos < REBALANCE_THRESHOLD };
  }

  if (prev !== null && next === null) {
    return { position: prev + DEFAULT_GAP, needsRebalance: false };
  }

  if (prev !== null && next !== null) {
    const gap = next - prev;
    const pos = prev + gap / 2;
    return { position: pos, needsRebalance: Math.abs(gap) < REBALANCE_THRESHOLD };
  }

  return { position: DEFAULT_GAP, needsRebalance: false };
}

/**
 * Menghitung posisi berikutnya di akhir daftar
 */
export function getAppendPosition(items: { position: number }[]): number {
  if (!items || items.length === 0) return DEFAULT_GAP;
  const maxPos = Math.max(...items.map((i) => i.position));
  return maxPos + DEFAULT_GAP;
}
