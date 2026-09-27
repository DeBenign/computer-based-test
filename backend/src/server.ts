import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import questionRoutes from "./routes/questionRoutes";
import examRoutes from "./routes/examRoutes";
import attemptRoutes from "./routes/attemptRoutes";
import resultRoutes from "./routes/resultRoutes";
import userRoutes from "./routes/userRoutes";
import subjectRoutes from "./routes/subjectRoutes";
import classRoutes from "./routes/classRoutes";
import adminQuestionRoutes from "./routes/adminQuestionRoutes"; 
import adminExamRoutes from "./routes/adminExamRoutes";         
import { requireRole } from "./middleware/requireRole";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const v1 = express.Router();

v1.use("/auth", authRoutes);

// Admin: setup, account management, read-only oversight
v1.use("/admin/classes", requireRole("admin"), classRoutes);
v1.use("/admin/subjects", requireRole("admin"), subjectRoutes);
v1.use("/admin/users", requireRole("admin"), userRoutes);
v1.use("/admin/questions", requireRole("admin"), adminQuestionRoutes);
v1.use("/admin/exams", requireRole("admin"), adminExamRoutes);

// Teacher: also needs to read classes/subjects to build exams against them
v1.use("/teacher/classes", requireRole("teacher"), classRoutes);
v1.use("/teacher/subjects", requireRole("teacher"), subjectRoutes);
v1.use("/teacher/questions", requireRole("teacher"), questionRoutes);
v1.use("/teacher/exams", requireRole("teacher"), examRoutes);
v1.use("/teacher/results", requireRole("teacher"), resultRoutes);

// Student: taking exams, own results
v1.use("/student/exams", requireRole("student"), examRoutes);
v1.use("/student/attempts", requireRole("student"), attemptRoutes);
v1.use("/student/results", requireRole("student"), resultRoutes);

app.use("/api/v1", v1);
app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

const PORT = process.env.PORT || 5050;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`CBT backend running on port ${PORT}`)))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });