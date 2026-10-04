import { useEffect, useState, FormEvent } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Badge from "../components/Badge";
import PrimaryButton from "../components/PrimaryButton";
import PageShell from "../components/PageShell";
import Spinner from "../components/Spinner";

interface PaymentRow {
  amount: number;
  reference: string;
  periodMonths: number;
  confirmedAt: string;
}

interface BillingStatus {
  subscriptionStatus: string;
  trialEndsAt: string;
  trialDaysLeft: number;
  isTrialActive: boolean;
  subscriptionPaidUntil?: string;
  isPaidActive: boolean;
  accessBlocked: boolean;
  payments: PaymentRow[];
}

const PRICE_PER_MONTH_NGN = 5000; // keep in sync with the backend placeholder in nombaController.ts

export default function Billing() {
  const { user } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [periodMonths, setPeriodMonths] = useState(3);
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api
      .get("/billing/status")
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load billing status."));
  }, []);

  async function handlePay(e: FormEvent) {
    e.preventDefault();
    setPayError(null);
    setPaying(true);
    try {
      const res = await api.post("/billing/pay", { periodMonths, email: user?.name ? undefined : undefined });
      window.location.href = res.data.checkoutLink;
    } catch (err: any) {
      setPayError(err.response?.data?.error || "Couldn't start payment. Please try again.");
      setPaying(false);
    }
  }

  if (error) {
    return (
      <PageShell maxWidth={480}>
        <h1>Billing</h1>
        <p style={{ color: "var(--text-danger)" }}>{error}</p>
      </PageShell>
    );
  }

  if (!status) {
    return (
      <PageShell maxWidth={480}>
        <h1>Billing</h1>
        <p style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}><Spinner />Loading…</p>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth={480}>
      <h1>Billing</h1>

      <Card style={{ marginBottom: 20 }}>
        {status.accessBlocked ? (
          <>
            <Badge tone="danger">Access locked</Badge>
            <p style={{ marginTop: 10 }}>
              Your school's free trial ended and no payment is on file. Setup, Users, Questions, and Exams are
              locked for your account until payment is confirmed. Your students can still use exams already
              scheduled.
            </p>
          </>
        ) : status.isPaidActive ? (
          <>
            <Badge tone="success">Active subscription</Badge>
            <p style={{ marginTop: 10, marginBottom: 0 }}>
              Paid through <strong>{new Date(status.subscriptionPaidUntil!).toLocaleDateString()}</strong>.
            </p>
          </>
        ) : (
          <>
            <Badge tone="warning">Free trial — {status.trialDaysLeft} day{status.trialDaysLeft === 1 ? "" : "s"} left</Badge>
            <p style={{ marginTop: 10, marginBottom: 0 }}>
              Trial ends <strong>{new Date(status.trialEndsAt).toLocaleDateString()}</strong>.
            </p>
          </>
        )}
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h3>Pay with Nomba</h3>
        <form onSubmit={handlePay}>
          <div style={{ marginBottom: 12 }}>
            <label>Number of months</label>
            <select value={periodMonths} onChange={(e) => setPeriodMonths(Number(e.target.value))} style={{ width: "100%" }}>
              <option value={1}>1 month — ₦{PRICE_PER_MONTH_NGN.toLocaleString()}</option>
              <option value={3}>3 months (1 term) — ₦{(PRICE_PER_MONTH_NGN * 3).toLocaleString()}</option>
              <option value={12}>12 months — ₦{(PRICE_PER_MONTH_NGN * 12).toLocaleString()}</option>
            </select>
          </div>
          {payError && <p style={{ color: "var(--text-danger)", fontSize: 13, marginBottom: 10 }}>{payError}</p>}
          <PrimaryButton type="submit" disabled={paying} style={{ width: "100%" }}>
            {paying ? "Redirecting to Nomba…" : "Pay now"}
          </PrimaryButton>
        </form>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10, marginBottom: 0 }}>
          You'll be taken to Nomba's secure checkout. Your access updates automatically once payment is confirmed —
          no need to come back and refresh manually.
        </p>
      </Card>

      <h3>Payment history</h3>
      {status.payments.length === 0 && (
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No payments recorded yet.</p>
      )}
      {status.payments.map((p) => (
        <Card key={p.reference} style={{ marginBottom: 8 }}>
          <p style={{ fontWeight: 500, marginBottom: 2 }}>₦{p.amount.toLocaleString()}</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 0 }}>
            {p.periodMonths} month{p.periodMonths === 1 ? "" : "s"} · ref {p.reference} ·{" "}
            {new Date(p.confirmedAt).toLocaleDateString()}
          </p>
        </Card>
      ))}
    </PageShell>
  );
}