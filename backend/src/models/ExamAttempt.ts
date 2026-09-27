import { Schema, model, Document, Types } from "mongoose";

export type AttemptStatus = "in-progress" | "submitted" | "auto-submitted" | "flagged" | "pending-submit";

export interface IAnswer {
  questionId: Types.ObjectId;
  selectedOption?: string;
  answerText?: string;
  clientTimestamp: number;
  serverReceivedAt?: Date;
}

export interface IFlaggedEvent {
  type: "tab-switch" | "window-blur" | "fullscreen-exit" | "disconnect" | "blocked-shortcut";
  timestamp: number;
  meta?: string;
}

export interface IExamAttempt extends Document {
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  questionOrder: Types.ObjectId[]; // frozen at start, for randomization consistency
  startedAt: Date;
  serverEndTime: Date; // authoritative deadline
  submittedAt?: Date;
  status: AttemptStatus;
  answers: IAnswer[];
  flaggedEvents: IFlaggedEvent[];
  score?: number;
  gradedBy?: Types.ObjectId; // for theory questions, phase 2
}

const answerSchema = new Schema<IAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOption: String,
    answerText: String,
    clientTimestamp: { type: Number, required: true },
    serverReceivedAt: Date
  },
  { _id: false }
);

const flaggedEventSchema = new Schema<IFlaggedEvent>(
  {
    type: { type: String, required: true },
    timestamp: { type: Number, required: true },
    meta: String
  },
  { _id: false }
);

const examAttemptSchema = new Schema<IExamAttempt>({
  examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  questionOrder: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  startedAt: { type: Date, required: true },
  serverEndTime: { type: Date, required: true },
  submittedAt: Date,
  status: {
    type: String,
    enum: ["in-progress", "submitted", "auto-submitted", "flagged", "pending-submit"],
    default: "in-progress"
  },
  answers: [answerSchema],
  flaggedEvents: [flaggedEventSchema],
  score: Number,
  gradedBy: { type: Schema.Types.ObjectId, ref: "User" }
});

export default model<IExamAttempt>("ExamAttempt", examAttemptSchema);
