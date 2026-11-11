// Shoe sizes: stored as EU numbers, shown to customers as UK first (Pakistan uses UK sizing).
export const SIZE_OPTIONS: number[] = [39, 40, 41, 42, 43, 44, 45, 46];

export const DEFAULT_SIZE = 42;

// EU → UK, same table as the Size Guide page (men's). The EU number is what is stored in cart/orders.
export const EU_TO_UK: Record<number, number> = { 38: 5, 39: 6, 40: 6.5, 41: 7.5, 42: 8, 43: 9, 44: 9.5, 45: 10.5, 46: 11.5, 47: 12 };

/** UK size number for a stored EU size (null for old US-size orders) */
export const ukSize = (eu: number): number | null => (eu >= 30 ? EU_TO_UK[eu] ?? Math.round((eu - 33.5) * 2) / 2 : null);

/** Short label, UK first — 44 -> "UK 9.5". Older orders stored US sizes (< 20), those show as "9 US". */
export function sizeLabel(size: number | string): string {
  const n = Number(size);
  if (!Number.isFinite(n)) return String(size);
  const uk = ukSize(n);
  return uk === null ? `${n} US` : `UK ${uk}`;
}

/** Long label with EU — 44 -> "UK 9.5 · EU 44" */
export function sizeLabelFull(size: number | string): string {
  const n = Number(size);
  return n >= 30 ? `${sizeLabel(n)} · EU ${n}` : sizeLabel(n);
}

/** "UK 6–11.5" range for a product's sizes */
export function sizeRange(sizes: number[] = []): string {
  const uk = sizes.filter(s => s >= 30).map(s => ukSize(s)!).sort((a, b) => a - b);
  if (!uk.length) return '';
  return uk.length === 1 ? `UK ${uk[0]}` : `UK ${uk[0]}–${uk[uk.length - 1]}`;
}

/** Default selection: 42 if available, else the first available size */
export function pickDefaultSize(productSizes: number[] = []): number {
  const eu = productSizes.filter(s => s >= 30);
  if (!eu.length || eu.includes(DEFAULT_SIZE)) return DEFAULT_SIZE;
  return [...eu].sort((a, b) => a - b)[0];
}
