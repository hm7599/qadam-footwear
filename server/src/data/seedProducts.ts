export interface ProductItemSpec {
  weight: string;
  cushioning: string;
  upperMaterial: string;
  soleMaterial: string;
  heelDrop: string;
  fit: string;
  innerLining?: string;
  innerSock?: string;
}

export interface ColorVariant {
  name: string;
  hex: string;
  previewImage: string;
  modelTint: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
}

// Aliases so older names keep working after the rename
export type ProductSpec = ProductItemSpec;

export interface Product {
  _id: string;
  id: string;
  name: string;
  slug: string;
  tagline: string;
  brand: string;
  price: number;
  salePrice?: number;
  category: 'casuals' | 'formals' | 'sandals' | 'slides' | 'chelsea-boots' | 'running' | 'lifestyle' | 'basketball' | 'luxury-minimal';
  gender: 'men' | 'women' | 'unisex';
  description: string;
  specs: ProductSpec;
  colors: ColorVariant[];
  sizes: number[];
  stock: number;
  images: string[];
  model3DUrl?: string;
  rating: number;
  reviewCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isLimitedEdition: boolean;
  isAtelierFeatured?: boolean;
  edition?: string;
  reviews: ReviewItem[];
  createdAt?: string;
}
export type ProductItem = Product;

// Demo/seed products removed permanently. The store only contains real products
// added by the admin. Never add hardcoded products here.
export const SEED_PRODUCTS: ProductItem[] = [];

// Identifiers (ids + slugs) of the old demo products, kept only so they can be
// purged from the database and local data files on every boot and never return.
const LEGACY_KEYS_BASE = [
  'prod-aura-artisan-sandal',
  'prod-aura-driving-casual',
  'prod-aura-heritage-derby',
  'prod-aura-horsebit-loafer',
  'prod-aura-luxury-slides',
  'prod-aura-monkstrap-chestnut',
  'prod-aura-noir-chelsea',
  'prod-aura-patina-wholecut',
  'prod-aura-phantom-01',
  'prod-aura-single-monk',
  'prod-aura-sovereign-loafer',
  'prod-aura-tuscan-chelsea',
  'prod-qadam-bos-0032-two-tone',
  'qadam-artisan-leather-sandal',
  'qadam-bos-0032-two-tone',
  'qadam-cognac-leather-driving-casual',
  'qadam-florentine-double-monkstrap',
  'qadam-heritage-casual-derby-tan',
  'qadam-horsebit-loafer',
  'qadam-noir-chelsea',
  'qadam-patina-wholecut-oxford',
  'qadam-phantom-01',
  'qadam-riviera-woven-leather-slide',
  'qadam-single-monk',
  'qadam-sovereign-venetian-loafer',
  'qadam-tuscan-chelsea-sovereign',
];

// Include aura-/qadam- prefix variants (old builds swapped these prefixes)
export const LEGACY_SEED_KEYS: string[] = Array.from(new Set(
  LEGACY_KEYS_BASE.flatMap(k => [
    k,
    k.replace(/^qadam-/, 'aura-'),
    k.replace(/^aura-/, 'qadam-'),
    k.replace(/^prod-aura-/, 'prod-qadam-'),
    k.replace(/^prod-qadam-/, 'prod-aura-'),
  ])
));

export function isLegacySeedProduct(p: { id?: string; slug?: string; _id?: any }): boolean {
  return LEGACY_SEED_KEYS.includes(String(p?.id || '')) ||
    LEGACY_SEED_KEYS.includes(String(p?.slug || '')) ||
    LEGACY_SEED_KEYS.includes(String(p?._id || ''));
}
