import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import NotesPage from "./pages/NotesPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ZenMode from "./components/ZenMode.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { useUser } from "./context/UserContext.jsx";

const ADMIN_EMAILS = ["zeynep.dilek.04@gmail.com"];

export default function App() {
  const { zenMode, isAuthenticated, user } = useUser();
  const isAdmin = isAuthenticated && ADMIN_EMAILS.includes(user?.email);

  return (
    <div className="min-h-screen">
      {!zenMode && <Navbar />}
      <Routes>
        {/* Herkese açık sayfalar */}
        <Route path="/"            element={<HomePage />} />
        <Route path="/quiz"        element={<QuizPage />} />
        <Route path="/notes"       element={<NotesPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        {/* Sadece giriş yapılmışsa */}
        <Route path="/dashboard"   element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />

        {/* Admin sayfası */}
        <Route path="/admin"       element={<AdminPage />} />

        {/* Auth sayfaları — giriş yapılmışsa ana sayfaya */}
        <Route path="/login"       element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register"    element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />

        <Route path="*"            element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
