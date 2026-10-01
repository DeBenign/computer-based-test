import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../middleware/asyncHandler";
import { listUsers, deleteUser } from "../controllers/userController";


const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(listUsers));
router.delete("/:id", asyncHandler(deleteUser));

export default router;