/**
 * Logged-in shell: DaisyUI drawer sidebar + <Outlet /> for nested /app/* routes.
 * CAUSE: Each nav item is gated with can(permissions, PK.*) matching backend policies.
 */
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Shield,
  KeyRound,
  Users,
  ClipboardList,
  Menu,
  Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PK, can } from "../../lib/permissionKeys";
import ThemeToggle from "../../components/ThemeToggle";
import clsx from "clsx";

const linkClass = ({ isActive }) =>
  clsx(isActive ? "active font-semibold" : "", "flex items-center gap-2");

export default function DashboardLayout() {
  const { logout, userName, userEmail, publicUserId, role, permissions, ready } = useAuth();
  const navigate = useNavigate();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  const nav = (
    <>
      {can(permissions, PK.dashboardHome) && (
        <li>
          <NavLink to="/app" end className={linkClass}>
            <LayoutDashboard className="w-4 h-4" /> Home
          </NavLink>
        </li>
      )}
      {can(permissions, PK.dashboardPosts) && can(permissions, PK.postsView) && (
        <li>
          <NavLink to="/app/posts" className={linkClass}>
            <FileText className="w-4 h-4" /> Posts
          </NavLink>
        </li>
      )}
      {can(permissions, PK.formSubmissionsOwn) && (
        <li>
          <NavLink to="/app/my-submission" className={linkClass}>
            <ClipboardList className="w-4 h-4" /> My profile
          </NavLink>
        </li>
      )}
      {can(permissions, PK.profilePassword) && (
        <li>
          <NavLink to="/app/change-password" className={linkClass}>
            <Lock className="w-4 h-4" /> Password
          </NavLink>
        </li>
      )}
      <div className="divider my-2 text-xs opacity-60">Admin</div>
      {can(permissions, PK.adminRoles) && (
        <li>
          <NavLink to="/app/admin/roles" className={linkClass}>
            <Shield className="w-4 h-4" /> Roles
          </NavLink>
        </li>
      )}
      {can(permissions, PK.adminPermissions) && (
        <li>
          <NavLink to="/app/admin/permissions" className={linkClass}>
            <KeyRound className="w-4 h-4" /> Permissions
          </NavLink>
        </li>
      )}
      {can(permissions, PK.adminUsers) && (
        <li>
          <NavLink to="/app/admin/users" className={linkClass}>
            <Users className="w-4 h-4" /> Users
          </NavLink>
        </li>
      )}
      {can(permissions, PK.adminSubmissions) && (
        <li>
          <NavLink to="/app/admin/submissions" className={linkClass}>
            <ClipboardList className="w-4 h-4" /> All submissions
          </NavLink>
        </li>
      )}
    </>
  );

  return (
    <div className="drawer lg:drawer-open">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen bg-base-100">
        <header className="navbar bg-base-200 border-b border-base-300 lg:hidden">
          <label htmlFor="app-drawer" className="btn btn-square btn-ghost drawer-button">
            <Menu className="w-5 h-5" />
          </label>
          <span className="font-bold text-primary">RoleBase</span>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <aside className="menu min-h-full w-72 bg-base-200 p-4 border-r border-base-300 flex flex-col">
          <div className="mb-6 px-2">
            <p className="text-lg font-bold text-primary">RoleBase</p>
            <p className="text-sm font-medium truncate">{userName || "User"}</p>
            <p className="text-xs opacity-70 truncate">{userEmail}</p>
            {publicUserId && (
              <p className="text-xs font-mono mt-1 badge badge-outline badge-sm">ID: {publicUserId}</p>
            )}
            <p className="text-xs mt-2 badge badge-secondary badge-sm">{role}</p>
          </div>
          <ul className="flex-1 gap-1">{nav}</ul>
          <div className="mt-4 flex items-center gap-2 px-2">
            <ThemeToggle />
            <button
              type="button"
              className="btn btn-outline btn-sm flex-1 gap-2"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
