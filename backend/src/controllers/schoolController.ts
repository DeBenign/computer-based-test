import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthedRequest } from "../middleware/auth";
import School from "../models/School";
import User from "../models/User";
import Payment from "../models/Payment";
import { applyPayment } from "../services/paymentService";

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

  const school = await School.findById(req.params.id);
  if (!school) return res.status(404).json({ error: "School not found" });

  const existingRef = await Payment.findOne({ reference });
  if (existingRef) return res.status(409).json({ error: "A payment with this reference already exists" });

  const base = school.subscriptionPaidUntil && school.subscriptionPaidUntil.getTime() > Date.now()
    ? school.subscriptionPaidUntil
    : new Date();
  const paidUntil = new Date(base.getTime() + periodMonths * 30 * 24 * 60 * 60 * 1000);

  await Payment.create({
    schoolId: school._id,
    amount,
    reference,
    method: "manual",
    periodMonths,
    confirmedBy: req.user!.userId
  });

  school.subscriptionPaidUntil = paidUntil;
  school.subscriptionStatus = "active";
  await school.save();

  res.json({ message: "Payment recorded", subscriptionPaidUntil: paidUntil });
}

// Admin: their own school's trial/subscription status + payment history.
export async function getBillingStatus(req: AuthedRequest, res: Response) {
  const school = await School.findById(req.user!.schoolId);
  if (!school) return res.status(404).json({ error: "School not found" });

  const payments = await Payment.find({ schoolId: school._id }).sort({ confirmedAt: -1 });
  const now = Date.now();
  const trialDaysLeft = Math.max(0, Math.ceil((school.trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000)));
  const isPaidActive = !!school.subscriptionPaidUntil && school.subscriptionPaidUntil.getTime() > now;
  const isTrialActive = school.trialEndsAt.getTime() > now;

  res.json({
    subscriptionStatus: school.subscriptionStatus,
    trialEndsAt: school.trialEndsAt,
    trialDaysLeft,
    isTrialActive,
    subscriptionPaidUntil: school.subscriptionPaidUntil,
    isPaidActive,
    accessBlocked: !isTrialActive && !isPaidActive,
    payments: payments.map((p) => ({
      amount: p.amount,
      reference: p.reference,
      periodMonths: p.periodMonths,
      confirmedAt: p.confirmedAt
    }))
  });
}