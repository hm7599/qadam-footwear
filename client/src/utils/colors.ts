/**
 * Standard Color Presets for Footwear & Leather Goods.
 * Used in Admin Panel dropdowns, bulk import, and store filters.
 */
export interface ColorPreset {
  name: string;
  hex: string;
  label?: string;
  border?: boolean; // For white / very light colors needing a border on white backgrounds
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Maroon', hex: '#681326', label: 'Maroon / Oxblood' },
  { name: 'White', hex: '#FFFFFF', label: 'White', border: true },
  { name: 'Black', hex: '#111111', label: 'Black' },
  { name: 'Brown', hex: '#4A2E1B', label: 'Brown / Dark Brown' },
  { name: 'Tan', hex: '#C49A6C', label: 'Tan / Cognac' },
  { name: 'Navy', hex: '#1A2B4C', label: 'Navy Blue' },
];

export const COLOR_HEX_MAP: Record<string, string> = {
  maroon: '#681326',
  oxblood: '#681326',
  burgundy: '#681326',
  white: '#FFFFFF',
  offwhite: '#F5F5F0',
  black: '#111111',
  nero: '#111111',
  brown: '#4A2E1B',
  darkbrown: '#3B2212',
  tan: '#C49A6C',
  cognac: '#C49A6C',
  sienna: '#8B5A2B',
  navy: '#1A2B4C',
  blue: '#1A2B4C',
  grey: '#6B7280',
  gray: '#6B7280',
};

/**
 * Match a color name or hex to one of the standard presets.
 */
export function matchColorPreset(name: string, hex?: string): ColorPreset | undefined {
  const normName = (name || '').trim().toLowerCase();
  const normHex = (hex || '').trim().toUpperCase();

  // Match by name first
  const byName = COLOR_PRESETS.find(p => p.name.toLowerCase() === normName);
  if (byName) return byName;

  // Match by hex if provided
  if (normHex) {
    const byHex = COLOR_PRESETS.find(p => p.hex.toUpperCase() === normHex);
    if (byHex) return byHex;
  }

  // Partial match (e.g. "Deep Maroon" -> "Maroon", "Classic Brown" -> "Brown")
  return COLOR_PRESETS.find(p => normName.includes(p.name.toLowerCase()));
}

/**
 * Get the standardized hex color for a given color name.
 */
export function getColorHex(name: string, fallback = '#111111'): string {
  const clean = (name || '').trim().toLowerCase().replace(/[^a-z]/g, '');
  return COLOR_HEX_MAP[clean] || fallback;
}
