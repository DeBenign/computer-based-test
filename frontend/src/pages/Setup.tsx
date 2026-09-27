import { useEffect, useState, FormEvent } from "react";
import api from "../services/api";
import { Subject, ClassRoom } from "../types";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import PageShell from "../components/PageShell";

function idSuffix(id: string) {
  return id.slice(-6);
}

function findDuplicateNames(items: { name: string }[]): Set<string> {
  const counts: Record<string, number> = {};
  for (const i of items) counts[i.name] = (counts[i.name] || 0) + 1;
  return new Set(Object.entries(counts).filter(([, c]) => c > 1).map(([n]) => n));
}

export default function Setup() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);

  const [subjectName, setSubjectName] = useState("");
  const [className, setClassName] = useState("");
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [subRes, classRes] = await Promise.all([api.get("/subjects"), api.get("/classes")]);
    setSubjects(subRes.data);
    setClasses(classRes.data);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddSubject(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/subjects", { name: subjectName });
      setSubjectName("");
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't add the subject.");
    }
  }

  async function handleAddClass(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/classes", { name: className, academicYear });
      setClassName("");
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't add the class.");
    }
  }

  async function handleDeleteClass(id: string) {
    setError(null);
    try {
      await api.delete(`/classes/${id}`);
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't delete the class.");
    }
  }

  async function handleDeleteSubject(id: string) {
    setError(null);
    try {
      await api.delete(`/subjects/${id}`);
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't delete the subject.");
    }
  }

  const duplicateClassNames = findDuplicateNames(classes);
  const duplicateSubjectNames = findDuplicateNames(subjects);

  return (
    <PageShell maxWidth={640}>
      <h1>Setup</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
        Create your classes and subjects here first — question banks, exams, and student accounts
        all pick from these instead of needing a raw ID. Each one shown below includes its ID suffix,
        so two entries with the same name (e.g. two "JSS2A"s) are still tellable apart.
      </p>

      {error && <p style={{ color: "var(--text-danger)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <Card style={{ marginBottom: 20 }}>
        <h3>Classes</h3>
        <form onSubmit={handleAddClass} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <input
            placeholder="e.g. JSS2A"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <input
            placeholder="Academic year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            required
            style={{ width: 140 }}
          />
          <PrimaryButton type="submit">Add</PrimaryButton>
        </form>
        {classes.length === 0 && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>No classes yet.</p>}
        {classes.map((c) => (
          <div
            key={c._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 14,
              padding: "6px 0",
              borderBottom: "0.5px solid var(--border)"
            }}
          >
            <span style={{ color: duplicateClassNames.has(c.name) ? "var(--text-danger)" : "inherit" }}>
              {c.name} <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>· {c.academicYear} · id:{idSuffix(c._id)}</span>
            </span>
            <button type="button" onClick={() => handleDeleteClass(c._id)} style={{ padding: "3px 10px", fontSize: 12 }}>
              Delete
            </button>
          </div>
        ))}
      </Card>

      <Card>
        <h3>Subjects</h3>
        <form onSubmit={handleAddSubject} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <input
            placeholder="e.g. Basic Science"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <PrimaryButton type="submit">Add</PrimaryButton>
        </form>
        {subjects.length === 0 && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>No subjects yet.</p>}
        {subjects.map((s) => (
          <div
            key={s._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 14,
              padding: "6px 0",
              borderBottom: "0.5px solid var(--border)"
            }}
          >
            <span style={{ color: duplicateSubjectNames.has(s.name) ? "var(--text-danger)" : "inherit" }}>
              {s.name} <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>· id:{idSuffix(s._id)}</span>
            </span>
            <button type="button" onClick={() => handleDeleteSubject(s._id)} style={{ padding: "3px 10px", fontSize: 12 }}>
              Delete
            </button>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}