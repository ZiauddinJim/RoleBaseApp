/**
 * RoleBaseApp — React SPA routing map (open this file first on the frontend).
 *
 * PURPOSE: Public auth/onboarding routes + protected /app/* shell with permission-based sidebar.
 *
 * GUARDS:
 *   - ProtectedRoute: needs JWT + AuthContext `ready` (after /auth/me sync).
 *   - RequirePasswordChange: onboarding users must hit /app/change-password first.
 *   - RootRedirect: `/` and unknown paths → /app if logged in, else /login.
 *
 * CAUSE: Feature folders under `src/features/*` keep auth, dashboard, admin, onboarding separate.
 */
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import MultiStepOnboardingPage from "./features/onboarding/MultiStepOnboardingPage";

import DashboardLayout from "./features/dashboard/DashboardLayout";
import HomePage from "./features/dashboard/HomePage";
import PostsPage from "./features/dashboard/PostsPage";
import MySubmissionPage from "./features/dashboard/MySubmissionPage";
import ChangePasswordPage from "./features/auth/ChangePasswordPage";

import AdminRolesPage from "./features/admin/AdminRolesPage";
import AdminPermissionsPage from "./features/admin/AdminPermissionsPage";
import AdminUsersPage from "./features/admin/AdminUsersPage";
import AdminSubmissionsPage from "./features/admin/AdminSubmissionsPage";

function ProtectedRoute({ children }) {
  const { token, ready } = useAuth();
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequirePasswordChange({ children }) {
  const { mustChangePassword } = useAuth();
  const loc = useLocation();
  if (mustChangePassword && !loc.pathname.includes("/change-password")) {
    return <Navigate to="/app/change-password" replace />;
  }
  return children;
}

function RootRedirect() {
  const { token, ready } = useAuth();
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }
  return <Navigate to={token ? "/app" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/onboarding" element={<MultiStepOnboardingPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <RequirePasswordChange>
              <DashboardLayout />
            </RequirePasswordChange>
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="my-submission" element={<MySubmissionPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="admin/roles" element={<AdminRolesPage />} />
        <Route path="admin/permissions" element={<AdminPermissionsPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/submissions" element={<AdminSubmissionsPage />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
