import School from "../models/School";
import Payment from "../models/Payment";

export async function applyPayment(params: {
  schoolId: string;
  amount: number;
  reference: string;
  periodMonths: number;
  method: "nomba" | "manual";
  confirmedBy?: string;
}): Promise<{ subscriptionPaidUntil: Date } | { alreadyProcessed: true }> {
  const existingRef = await Payment.findOne({ reference: params.reference });
  if (existingRef) return { alreadyProcessed: true };

  const school = await School.findById(params.schoolId);
  if (!school) throw new Error("School not found");

  const base = school.subscriptionPaidUntil && school.subscriptionPaidUntil.getTime() > Date.now()
    ? school.subscriptionPaidUntil
    : new Date();
  const paidUntil = new Date(base.getTime() + params.periodMonths * 30 * 24 * 60 * 60 * 1000);

  await Payment.create({
    schoolId: school._id,
    amount: params.amount,
    reference: params.reference,
    method: params.method,
    periodMonths: params.periodMonths,
    confirmedBy: params.confirmedBy
  });

  school.subscriptionPaidUntil = paidUntil;
  school.subscriptionStatus = "active";
  await school.save();

  return { subscriptionPaidUntil: paidUntil };
}