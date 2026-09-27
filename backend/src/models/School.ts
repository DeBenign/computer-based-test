import { Schema, model, Document } from "mongoose";

export interface ISchool extends Document {
  name: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
}

const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  address: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default model<ISchool>("School", schoolSchema);
