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
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Must be registered after all routes -- this is what turns errors like a
// bad ObjectId or a failed validation into a clean JSON response instead
// of crashing the process.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`CBT backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });