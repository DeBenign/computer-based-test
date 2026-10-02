import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthedRequest } from "../middleware/auth";
import User from "../models/User";

export async function listUsers(req: AuthedRequest, res: Response) {
  const { role } = req.query;
  const filter: Record<string, unknown> = { schoolId: req.user!.schoolId };
  if (role) filter.role = role;

  const users = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
}

export async function deleteUser(req: AuthedRequest, res: Response) {
  const user = await User.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.role === "admin") {
    return res.status(400).json({ error: "Admin accounts can't be deleted here" });
  }
  await user.deleteOne();
  res.status(204).send();
}

// Admin resets a teacher/student's password to a new temporary one, the
// same way account creation already works -- admin types it, shares it
// directly. Admin passwords are excluded here on purpose: resetting your
// own colleague's login without their knowledge is a different trust
// situation than resetting a student's, so an admin uses changeOwnPassword
// (in authController) for their own account instead.
export async function resetUserPassword(req: AuthedRequest, res: Response) {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "New password must be at least 4 characters." });
  }

  const user = await User.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.role === "admin") {
    return res.status(400).json({ error: "Admin passwords can't be reset here." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: `Password reset for ${user.email}.` });
}