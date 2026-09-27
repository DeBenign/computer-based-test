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
  adminCount: number;
}

export default function SchoolManagement() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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
            <input placeholder="Admin password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required style={{ flex: 1 }} />
          </div>
          {error && <p style={{ color: "var(--text-danger)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <PrimaryButton type="submit">Create school + admin</PrimaryButton>
        </form>
      </Card>

      <h3>All schools ({schools.length})</h3>
      {schools.map((s) => (
        <Card key={s.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 500 }}>{s.name}</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {s.address || "No address"} · {s.adminCount} admin{s.adminCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button onClick={() => handleToggleActive(s.id, s.isActive)}>
              {s.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </Card>
      ))}
    </PageShell>
  );
}