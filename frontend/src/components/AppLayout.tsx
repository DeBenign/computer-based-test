import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)" }}>
      <Navbar />
      {user && (
        <div style={{ padding: "10px 24px", fontSize: 13, color: "var(--text-secondary)", borderBottom: "0.5px solid var(--border)" }}>
          Welcome back, {user.name}
        </div>
      )}
      <Outlet />
    </div>
  );
}