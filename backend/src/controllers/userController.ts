import { Response } from "express";
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