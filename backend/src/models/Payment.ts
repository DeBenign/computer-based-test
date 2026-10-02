    import { Schema, model, Document, Types } from "mongoose";

export interface IPayment extends Document {
  schoolId: Types.ObjectId;
  amount: number;
  reference: string;
  method: "nomba" | "manual";
  periodMonths: number;
  confirmedBy?: Types.ObjectId;
  confirmedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  amount: { type: Number, required: true },
  reference: { type: String, required: true, unique: true },
  method: { type: String, enum: ["nomba", "manual"], required: true },
  periodMonths: { type: Number, required: true },
  confirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
  confirmedAt: { type: Date, default: Date.now }
});

export default model<IPayment>("Payment", paymentSchema);