import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Card from "../components/Card";
import Badge from "../components/Badge";
import PrimaryButton from "../components/PrimaryButton";
import PageShell from "../components/PageShell";
import { useRolePath } from "../hooks/useRolePath";

interface AttemptQuestion {
  _id: string;
  questionText: string;
  options: { text: string }[];
}

interface PendingAnswer {
  questionId: string;
  selectedOption: string;
  clientTimestamp: number;
}

export default function TestTaking() {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const rolePath = useRolePath();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [lockdownRequired, setLockdownRequired] = useState(false);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [violationCount, setViolationCount] = useState(0);

  const pendingRef = useRef<Map<string, PendingAnswer>>(new Map());
  const attemptIdRef = useRef<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post(`/attempts/${examId}/start`);
        const { attempt, questions: qs, lockdownRequired: lockdown } = res.data;
        setAttemptId(attempt._id);
        setQuestions(qs);
        setLockdownRequired(!!lockdown);
        const end = new Date(attempt.serverEndTime).getTime();
        setRemainingMs(end - Date.now());

        const restored: Record<string, string> = {};
        for (const a of attempt.answers || []) {
          if (a.selectedOption) restored[a.questionId] = a.selectedOption;
        }
        setAnswers(restored);
      } catch (err: any) {
        setError(err.response?.data?.error || "Couldn't start the exam.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  async function reportFlag(type: string, meta?: string) {
    const id = attemptIdRef.current;
    if (!id || submittedRef.current) return;
    try {
      const res = await api.post(`/attempts/${id}/flag`, { type, meta });
      setViolationCount(res.data.violationCount || 0);
      if (res.data.terminated) {
        submittedRef.current = true;
        setSubmitted(true);
        navigate(rolePath("/exams"), {
          state: { message: "Your exam was ended early due to repeated integrity violations (tab switching, exiting fullscreen, or similar)." }
        });
      }
    } catch {
      // best-effort -- don't block the student on a logging failure
    }
  }

  // Tab-switch / window-blur detection -- active for every exam, not just
  // lockdown ones, so there's always a record even if it doesn't terminate.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) reportFlag("tab-switch");
    }
    function onBlur() {
      reportFlag("window-blur");
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fullscreen enforcement, only for exams the teacher marked as lockdown-required.
  useEffect(() => {
    if (!lockdownRequired || loading) return;

    const el = document.documentElement as any;
    const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (request) request.call(el).catch(() => {});

    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        reportFlag("fullscreen-exit");
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockdownRequired, loading]);

  // Block copy/paste, right-click, and common devtools shortcuts during the exam.
  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
    }
    function onKeyDown(e: KeyboardEvent) {
      const blockedKey =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && ["c", "v", "u"].includes(e.key.toLowerCase()));
      if (blockedKey) {
        e.preventDefault();
        reportFlag("blocked-shortcut", e.key);
      }
    }
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (remainingMs === null || submitted) return;
    const tick = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev === null) return prev;
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(tick);
          handleSubmit(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs !== null, submitted]);

  useEffect(() => {
    if (!attemptId || submitted) return;

    const flush = async () => {
      const pending = Array.from(pendingRef.current.values());
      if (pending.length === 0) return;
      try {
        const res = await api.post(`/attempts/${attemptId}/autosave`, { answers: pending });
        pendingRef.current.clear();
        setLastSavedAt(new Date());
        if (typeof res.data.remainingMs === "number") {
          setRemainingMs(res.data.remainingMs);
        }
      } catch {
        // stays queued, retried next interval or on reconnect
      }
    };

    const interval = setInterval(flush, 15000);
    window.addEventListener("online", flush);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", flush);
    };
  }, [attemptId, submitted]);

  function selectAnswer(questionId: string, optionText: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionText }));
    pendingRef.current.set(questionId, {
      questionId,
      selectedOption: optionText,
      clientTimestamp: Date.now()
    });
  }

  async function handleSubmit(auto = false) {
    if (!attemptId || submitted) return;
    setSubmitted(true);
    try {
      const pending = Array.from(pendingRef.current.values());
      if (pending.length > 0) {
        await api.post(`/attempts/${attemptId}/autosave`, { answers: pending });
      }
      await api.post(`/attempts/${attemptId}/submit`);
      navigate(rolePath("/exams"), { state: { message: auto ? "Time's up — your exam was submitted automatically." : "Exam submitted." } });
    } catch {
      setError("Couldn't reach the server. Your answers are saved and will submit once you're back online.");
      retrySubmitWhenOnline();
    }
  }

  function retrySubmitWhenOnline() {
    const retry = async () => {
      try {
        await api.post(`/attempts/${attemptId}/submit`);
        window.removeEventListener("online", retry);
        navigate(rolePath("/exams"), { state: { message: "Exam submitted." } });
      } catch {
        // wait for the next online event
      }
    };
    window.addEventListener("online", retry);
  }

  if (loading) return <PageShell><p style={{ color: "var(--text-secondary)" }}>Loading exam…</p></PageShell>;
  if (error && questions.length === 0) {
    return <PageShell><p style={{ color: "var(--text-danger)" }}>{error}</p></PageShell>;
  }

  const minutes = remainingMs !== null ? Math.max(0, Math.floor(remainingMs / 60000)) : 0;
  const seconds = remainingMs !== null ? Math.max(0, Math.floor((remainingMs % 60000) / 1000)) : 0;
  const timeLow = remainingMs !== null && remainingMs < 5 * 60 * 1000;

  return (
    <PageShell maxWidth={600}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 12,
            borderBottom: "0.5px solid var(--border)",
            marginBottom: 16,
            position: "sticky",
            top: 0,
            background: "var(--surface-1)"
          }}
        >
          <span style={{ fontWeight: 500 }}>Exam in progress</span>
          <Badge tone={timeLow ? "danger" : "warning"}>
            {`${minutes}:${seconds.toString().padStart(2, "0")}`}
          </Badge>
        </div>

        {lockdownRequired && violationCount > 0 && (
          <p style={{ color: "var(--text-danger)", fontSize: 13, marginBottom: 12 }}>
            Warning: {violationCount}/3 integrity violations recorded. Your exam will end automatically if this continues.
          </p>
        )}

        {error && <p style={{ color: "var(--text-warning)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        {questions.map((q, idx) => (
          <div key={q._id} style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 500, marginBottom: 8 }}>
              <span style={{ color: "var(--text-secondary)" }}>{idx + 1}.</span> {q.questionText}
            </p>
            {q.options.map((opt) => {
              const selected = answers[q._id] === opt.text;
              return (
                <label
                  key={opt.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    border: `0.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                    background: selected ? "var(--bg-accent-muted)" : "transparent",
                    borderRadius: "var(--radius)",
                    marginBottom: 6,
                    fontSize: 14,
                    cursor: submitted ? "default" : "pointer"
                  }}
                >
                  <input
                    type="radio"
                    name={q._id}
                    checked={selected}
                    onChange={() => selectAnswer(q._id, opt.text)}
                    disabled={submitted}
                  />
                  {opt.text}
                </label>
              );
            })}
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "0.5px solid var(--border)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {lastSavedAt ? `Auto-saved ${lastSavedAt.toLocaleTimeString()}` : "Saves automatically as you answer"}
          </span>
          <PrimaryButton onClick={() => handleSubmit(false)} disabled={submitted}>
            {submitted ? "Submitting…" : "Submit exam"}
          </PrimaryButton>
        </div>
      </Card>
    </PageShell>
  );
}