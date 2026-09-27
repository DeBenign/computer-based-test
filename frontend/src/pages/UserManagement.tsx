import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AppUser, Subject, ClassRoom } from "../types";
import Card from "../components/Card";
import Badge from "../components/Badge";
import PrimaryButton from "../components/PrimaryButton";
import PageShell from "../components/PageShell";
import { useRolePath } from "../hooks/useRolePath";

const rolePath = useRolePath();

const roleTone: Record<string, "accent" | "warning" | "success"> = {
  admin: "accent",
  teacher: "warning",
  student: "success"
};

function idSuffix(id?: string) {
  return id ? id.slice(-6) : "—";
}

export default function UserManagement() {
  const rolePath = useRolePath();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadAll() {
    const [userRes, classRes, subRes] = await Promise.all([
      api.get("/users"),
      api.get("/classes"),
      api.get("/subjects")
    ]);
    setUsers(userRes.data);
    setClasses(classRes.data);
    setSubjects(subRes.data);
    if (classRes.data.length > 0 && !classId) setClassId(classRes.data[0]._id);
    if (subRes.data.length > 0 && !subjectId) setSubjectId(subRes.data[0]._id);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        role,
        classId: role === "student" ? classId : undefined,
        subjectIds: role === "teacher" && subjectId ? [subjectId] : undefined
      });
      setSuccess(`${role === "teacher" ? "Teacher" : "Student"} account created for ${email}.`);
      setName("");
      setEmail("");
      setPassword("");
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't create the account.");
    }
  }

  const missingSetup = classes.length === 0 || subjects.length === 0;
  const classById = Object.fromEntries(classes.map((c) => [c._id, c]));
  const subjectById = Object.fromEntries(subjects.map((s) => [s._id, s]));

  const duplicateClassNames = new Set(
    Object.entries(
      classes.reduce<Record<string, number>>((acc, c) => {
        acc[c.name] = (acc[c.name] || 0) + 1;
        return acc;
      }, {})
    )
      .filter(([, count]) => count > 1)
      .map(([n]) => n)
  );

  return (
    <PageShell maxWidth={760}>
      <h1>Manage users</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
        Create login accounts for teachers and students. Share the email and password with them directly —
        there's no public sign-up, so this is the only way anyone gets access.
      </p>

      {duplicateClassNames.size > 0 && (
        <Card style={{ marginBottom: 20, borderColor: "var(--text-danger)" }}>
          <p style={{ color: "var(--text-danger)", marginBottom: 0, fontSize: 13 }}>
            You have more than one class named "{Array.from(duplicateClassNames).join(", ")}" with different
            IDs. Students and exams pick a specific class by ID, not by name — if a student's class and an
            exam's class are actually different entries that just look the same, the student won't see it.
            Check the ID suffixes below and in Setup, and remove the duplicate if it's not needed.
          </p>
        </Card>
      )}

      {missingSetup && (
        <Card style={{ marginBottom: 20 }}>
          <p style={{ marginBottom: 12 }}>
            Add at least one class and one subject in Setup before creating student or teacher accounts.
          </p>
           <Link to={rolePath("/setup")}>
            <PrimaryButton type="button">Go to Setup</PrimaryButton>
          </Link>
        </Card>
      )}

      {!missingSetup && (
        <Card style={{ marginBottom: 24 }}>
          <h3>Add a user</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label>Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%" }} />
              </div>
              <div style={{ width: 140 }}>
                <label>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as "teacher" | "student")} style={{ width: "100%" }}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Temporary password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%" }} />
              </div>
            </div>
            {role === "student" && (
              <div style={{ marginBottom: 10 }}>
                <label>Class</label>
                <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ width: "100%" }}>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} (id:{idSuffix(c._id)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {role === "teacher" && (
              <div style={{ marginBottom: 10 }}>
                <label>Subject (optional)</label>
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ width: "100%" }}>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} (id:{idSuffix(s._id)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && <p style={{ color: "var(--text-danger)", fontSize: 13 }}>{error}</p>}
            {success && <p style={{ color: "var(--text-success)", fontSize: 13 }}>{success}</p>}
            <PrimaryButton type="submit">Create account</PrimaryButton>
          </form>
        </Card>
      )}

      <h3>Existing users ({users.length})</h3>
      {users.map((u) => {
        const cls = u.classId ? classById[u.classId] : undefined;
        const subj = u.subjectIds?.[0] ? subjectById[u.subjectIds[0]] : undefined;
        return (
          <Card key={u._id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 500, marginBottom: 2 }}>{u.name}</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>{u.email}</p>
                {u.role === "student" && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 0 }}>
                    Class: {cls ? `${cls.name} (id:${idSuffix(cls._id)})` : "none assigned"}
                  </p>
                )}
                {u.role === "teacher" && subj && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 0 }}>
                    Subject: {subj.name} (id:{idSuffix(subj._id)})
                  </p>
                )}
              </div>
              <Badge tone={roleTone[u.role]}>{u.role}</Badge>
            </div>
          </Card>
        );
      })}
    </PageShell>
  );
}