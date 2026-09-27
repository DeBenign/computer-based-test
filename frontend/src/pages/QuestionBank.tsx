import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Question, Subject, ClassRoom } from "../types";
import Card from "../components/Card";
import Badge from "../components/Badge";
import PrimaryButton from "../components/PrimaryButton";
import PageShell from "../components/PageShell";
import { useRolePath } from "../hooks/useRolePath";

const emptyOptions = [
  { text: "", isCorrect: true },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false }
];

const difficultyTone: Record<string, "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger"
};

export default function QuestionBank() {
  const { user } = useAuth();
  const canManage = user?.role === "teacher"; // admin gets read-only oversight here
  const rolePath = useRolePath();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(emptyOptions);
  const [marks, setMarks] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function loadClasses() {
    const res = await api.get("/classes");
    setClasses(res.data);
  }

  async function loadSubjects() {
    const res = await api.get("/subjects");
    setSubjects(res.data);
    if (res.data.length > 0 && !subjectId) setSubjectId(res.data[0]._id);
  }

  async function loadQuestions() {
    const res = await api.get("/questions", { params: { subjectId: subjectId || undefined, classId: classId || undefined } });
    setQuestions(res.data);
  }

  useEffect(() => {
    loadSubjects();
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only offer classes this subject is actually taught in
  const subject = subjects.find((s) => s._id === subjectId);
  const classOptions = classes.filter((c) => subject?.classIds.includes(c._id));

  // Reset classId whenever the subject (or the classes list itself) changes --
  // both loadSubjects() and loadClasses() fire in parallel on mount, so this
  // has to depend on `classes` too, not just `subjectId`, or it can fire once
  // before `classes` has actually loaded and get stuck on an empty string.
  useEffect(() => {
    setClassId(classOptions[0]?._id || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, classes]);

  useEffect(() => {
    if (subjectId && classId) loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, classId]);

  function updateOptionText(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)));
  }

  function setCorrectOption(index: number) {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (options.some((o) => !o.text.trim())) {
      setError("Fill in all four options.");
      return;
    }
    try {
      await api.post("/questions", { subjectId, classId, topic, difficulty, questionText, options, marks });
      setQuestionText("");
      setOptions(emptyOptions);
      await loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't save the question.");
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/questions/${id}`);
    await loadQuestions();
  }

  if (subjects.length === 0) {
    return (
      <PageShell maxWidth={520}>
        <h1>Question bank</h1>
        <Card>
          <p style={{ marginBottom: 12 }}>You need at least one subject before you can add questions.</p>
          <Link to={rolePath("/setup")}>
            <PrimaryButton type="button">Go to Setup</PrimaryButton>
          </Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth={760}>
      <h1>Question bank</h1>

      <Card style={{ marginBottom: 24 }}>
        <h3>Filter</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ width: "100%" }}>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ width: "100%" }}>
              {classOptions.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {canManage && (
        <Card style={{ marginBottom: 24 }}>
          <h3>Add a question</h3>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Topic</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} required style={{ width: "100%" }} />
            </div>
            <div style={{ width: 110 }}>
              <label>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} style={{ width: "100%" }}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div style={{ width: 70 }}>
              <label>Marks</label>
              <input type="number" min={1} value={marks} onChange={(e) => setMarks(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Question</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              style={{ width: "100%", minHeight: 64 }}
            />
          </div>

          <label style={{ marginBottom: 6 }}>Options — select the correct one</label>
          {options.map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setCorrectOption(i)} />
              <input
                placeholder={`Option ${i + 1}`}
                value={opt.text}
                onChange={(e) => updateOptionText(i, e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          ))}

          {error && <p style={{ color: "var(--text-danger)", fontSize: 13, marginTop: 4 }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <PrimaryButton type="submit" style={{ marginTop: 8 }}>Save question</PrimaryButton>
          </form>
        </Card>
      )}

      <h3>Bank ({questions.length})</h3>
      {questions.length === 0 && (
        <p style={{ color: "var(--text-secondary)" }}>
          {canManage
            ? "No questions yet for this subject. Add your first one above."
            : "No questions yet for this subject."}
        </p>
      )}
      {questions.map((q) => (
        <Card key={q._id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <p style={{ fontWeight: 500, marginBottom: 6 }}>{q.questionText}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{q.topic}</span>
                <Badge tone={difficultyTone[q.difficulty]}>{q.difficulty}</Badge>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
              </div>
            </div>
            {canManage && <button onClick={() => handleDelete(q._id)}>Delete</button>}
          </div>
        </Card>
      ))}
    </PageShell>
  );
}