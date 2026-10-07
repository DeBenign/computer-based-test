import { createContext, useContext, useState, ReactNode } from "react";

interface AuthUser {
  id: string;
  name: string;
  role: "superadmin" | "admin" | "teacher" | "student";
  classId?: string;
  subjectIds?: string[];
  mustChangePassword?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  function login(token: string, user: AuthUser) {
    localStorage.setItem("cbt_token", token);
    localStorage.setItem("cbt_role", user.role);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("cbt_token");
    localStorage.removeItem("cbt_role");
    setUser(null);
  }

  function clearMustChangePassword() {
    setUser((u) => (u ? { ...u, mustChangePassword: false } : u));
  }

  return <AuthContext.Provider value={{ user, login, logout, clearMustChangePassword }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}