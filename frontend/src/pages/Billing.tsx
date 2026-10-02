import { useEffect, useState } from "react";
import api from "../services/api";
import Card from "../components/Card";
import Badge from "../components/Badge";
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

export default function Billing() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/billing/status")
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load billing status."));
  }, []);

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
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Contact De-Benign to arrange payment — once confirmed, access reopens immediately, no action
              needed on your end.
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
              Trial ends <strong>{new Date(status.trialEndsAt).toLocaleDateString()}</strong>. No action needed
              until then — we'll be in touch about continuing afterward.
            </p>
          </>
        )}
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