export interface ProductSpec {
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
  status?: 'draft' | 'live';
  reviews: ReviewItem[];
  createdAt?: string;
}

// Demo/dummy products removed permanently — the website shows only real products
// added by the admin (loaded from the API/MongoDB). Never add hardcoded products here.
export const INITIAL_PRODUCTS: Product[] = [];
