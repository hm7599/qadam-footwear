import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationSubscriber extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  userId?: string;
  topics?: string[];
  orderNumbers?: string[]; // orders placed from this device (for order status alerts)
  createdAt: Date;
}

const NotificationSubscriberSchema: Schema = new Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    userAgent: { type: String },
    userId: { type: String },
    topics: [{ type: String, default: 'all' }],
    orderNumbers: [{ type: String }]
  },
  { timestamps: true }
);

export const NotificationSubscriber = mongoose.model<INotificationSubscriber>(
  'NotificationSubscriber',
  NotificationSubscriberSchema
);
