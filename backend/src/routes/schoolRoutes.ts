import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../middleware/asyncHandler";
import { createSchool, listSchools, setSchoolActive } from "../controllers/schoolController";

const router = Router();
router.use(requireAuth);

router.get("/", requireRole("superadmin"), asyncHandler(listSchools));
router.post("/", requireRole("superadmin"), asyncHandler(createSchool));
router.put("/:id/active", requireRole("superadmin"), asyncHandler(setSchoolActive));

export default router;