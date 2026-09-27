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