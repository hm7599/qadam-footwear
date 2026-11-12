import mongoose, { Schema, Document } from 'mongoose';

export interface IUploadedImage extends Document {
  fileName: string;
  contentType: string;
  data: Buffer;
  size: number;
  createdAt: Date;
}

const uploadedImageSchema = new Schema<IUploadedImage>({
  fileName: { type: String, required: true, unique: true, index: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
  size: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const UploadedImage =
  (mongoose.models.UploadedImage as mongoose.Model<IUploadedImage>) ||
  mongoose.model<IUploadedImage>('UploadedImage', uploadedImageSchema);
