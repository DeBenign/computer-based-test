import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion
} from "../controllers/questionController";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listQuestions));
router.post("/", requireRole("teacher", "admin"), asyncHandler(createQuestion));
router.put("/:id", requireRole("teacher", "admin"), asyncHandler(updateQuestion));
router.delete("/:id", requireRole("teacher", "admin"), asyncHandler(deleteQuestion));

export default router;