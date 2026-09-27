import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireRole() {
  const { user } = useAuth();
  const { role } = useParams<{ role: string }>();

  if (!user) return <Navigate to="/login" replace />;
  if (role !== user.role) return <Navigate to={`/${user.role}/exams`} replace />;

  return <Outlet />;
}