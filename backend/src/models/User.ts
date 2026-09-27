import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "admin" | "teacher" | "student";

export interface IUser extends Document {
  schoolId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  classId?: Types.ObjectId; // for students
  subjectIds?: Types.ObjectId[]; // for teachers
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "teacher", "student"], required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class" },
  subjectIds: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  createdAt: { type: Date, default: Date.now }
});

export default model<IUser>("User", userSchema);
