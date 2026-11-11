import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationLog extends Document {
  title: string;
  body: string;
  url: string;
  targetAudience: 'all' | 'men' | 'women' | 'vip';
  recipientCount: number;
  successCount: number;
  failureCount: number;
  sentBy?: string;
  createdAt: Date;
}

const NotificationLogSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    url: { type: String, default: '/' },
    targetAudience: { type: String, default: 'all' },
    recipientCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    sentBy: { type: String, default: 'Admin' }
  },
  { timestamps: true }
);

export const NotificationLog = mongoose.model<INotificationLog>(
  'NotificationLog',
  NotificationLogSchema
);
