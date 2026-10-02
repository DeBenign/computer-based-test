import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../middleware/asyncHandler";
import { getBillingStatus } from "../controllers/schoolController";

const router = Router();
router.use(requireAuth, requireRole("admin"));
router.get("/status", asyncHandler(getBillingStatus));

export default router;