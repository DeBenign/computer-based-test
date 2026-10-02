import { Schema, model, Document } from "mongoose";

export type SubscriptionStatus = "trial" | "active" | "expired";

export interface ISchool extends Document {
  name: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  trialEndsAt: Date;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPaidUntil?: Date;
}

const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  address: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  trialEndsAt: { type: Date, required: true },
  subscriptionStatus: { type: String, enum: ["trial", "active", "expired"], default: "trial" },
  subscriptionPaidUntil: Date
});

export default model<ISchool>("School", schoolSchema);