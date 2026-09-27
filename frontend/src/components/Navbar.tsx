import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface-1)"
      }}
    >
      <Link to="/exams" style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>
        CBT
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14 }}>
        {user?.role === "admin" && (
          <Link to="/setup" style={{ color: "var(--text-secondary)" }}>Setup</Link>
        )}
        {(user?.role === "teacher" || user?.role === "admin") && (
          <Link to="/questions" style={{ color: "var(--text-secondary)" }}>Questions</Link>
        )}
        <Link to="/exams" style={{ color: "var(--text-secondary)" }}>Exams</Link>
        {user?.role === "admin" && (
          <Link to="/users" style={{ color: "var(--text-secondary)" }}>Users</Link>
        )}
        <button onClick={handleLogout} style={{ padding: "6px 14px" }}>Log out</button>
      </div>
    </nav>
  );
}