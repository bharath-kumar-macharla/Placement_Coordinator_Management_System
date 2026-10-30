import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { notificationApi } from "../api/index.js";
import { useState, useEffect } from "react";

const STUDENT_NAV = [
  { to: "/student",              label: "Dashboard",    icon: "🏠" },
  { to: "/student/profile",      label: "My Profile",   icon: "👤" },
  { to: "/student/drives",       label: "Drives",       icon: "🏢" },
  { to: "/student/applications", label: "Applications", icon: "📋" },
  { to: "/student/schedule",     label: "Schedule",     icon: "📅" },
  { to: "/student/notifications", label: "Notifications", icon: "🔔" },
];

const COORDINATOR_NAV = [
  { to: "/coordinator",                label: "Dashboard",  icon: "📊" },
  { to: "/coordinator/drives",         label: "Drives",     icon: "🏢" },
  { to: "/coordinator/drives/create",  label: "Create Drive", icon: "➕" },
  { to: "/coordinator/reports",        label: "Reports",    icon: "📈" },
  { to: "/coordinator/companies",      label: "Companies",  icon: "🏭" },
];

const ADMIN_NAV = [
  { to: "/admin",          label: "Users",      icon: "👥" },
  { to: "/admin/companies", label: "Companies",  icon: "🏭" },
  { to: "/admin/audit",    label: "Audit Log",  icon: "📝" },
];

function NavItems({ items }) {
  return (
    <nav className="space-y-0.5" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to.split("/").length <= 2}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user?.role === "student") {
      notificationApi.unreadCount()
        .then(({ data }) => setUnread(data.count ?? 0))
        .catch(() => {});
    }
  }, [user]);

  const navItems =
    user?.role === "admin"       ? ADMIN_NAV :
    user?.role === "coordinator" ? COORDINATOR_NAV :
    STUDENT_NAV;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-slate-200 overflow-y-auto">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">PlacementAI</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4">
        {unread > 0 && user?.role === "student" && (
          <div className="mb-3 px-2">
            <NavLink to="/student/notifications" className="flex items-center gap-2 text-xs text-primary-600 font-medium bg-primary-50 px-3 py-2 rounded-lg hover:bg-primary-100 transition-colors">
              <span>🔔</span>
              <span>{unread} unread notification{unread > 1 ? "s" : ""}</span>
            </NavLink>
          </div>
        )}
        <NavItems items={navItems} />
      </div>

      {/* User / Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost w-full justify-start gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
