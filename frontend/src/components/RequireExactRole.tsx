import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRolePath } from "../hooks/useRolePath";

export default function RequireExactRole({ allow }: { allow: Array<"admin" | "teacher" | "student"> }) {
  const { user } = useAuth();
  const rolePath = useRolePath();

  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to={rolePath("/exams")} replace />;

  return <Outlet />;
}