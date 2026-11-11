export interface ProductSpec {
  weight: string;
  cushioning: string;
  upperMaterial: string;
  soleMaterial: string;
  heelDrop: string;
  fit: string;
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
  sizeStock?: Record<string, number>; // units left per size; missing = not tracked
  images: string[];
  model3DUrl?: string;
  rating: number;
  reviewCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isLimitedEdition: boolean;
  status?: 'draft' | 'live';
  reviews: ReviewItem[];
  createdAt?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  color: string;
  size: number;
  quantity: number;
  image: string;
  maxStock: number;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface OrderStatusHistory {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  timestamp: string;
  note?: string;
}

export interface Order {
  _id?: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  shippingMethod: string;
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'cod';
  paymentStatus: 'paid' | 'pending' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  trackingCarrier?: string;
  source?: "website" | "whatsapp" | "other";
  adminNote?: string;
  statusHistory: OrderStatusHistory[];
  estimatedDeliveryDate?: string;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  shippingAddress?: {
    address: string;
    apartment?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  wishlist?: string[];
  createdAt?: string;
}

export interface NotificationLog {
  _id: string;
  title: string;
  body: string;
  url: string;
  targetAudience: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  sentBy: string;
  createdAt: string;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalSubscribers: number;
  totalCustomers: number;
  avgOrderValue: number;
  lowStockProducts: Product[];
  recentOrders: Order[];
  revenueTrend: Array<{ month: string; revenue: number; orders: number }>;
}
