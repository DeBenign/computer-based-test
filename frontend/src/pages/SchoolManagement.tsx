import { useEffect, useState, FormEvent } from "react";
import api from "../services/api";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import PageShell from "../components/PageShell";

interface SchoolRow {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  adminCount: number;
  admins: { name: string; email: string }[];
}

export default function SchoolManagement() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadSchools() {
    const res = await api.get("/schools");
    setSchools(res.data);
  }

  useEffect(() => {
    loadSchools();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!schoolName || !adminName || !adminEmail || !adminPassword) {
      setError("Fill in every field before creating a school.");
      return;
    }
    try {
      await api.post("/schools", { schoolName, address, adminName, adminEmail, adminPassword });
      setSchoolName("");
      setAddress("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      await loadSchools();
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't create the school.");
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await api.put(`/schools/${id}/active`, { isActive: !isActive });
    await loadSchools();
  }

  return (
    <PageShell maxWidth={720}>
      <h1>Schools</h1>

      <Card style={{ marginBottom: 24 }}>
        <h3>Onboard a new school</h3>
        <form onSubmit={handleCreate}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input placeholder="School name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required style={{ flex: 1 }} />
            <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} style={{ flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input placeholder="Admin name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required style={{ flex: 1 }} />
            <input placeholder="Admin email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 6, flex: 1 }}>
              <input
                placeholder="Admin password"
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                style={{ width: "100%" }}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ padding: "0 10px", fontSize: 12 }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && <p style={{ color: "var(--text-danger)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <PrimaryButton type="submit">Create school + admin</PrimaryButton>
        </form>
      </Card>

      <h3>All schools ({schools.length})</h3>
      {schools.map((s) => {
        const isExpanded = expandedId === s.id;
        return (
          <Card key={s.id} style={{ marginBottom: 10 }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
            >
              <div>
                <p style={{ fontWeight: 500 }}>{s.name}</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {s.address || "No address"} · {s.adminCount} admin{s.adminCount !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActive(s.id, s.isActive);
                }}
              >
                {s.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>
                <p>Created: {new Date(s.createdAt).toLocaleString()}</p>
                <p style={{ marginTop: 6 }}>Admins:</p>
                {s.admins.length === 0 && <p>None</p>}
                {s.admins.map((a) => (
                  <p key={a.email}>{a.name} — {a.email}</p>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </PageShell>
  );
}