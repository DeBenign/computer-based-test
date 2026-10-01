import express from "express";
import cors from "cors";
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
import schoolRoutes from "./routes/schoolRoutes";
import gradingRoutes from "./routes/gradingRoutes"
import { requireAuth } from "./middleware/auth";
import { requireRole } from "./middleware/requireRole";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const v1 = express.Router();

v1.use("/auth", authRoutes);

v1.use("/superadmin/schools", requireAuth, requireRole("superadmin"), schoolRoutes);

v1.use("/admin/classes", requireAuth, requireRole("admin"), classRoutes);
v1.use("/admin/subjects", requireAuth, requireRole("admin"), subjectRoutes);
v1.use("/admin/users", requireAuth, requireRole("admin"), userRoutes);
v1.use("/admin/questions", requireAuth, requireRole("admin"), adminQuestionRoutes);
v1.use("/admin/exams", requireAuth, requireRole("admin"), adminExamRoutes);

v1.use("/teacher/classes", requireAuth, requireRole("teacher"), classRoutes);
v1.use("/teacher/subjects", requireAuth, requireRole("teacher"), subjectRoutes);
v1.use("/teacher/questions", requireAuth, requireRole("teacher"), questionRoutes);
v1.use("/teacher/exams", requireAuth, requireRole("teacher"), examRoutes);
v1.use("/teacher/results", requireAuth, requireRole("teacher"), resultRoutes);
v1.use("/teacher/grading", requireAuth, requireRole("teacher"), gradingRoutes);

v1.use("/student/exams", requireAuth, requireRole("student"), examRoutes);
v1.use("/student/attempts", requireAuth, requireRole("student"), attemptRoutes);
v1.use("/student/results", requireAuth, requireRole("student"), resultRoutes);

app.use("/api/v1", v1);
app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

export default app;