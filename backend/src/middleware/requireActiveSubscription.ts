import { Response, NextFunction } from "express";
import { AuthedRequest } from "./auth";
import School from "../models/School";

// Checked live, per request -- not baked into the JWT, since a trial can
// lapse mid-session while a token is still otherwise valid. 402 Payment
// Required is the semantically correct status here; the frontend watches
// for it specifically to redirect to Billing rather than show a generic error.
export async function requireActiveSubscription(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user!.schoolId) return next(); // superadmin isn't scoped to a school

  const school = await School.findById(req.user!.schoolId);
  if (!school) return res.status(404).json({ error: "School not found" });

  const now = Date.now();
  const trialActive = school.trialEndsAt.getTime() > now;
  const paidActive = !!school.subscriptionPaidUntil && school.subscriptionPaidUntil.getTime() > now;

  if (!trialActive && !paidActive) {
    return res.status(402).json({
      error: "Your school's free trial has ended. Please complete payment to continue.",
      accessBlocked: true
    });
  }

  next();
}