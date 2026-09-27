import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthedRequest } from "../middleware/auth";

// Only a logged-in admin can call this (see authRoutes.ts). schoolId always
// comes from the admin's own token, never from the request body, so an
// admin can only ever create users inside their own school.
export async function register(req: AuthedRequest, res: Response) {
  try {
    const { name, email, password, role, classId, subjectIds } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      schoolId: req.user!.schoolId,
      name,
      email,
      passwordHash,
      role,
      classId,
      subjectIds
    });

    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return res.status(500).json({ error: "Registration failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, schoolId: user.schoolId, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" } as jwt.SignOptions
    );

    return res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
}