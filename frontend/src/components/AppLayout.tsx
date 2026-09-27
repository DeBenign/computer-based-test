import { Outlet } from "react-router-dom";
import Navbar from "./NavBar";

export default function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)" }}>
      <Navbar />
      <Outlet />
    </div>
  );
}