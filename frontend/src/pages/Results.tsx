import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Badge from "../components/Badge";
import PageShell from "../components/PageShell";

interface FlaggedEvent {
  type: string;
  timestamp: number;
}

interface StudentRow {
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  status: string;
  submittedAt: string;
  flagCount: number;
  flaggedEvents: FlaggedEvent[];
}

interface ExamResults {
  examTitle: string;
  totalMarks: number;
  classAverage: number;
  submittedCount: number;
  results: StudentRow[];
}

interface MyResult {
  status: string;
  score: number;
  submittedAt: string;
}

export default function Results() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId");

  const [classResults, setClassResults] = useState<ExamResults | null>(null);
  const [myResult, setMyResult] = useState<MyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlockAt, setUnlockAt] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    setError(null);
    setUnlockAt(null);

    if (user?.role === "student") {
      api
        .get(`/results/mine/${examId}`)
        .then((res) => setMyResult(res.data))
        .catch((err) => {
          setError(err.response?.data?.error || "No result yet.");
          if (err.response?.data?.unlockAt) setUnlockAt(err.response.data.unlockAt);
        });
    } else {
      api
        .get(`/results/exam/${examId}`)
        .then((res) => setClassResults(res.data))
        .catch((err) => {
          setError(err.response?.data?.error || "Couldn't load results.");
          if (err.response?.data?.unlockAt) setUnlockAt(err.response.data.unlockAt);
        });
    }
  }, [examId, user?.role]);

  async function handleDownload() {
    if (!examId) return;
    setDownloading(true);
    try {
      const res = await api.get(`/results/exam/${examId}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(classResults?.examTitle || "exam").replace(/[^a-z0-9]/gi, "_")}_results.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (!examId) {
    return (
      <PageShell>
        <h1>Results</h1>
        <p style={{ color: "var(--text-secondary)" }}>Open results from an exam's link (e.g. /results?examId=…).</p>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <h1>Results</h1>
        <p style={{ color: unlockAt ? "var(--text-secondary)" : "var(--text-danger)" }}>{error}</p>
        {unlockAt && (
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            Available from: <strong>{new Date(unlockAt).toLocaleString()}</strong>
          </p>
        )}
      </PageShell>
    );
  }

  if (user?.role === "student") {
    return (
      <PageShell maxWidth={420}>
        <h1>Your result</h1>
        {myResult ? (
          <Card>
            <p><strong>Score:</strong> {myResult.score}</p>
            <p><strong>Status:</strong> {myResult.status}</p>
            <p style={{ marginBottom: 0 }}><strong>Submitted:</strong> {new Date(myResult.submittedAt).toLocaleString()}</p>
          </Card>
        ) : (
          <p style={{ color: "var(--text-secondary)" }}>Loading…</p>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth={720}>
      {classResults ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <h1 style={{ marginBottom: 0 }}>{classResults.examTitle} — results</h1>
            <button type="button" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Preparing…" : "Download CSV"}
            </button>
          </div>
          <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
            Class average: <strong style={{ color: "var(--text-primary)" }}>{classResults.classAverage} / {classResults.totalMarks}</strong>
            {" · "}{classResults.submittedCount} submission{classResults.submittedCount === 1 ? "" : "s"}
          </p>
          <Card>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Flags</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {classResults.results.map((r) => {
                  const isExpanded = expandedId === r.studentId;
                  return (
                    <>
                      <tr
                        key={r.studentId}
                        style={{ cursor: r.flagCount > 0 ? "pointer" : "default" }}
                        onClick={() => r.flagCount > 0 && setExpandedId(isExpanded ? null : r.studentId)}
                      >
                        <td>{r.studentName}</td>
                        <td>{r.score} / {r.totalMarks}</td>
                        <td>
                          {r.status === "flagged" ? <Badge tone="danger">flagged</Badge> : r.status}
                        </td>
                        <td>
                          {r.flagCount > 0 ? <Badge tone="warning">{r.flagCount}</Badge> : "—"}
                        </td>
                        <td>{new Date(r.submittedAt).toLocaleString()}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${r.studentId}-detail`}>
                          <td colSpan={5} style={{ fontSize: 12, color: "var(--text-secondary)", paddingTop: 0 }}>
                            {r.flaggedEvents.map((e, i) => (
                              <div key={i}>
                                {e.type} — {new Date(e.timestamp).toLocaleTimeString()}
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <p style={{ color: "var(--text-secondary)" }}>Loading…</p>
      )}
    </PageShell>
  );
}