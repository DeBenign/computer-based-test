import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthedRequest } from "../middleware/auth";
import School from "../models/School";
import User from "../models/User";

export async function createSchool(req: AuthedRequest, res: Response) {
  try {
    const { schoolName, address, adminName, adminEmail, adminPassword } = req.body;

    const existingSchool = await School.findOne({ name: schoolName });
    if (existingSchool) return res.status(409).json({ error: "A school with this name already exists" });

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) return res.status(409).json({ error: "Email already registered" });

    const school = await School.create({ name: schoolName, address });

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await User.create({
      schoolId: school._id,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin"
    });

    return res.status(201).json({
      school: { id: school._id, name: school.name, address: school.address, isActive: school.isActive },
      admin: { id: admin._id, name: admin.name, email: admin.email }
    });
  } catch (err) {
    return res.status(500).json({ error: "Couldn't create school" });
  }
}

export async function listSchools(_req: AuthedRequest, res: Response) {
  const schools = await School.find().sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    schools.map(async (s) => {
      const adminCount = await User.countDocuments({ schoolId: s._id, role: "admin" });
      return { id: s._id, name: s.name, address: s.address, isActive: s.isActive, adminCount };
    })
  );
  res.json(withCounts);
}

export async function setSchoolActive(req: AuthedRequest, res: Response) {
  const { isActive } = req.body;
  const school = await School.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!school) return res.status(404).json({ error: "School not found" });
  res.json(school);
}