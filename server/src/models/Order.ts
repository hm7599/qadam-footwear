import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  color: string;
  size: number;
  quantity: number;
  image: string;
}

export interface IOrderCustomer {
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

export interface IOrderStatusHistory {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: string;
  customer: IOrderCustomer;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  totalAmount: number;
  shippingMethod: string;
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'cod';
  paymentStatus: 'paid' | 'pending' | 'failed';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  source?: 'website' | 'whatsapp' | 'other';
  adminNote?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  statusHistory: IOrderStatusHistory[];
  estimatedDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      apartment: { type: String },
      city: { type: String, required: true },
      state: { type: String },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'United States' }
    },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        slug: { type: String },
        price: { type: Number, required: true },
        color: { type: String, required: true },
        size: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        image: { type: String, required: true }
      }
    ],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    accessKey: { type: String, select: true },
    totalAmount: { type: Number, required: true },
    shippingMethod: { type: String, default: 'Complimentary Express Courier' },
    paymentMethod: {
      type: String,
      enum: ['card', 'apple_pay', 'google_pay', 'cod'],
      default: 'card'
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'failed'],
      default: 'paid'
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    source: { type: String, enum: ['website', 'whatsapp', 'other'], default: 'website' },
    adminNote: { type: String },
    trackingNumber: { type: String },
    trackingCarrier: { type: String, default: '' },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String }
      }
    ],
    estimatedDeliveryDate: { type: Date }
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
