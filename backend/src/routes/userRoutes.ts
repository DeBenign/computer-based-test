import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../middleware/asyncHandler";
import { listUsers } from "../controllers/userController";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(listUsers));

export default router;