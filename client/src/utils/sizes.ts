// Shoe sizes: stored as EU numbers (39, 40, 41, 42, 43, 44, 45).
export const SIZE_OPTIONS: number[] = [39, 40, 41, 42, 43, 44, 45];

export const DEFAULT_SIZE = 42;

// EU → UK: UK = EU − 33 (39/6, 40/7 … 46/13). The EU number is what is stored in cart/orders.
export const EU_TO_UK: Record<number, number> = Object.fromEntries(
  [38, 39, 40, 41, 42, 43, 44, 45, 46, 47].map(eu => [eu, eu - 33]),
);

/** UK size number for a stored EU size (null for old US-size orders) */
export const ukSize = (eu: number): number | null => (eu >= 30 ? EU_TO_UK[eu] ?? Math.round(eu - 33) : null);

/** Size label: clean EU number e.g. "43". Older orders stored US sizes (< 20) show as "9 US". */
export function sizeLabel(size: number | string): string {
  const n = Number(size);
  if (!Number.isFinite(n)) return String(size);
  return n >= 30 ? String(n) : `${n} US`;
}

/** Long label with UK conversion — e.g. 43 -> "Size 43 (EU 43 · UK 10)" */
export function sizeLabelFull(size: number | string): string {
  const n = Number(size);
  return n >= 30 ? `Size ${n} (EU ${n} · UK ${ukSize(n)})` : sizeLabel(n);
}

/** "39 – 45" range for a product's sizes */
export function sizeRange(sizes: number[] = []): string {
  const eu = sizes.filter(s => s >= 30).sort((a, b) => a - b);
  if (!eu.length) return '';
  return eu.length === 1 ? sizeLabel(eu[0]) : `${sizeLabel(eu[0])} – ${sizeLabel(eu[eu.length - 1])}`;
}

/** Default selection: 42 if available, else 43, else first available */
export function pickDefaultSize(productSizes: number[] = []): number {
  const eu = productSizes.filter(s => s >= 30);
  if (!eu.length) return DEFAULT_SIZE;
  if (eu.includes(DEFAULT_SIZE)) return DEFAULT_SIZE;
  if (eu.includes(43)) return 43;
  return [...eu].sort((a, b) => a - b)[0];
}

/** Admin presets for quickly filling a product's sizes */
export const SIZE_PRESETS: { label: string; sizes: number[] }[] = [
  { label: 'Standard 39–45', sizes: [39, 40, 41, 42, 43, 44, 45] },
  { label: 'Extended 39–46', sizes: [39, 40, 41, 42, 43, 44, 45, 46] },
  { label: 'Small 36–41', sizes: [36, 37, 38, 39, 40, 41] },
  { label: 'Regular 40–44', sizes: [40, 41, 42, 43, 44] },
  { label: 'Big 44–47', sizes: [44, 45, 46, 47] },
];

/** Valid custom EU size: 30–50, whole or half sizes */
export const isValidEuSize = (n: number) => Number.isFinite(n) && n >= 30 && n <= 50 && Number.isInteger(n * 2);

/** Sizes to show as buttons: the standard grid plus any extra sizes this product has, sorted */
export function displaySizes(productSizes: number[] = []): number[] {
  return [...new Set([...SIZE_OPTIONS, ...productSizes.filter(s => s >= 30)])].sort((a, b) => a - b);
}
