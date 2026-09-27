import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import RequireRole from "./components/RequireRole";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import QuestionBank from "./pages/QuestionBank";
import ExamBuilder from "./pages/ExamBuilder";
import ExamList from "./pages/ExamList";
import TestTaking from "./pages/TestTaking";
import Results from "./pages/Results";
import UserManagement from "./pages/UserManagement";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route path="/:role" element={<RequireRole />}>
            <Route element={<AppLayout />}>
              <Route path="setup" element={<Setup />} />
              <Route path="questions" element={<QuestionBank />} />
              <Route path="exams" element={<ExamList />} />
              <Route path="exams/new" element={<ExamBuilder />} />
              <Route path="exams/:id/edit" element={<ExamBuilder />} />
              <Route path="exams/:id/take" element={<TestTaking />} />
              <Route path="results" element={<Results />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}