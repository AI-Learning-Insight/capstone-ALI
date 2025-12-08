// src/router.jsx
import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";
import App from "./App";

// Public pages
import Login from "./pages/Login";

// Private pages (butuh login)
import Dashboard from "./pages/Dashboard";          // = StudentDashboard
import MentorDashboard from "./pages/MentorDashboard";
import ProfileInfo from "./pages/ProfileInfo";
import ProfileSecurity from "./pages/ProfileSecurity";
import Todos from "./pages/Todos";
import Assessment from "./pages/Assessment";
import MentorProfile from "./pages/MentorProfile";

// Auth/role
import ProtectedRoute from "./components/ProtectedRoute";
import RoleHome from "./pages/RoleHome";

// 403 simple page
function Forbidden() {
  return <div className="p-6">Forbidden</div>;
}

// Wrapper: butuh login (tanpa cek role spesifik)
function AuthOnlyLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}

export default createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Auto-redirect sesuai role
      { index: true, element: <RoleHome /> },

      // Public
      { path: "login", element: <Login /> },

      // Private (butuh login saja)
      {
        element: <AuthOnlyLayout />,
        children: [
          // Profil
          { path: "profile", element: <ProfileInfo /> },
          { path: "profile/security", element: <ProfileSecurity /> },
          // Alias opsional
          { path: "profile/info", element: <Navigate to="/profile" replace /> },

          // Halaman lain yang cukup login
          { path: "todos", element: <Todos /> },
          { path: "assessment", element: <Assessment /> },
        ],
      },

      // Private + cek role
      {
        path: "dashboard",
        element: (
          <ProtectedRoute roles={["student", "admin"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "mentor",
        element: (
          <ProtectedRoute roles={["mentor", "admin"]}>
            <MentorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "mentor/profile",
        element: (
          <ProtectedRoute roles={["mentor", "admin"]}>
            <MentorProfile />
          </ProtectedRoute>
        ),
      },

      // 403
      { path: "403", element: <Forbidden /> },

      // 404 sederhana
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
