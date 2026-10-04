import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthedRequest } from "../middleware/auth";
import School from "../models/School";
import User from "../models/User";
import Payment from "../models/Payment";
import { applyPayment } from "../services/paymentService";
import { ensureTrialDates, getAccessStatus } from "../utils/schoolAccess";

const TRIAL_DAYS = 90; // ~one term -- change this one line if your terms run differently

export async function createSchool(req: AuthedRequest, res: Response) {
  try {
    const { schoolName, address, adminName, adminEmail, adminPassword } = req.body;

    const existingSchool = await School.findOne({ name: schoolName });
    if (existingSchool) return res.status(409).json({ error: "A school with this name already exists" });

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) return res.status(409).json({ error: "Email already registered" });

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const school = await School.create({ name: schoolName, address, trialEndsAt });

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await User.create({
      schoolId: school._id,
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin"
    });

    return res.status(201).json({
      school: { id: school._id, name: school.name, address: school.address, isActive: school.isActive, trialEndsAt: school.trialEndsAt },
      admin: { id: admin._id, name: admin.name, email: admin.email }
    });
  } catch (err) {
    return res.status(500).json({ error: "Couldn't create school" });
  }
}

export async function listSchools(_req: AuthedRequest, res: Response) {
  const schools = await School.find().sort({ createdAt: -1 });
  const withDetails = await Promise.all(
    schools.map(async (s) => {
      const admins = await User.find({ schoolId: s._id, role: "admin" }).select("name email");
      return {
        id: s._id,
        name: s.name,
        address: s.address,
        isActive: s.isActive,
        createdAt: s.createdAt,
        trialEndsAt: s.trialEndsAt,
        subscriptionStatus: s.subscriptionStatus,
        subscriptionPaidUntil: s.subscriptionPaidUntil,
        adminCount: admins.length,
        admins: admins.map((a) => ({ name: a.name, email: a.email }))
      };
    })
  );
  res.json(withDetails);
}

export async function setSchoolActive(req: AuthedRequest, res: Response) {
  const { isActive } = req.body;
  const school = await School.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!school) return res.status(404).json({ error: "School not found" });
  res.json(school);
}

// Superadmin confirms a payment was received -- manual today. This is
// exactly where a Nomba webhook calls in once its API is wired up: same
// function, same effect, just triggered automatically instead of by hand.
export async function recordPayment(req: AuthedRequest, res: Response) {
  const { amount, reference, periodMonths } = req.body;
  if (!amount || !reference || !periodMonths) {
    return res.status(400).json({ error: "amount, reference, and periodMonths are required" });
  }
  try {
    const result = await applyPayment({
      schoolId: req.params.id,
      amount,
      reference,
      periodMonths,
      method: "manual",
      confirmedBy: req.user!.userId
    });
    if ("alreadyProcessed" in result) {
      return res.status(409).json({ error: "A payment with this reference already exists" });
    }
    res.json({ message: "Payment recorded", subscriptionPaidUntil: result.subscriptionPaidUntil });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

// Admin: their own school's trial/subscription status + payment history.
export async function getBillingStatus(req: AuthedRequest, res: Response) {
  const school = await School.findById(req.user!.schoolId);
  if (!school) return res.status(404).json({ error: "School not found" });

  await ensureTrialDates(school);
  const { trialActive, paidActive } = getAccessStatus(school);

  const payments = await Payment.find({ schoolId: school._id }).sort({ confirmedAt: -1 });
  const now = Date.now();
  const trialDaysLeft = Math.max(0, Math.ceil((school.trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000)));

  res.json({
    subscriptionStatus: school.subscriptionStatus,
    trialEndsAt: school.trialEndsAt,
    trialDaysLeft,
    isTrialActive: trialActive,
    subscriptionPaidUntil: school.subscriptionPaidUntil,
    isPaidActive: paidActive,
    accessBlocked: !trialActive && !paidActive,
    payments: payments.map((p) => ({
      amount: p.amount,
      reference: p.reference,
      periodMonths: p.periodMonths,
      confirmedAt: p.confirmedAt
    }))
  });
}