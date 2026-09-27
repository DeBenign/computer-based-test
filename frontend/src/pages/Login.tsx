import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import PageShell from "../components/PageShell";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
        login(res.data.token, res.data.user);
        const role = res.data.user.role;
        if (role === "superadmin") navigate(`/${role}/schools`);
        else navigate(role === "student" ? `/${role}/exams` : `/${role}/questions`);    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't log in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell maxWidth={380}>
      <Card>
        <h2 style={{ textAlign: "center", marginBottom: 4 }}>Sign in</h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
          De-Benign School CBT
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@school.com"
              required
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          {error && <p style={{ color: "var(--text-danger)", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <PrimaryButton type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </form>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 16, marginBottom: 0 }}>
          Don't have an account? Ask your school admin to set one up for you.
        </p>
      </Card>
    </PageShell>
  );
}