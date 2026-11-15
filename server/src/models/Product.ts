import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
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
  specs: {
    weight: string;
    cushioning: string;
    upperMaterial: string;
    soleMaterial: string;
    heelDrop: string;
    fit: string;
  };
  colors: Array<{
    name: string;
    hex: string;
    previewImage: string;
    modelTint: string;
  }>;
  sizes: number[];
  stock: number;
  sizeStock?: Record<string, number>;
  images: string[];
  model3DUrl?: string;
  rating: number;
  reviewCount: number;
  wishlistCount?: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isLimitedEdition: boolean;
  edition?: string;
  status?: 'draft' | 'live';
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    date: string;
    title: string;
    comment: string;
    verified: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    tagline: { type: String, default: '' },
    brand: { type: String, default: 'QADAM' },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    category: {
      type: String,
      default: 'formals'
    },
    gender: {
      type: String,
      default: 'men'
    },
    description: { type: String, default: '' },
    specs: {
      weight: { type: String, default: '' },
      cushioning: { type: String, default: '' },
      upperMaterial: { type: String, default: '' },
      soleMaterial: { type: String, default: '' },
      heelDrop: { type: String, default: '' },
      fit: { type: String, default: 'True to size' }
    },
    colors: [
      {
        name: { type: String, default: 'Black' },
        hex: { type: String, default: '#111111' },
        previewImage: { type: String, default: '' },
        modelTint: { type: String, default: '#FFFFFF' }
      }
    ],
    sizes: [{ type: Number }],
    stock: { type: Number, default: 20 },
    // Units left per size, e.g. { "42": 3, "43": 0 }. Missing = not tracked (treated as in stock).
    // Plain object (not a Map): Map keys may not contain "." and half sizes like "7.5" need it
    sizeStock: { type: Schema.Types.Mixed },
    images: [{ type: String }],
    model3DUrl: { type: String },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    // How many shoppers currently have this in their wishlist (+1 on heart, -1 on un-heart)
    wishlistCount: { type: Number, default: 0 },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isLimitedEdition: { type: Boolean, default: false },
    edition: { type: String, default: '' },
    // draft = hidden from the shop until the admin publishes it
    status: { type: String, enum: ['draft', 'live'], default: 'live' },
    reviews: [
      {
        id: { type: String },
        author: { type: String },
        rating: { type: Number },
        date: { type: String },
        title: { type: String },
        comment: { type: String },
        verified: { type: Boolean, default: true }
      }
    ]
  },
  {
    timestamps: true,
    // Frontend keys products by `id` (wishlist, cart, compare) — always send one
    toJSON: { virtuals: true, versionKey: false, transform: (_d: any, r: any) => { r.id = String(r.id || r._id); return r; } },
    toObject: { virtuals: true },
  }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
