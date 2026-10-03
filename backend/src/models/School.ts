import { Schema, model, Document } from "mongoose";

export interface ISchoolBranding {
  logoUrl?: string;
  primaryColor?: string;
}

export interface ISchool extends Document {
  name: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  trialEndsAt: Date;
  subscriptionStatus: "trial" | "active" | "expired";
  subscriptionPaidUntil?: Date;
  branding: ISchoolBranding;
}

const schoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  address: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  trialEndsAt: { type: Date, required: true },
  subscriptionStatus: { type: String, enum: ["trial", "active", "expired"], default: "trial" },
  subscriptionPaidUntil: Date,
  branding: {
    logoUrl: String,
    primaryColor: String
  }
});

export default model<ISchool>("School", schoolSchema);