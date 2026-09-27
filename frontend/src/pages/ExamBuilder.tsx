import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import { Subject, ClassRoom } from "../types";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import PageShell from "../components/PageShell";
import { useRolePath } from "../hooks/useRolePath";

// Convert an ISO date string to the "YYYY-MM-DDTHH:mm" shape <input type="datetime-local"> expects.
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExamBuilder() {
  const { id: existingExamId } = useParams();
  const rolePath = useRolePath();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [topics, setTopics] = useState("");
  const [questionCount, setQuestionCount] = useState(20);
  const [attachedCount, setAttachedCount] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [examId, setExamId] = useState<string | null>(existingExamId || null);
  const [loading, setLoading] = useState(!!existingExamId);
  const navigate = useNavigate();
  

  useEffect(() => {
    (async () => {
      const [subRes, classRes] = await Promise.all([api.get("/subjects"), api.get("/classes")]);
      setSubjects(subRes.data);
      setClasses(classRes.data);

      if (existingExamId) {
        const examRes = await api.get(`/exams/${existingExamId}`);
        const exam = examRes.data;
        setSubjectId(exam.subjectId);
        setClassId(exam.classId);
        setTitle(exam.title);
        setDuration(exam.duration);
        setStartTime(toLocalInputValue(exam.startTime));
        setEndTime(toLocalInputValue(exam.endTime));
        setAttachedCount(exam.questionIds?.length || 0);
        setLoading(false);
      } else {
        if (subRes.data.length > 0) setSubjectId(subRes.data[0]._id);
        if (classRes.data.length > 0) setClassId(classRes.data[0]._id);
      }
    })();
  }, [existingExamId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await api.post("/exams", {
        subjectId,
        classId,
        title,
        duration,
        startTime,
        endTime,
        randomizeQuestions: true,
        randomizeOptions: true,
        lockdownRequired: true
      });
      setExamId(res.data._id);
      setStatus("Draft created. Now add questions below.");
    } catch (err: any) {
      setStatus(err.response?.data?.error || "Couldn't create the exam.");
    }
  }

  async function handleAutoFill() {
    if (!examId) return;
    try {
      const res = await api.post(`/exams/${examId}/auto-fill`, {
        topics: topics ? topics.split(",").map((t) => t.trim()) : undefined,
        difficulty: "mixed",
        count: questionCount
      });
      const { addedCount, requestedCount, exam } = res.data;
      setAttachedCount(exam.questionIds?.length || addedCount);
      if (addedCount < requestedCount) {
        setStatus(`Only found ${addedCount} of ${requestedCount} matching questions in the bank — added those.`);
      } else {
        setStatus(`Added ${addedCount} questions from the bank.`);
      }
    } catch (err: any) {
      setStatus(err.response?.data?.error || "Auto-fill failed.");
    }
  }

      async function handlePublish() {
        if (!examId) return;
        try {
          await api.post(`/exams/${examId}/publish`);
          setStatus("Exam published and scheduled.");
          navigate(rolePath("/exams"));
        } catch (err: any) {
          setStatus(err.response?.data?.error || "Couldn't publish the exam.");
        }
    }

  if (loading) {
    return (
      <PageShell maxWidth={520}>
        <p style={{ color: "var(--text-secondary)" }}>Loading exam…</p>
      </PageShell>
    );
  }

  if (subjects.length === 0 || classes.length === 0) {
    return (
      <PageShell maxWidth={520}>
        <h1>New exam</h1>
        <Card>
          <p style={{ marginBottom: 12 }}>You need at least one class and one subject before creating an exam. Ask your school admin to add class and subject for you first.</p>
            <Link to={rolePath("/setup")}>
            <PrimaryButton type="button">Go to Setup</PrimaryButton>
          </Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth={560}>
      <h1>{existingExamId ? "Continue exam setup" : "New exam"}</h1>

      <Card style={{ marginBottom: 20 }}>
        <form onSubmit={handleCreate}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ width: "100%" }} disabled={!!examId}>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ width: "100%" }} disabled={!!examId}>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Exam title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={!!examId} style={{ width: "100%" }} />
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 120 }}>
              <label>Duration (mins)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={!!examId} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Start</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required disabled={!!examId} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>End</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required disabled={!!examId} style={{ width: "100%" }} />
            </div>
          </div>

          {!examId && <PrimaryButton type="submit">Create draft</PrimaryButton>}
        </form>
      </Card>

      {examId && (
        <Card style={{ marginBottom: 20 }}>
          <h3>Add questions</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            {attachedCount} question{attachedCount === 1 ? "" : "s"} attached so far.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label>Topics (comma separated, optional — leave blank to match any topic)</label>
            <input value={topics} onChange={(e) => setTopics(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 14, width: 140 }}>
            <label>Number of questions</label>
            <input
              type="number"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAutoFill} type="button">Auto-fill from bank</button>
            <PrimaryButton onClick={handlePublish} type="button" disabled={attachedCount === 0}>
              Publish exam
            </PrimaryButton>
          </div>
        </Card>
      )}

      {status && <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{status}</p>}
    </PageShell>
  );
}