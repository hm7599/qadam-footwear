// Shoe sizes: stored as EU numbers, shown everywhere as "EU/UK" — e.g. 39/6, 44/11.
export const SIZE_OPTIONS: number[] = [39, 40, 41, 42, 43, 44, 45, 46];

export const DEFAULT_SIZE = 42;

// EU → UK: UK = EU − 33 (39/6, 40/7 … 46/13). The EU number is what is stored in cart/orders.
export const EU_TO_UK: Record<number, number> = Object.fromEntries(
  [38, 39, 40, 41, 42, 43, 44, 45, 46, 47].map(eu => [eu, eu - 33]),
);

/** UK size number for a stored EU size (null for old US-size orders) */
export const ukSize = (eu: number): number | null => (eu >= 30 ? EU_TO_UK[eu] ?? Math.round(eu - 33) : null);

/** Size label "EU/UK" — 44 -> "44/11". Older orders stored US sizes (< 20), those show as "9 US". */
export function sizeLabel(size: number | string): string {
  const n = Number(size);
  if (!Number.isFinite(n)) return String(size);
  const uk = ukSize(n);
  return uk === null ? `${n} US` : `${n}/${uk}`;
}

/** Long label — 44 -> "44/11 (EU 44 · UK 11)" */
export function sizeLabelFull(size: number | string): string {
  const n = Number(size);
  return n >= 30 ? `${sizeLabel(n)} (EU ${n} · UK ${ukSize(n)})` : sizeLabel(n);
}

/** "39/6 – 46/13" range for a product's sizes */
export function sizeRange(sizes: number[] = []): string {
  const eu = sizes.filter(s => s >= 30).sort((a, b) => a - b);
  if (!eu.length) return '';
  return eu.length === 1 ? sizeLabel(eu[0]) : `${sizeLabel(eu[0])} – ${sizeLabel(eu[eu.length - 1])}`;
}

/** Default selection: 42 if available, else the first available size */
export function pickDefaultSize(productSizes: number[] = []): number {
  const eu = productSizes.filter(s => s >= 30);
  if (!eu.length || eu.includes(DEFAULT_SIZE)) return DEFAULT_SIZE;
  return [...eu].sort((a, b) => a - b)[0];
}
