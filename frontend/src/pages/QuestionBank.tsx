import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Question, Subject } from "../types";
import Card from "../components/Card";
import Badge from "../components/Badge";
import PrimaryButton from "../components/PrimaryButton";
import PageShell from "../components/PageShell";

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(emptyOptions);
  const [marks, setMarks] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function loadSubjects() {
    const res = await api.get("/subjects");
    setSubjects(res.data);
    if (res.data.length > 0 && !subjectId) setSubjectId(res.data[0]._id);
  }

  async function loadQuestions() {
    const res = await api.get("/questions", { params: { subjectId: subjectId || undefined } });
    setQuestions(res.data);
  }

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (subjectId) loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

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
      await api.post("/questions", { subjectId, topic, difficulty, questionText, options, marks });
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
          <Link to="/setup">
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
        <h3>Add a question</h3>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ width: "100%" }}>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
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

      <h3>Bank ({questions.length})</h3>
      {questions.length === 0 && (
        <p style={{ color: "var(--text-secondary)" }}>No questions yet for this subject. Add your first one above.</p>
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
            <button onClick={() => handleDelete(q._id)}>Delete</button>
          </div>
        </Card>
      ))}
    </PageShell>
  );
}