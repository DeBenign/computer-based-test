import { Response, Request } from "express";
import { AuthedRequest } from "../middleware/auth";
import School from "../models/School";
import { createCheckoutOrder } from "../services/nombaClient";
import { applyPayment } from "../services/paymentService";
import { verifyNombaSignature } from "../utils/verifyNombaWebhook";

const PRICE_PER_MONTH_NGN = 15000; // PLACEHOLDER -- replace with your real termly price

// Admin: starts a Nomba checkout for their own school.
export async function initiatePayment(req: AuthedRequest, res: Response) {
  const { periodMonths, email } = req.body;
  if (!periodMonths || periodMonths <= 0) {
    return res.status(400).json({ error: "periodMonths is required" });
  }

  const school = await School.findById(req.user!.schoolId);
  if (!school) return res.status(404).json({ error: "School not found" });

  const amount = PRICE_PER_MONTH_NGN * periodMonths;
  const orderReference = `school-${school._id}-${Date.now()}`;

  try {
    const { checkoutLink } = await createCheckoutOrder({
      amountNaira: amount,
      orderReference,
      callbackUrl: `${process.env.FRONTEND_URL}/admin/billing`,
      customerEmail: email || "billing@debenign.school",
      customerId: school._id.toString()
    });
    res.json({ checkoutLink, orderReference, amount, periodMonths });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Couldn't start payment with Nomba" });
  }
}

// Public -- called by Nomba's servers, not a logged-in user. The HMAC
// signature is what proves the request genuinely came from Nomba.
export async function handleNombaWebhook(req: Request, res: Response) {
  const signature = req.headers["nomba-signature"] as string | undefined;
  const rawBody = (req as any).rawBody as string;

  if (!verifyNombaSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = req.body;
  if (payload.event_type !== "payment_success") {
    return res.status(200).json({ received: true });
  }

  const order = payload.data?.order;
  const schoolId = order?.customerId;
  const reference = order?.orderReference;
  const amount = order?.amount;

  if (!schoolId || !reference) {
    return res.status(400).json({ error: "Missing customerId or orderReference in webhook payload" });
  }

  // periodMonths isn't part of Nomba's payload -- recover it from the
  // amount using the same price-per-month constant used to create the order.
  const periodMonths = Math.max(1, Math.round(amount / PRICE_PER_MONTH_NGN));

  try {
    await applyPayment({ schoolId, amount, reference, periodMonths, method: "nomba" });
    res.status(200).json({ received: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}