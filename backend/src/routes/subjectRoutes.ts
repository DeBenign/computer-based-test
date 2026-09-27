import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../middleware/asyncHandler";
import { createSubject, listSubjects, deleteSubject } from "../controllers/subjectController";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listSubjects));
router.post("/", requireRole("admin"), asyncHandler(createSubject));
router.delete("/:id", requireRole("admin"), asyncHandler(deleteSubject));

export default router;