import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthedRequest } from "../middleware/auth";
import School from "../models/School";
import User from "../models/User";

// Not exposed to regular admins -- run behind a super-admin check or as an
// internal-only route until a proper super-admin dashboard exists.
export async function createSchool(req: AuthedRequest, res: Response) {
  const { schoolName, address, adminName, adminEmail, adminPassword } = req.body;

  const school = await School.create({ name: schoolName, address });

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await User.create({
    schoolId: school._id,
    name: adminName,
    email: adminEmail,
    passwordHash,
    role: "admin"
  });

  res.status(201).json({
    school: { id: school._id, name: school.name },
    admin: { id: admin._id, email: admin.email }
  });
}