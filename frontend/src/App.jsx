import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Sidebar from "./components/Sidebar.jsx";
import AssistantWidget from "./components/AssistantWidget.jsx";

// Public Pages
import Login from "./pages/public/Login.jsx";
import Register from "./pages/public/Register.jsx";
import Landing from "./pages/public/Landing.jsx";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentProfile from "./pages/student/Profile.jsx";
import StudentDrives from "./pages/student/Drives.jsx";
import StudentDriveDetail from "./pages/student/DriveDetail.jsx";
import StudentApplications from "./pages/student/Applications.jsx";
import StudentSchedule from "./pages/student/Schedule.jsx";
import StudentNotifications from "./pages/student/Notifications.jsx";

// Coordinator Pages
import CoordinatorDashboard from "./pages/coordinator/Dashboard.jsx";
import CreateDrive from "./pages/coordinator/CreateDrive.jsx";
import DrivesList from "./pages/coordinator/DrivesList.jsx";
import DriveManage from "./pages/coordinator/DriveManage.jsx";
import Shortlist from "./pages/coordinator/Shortlist.jsx";
import Scheduler from "./pages/coordinator/Scheduler.jsx";
import Reports from "./pages/coordinator/Reports.jsx";
import Companies from "./pages/coordinator/Companies.jsx";

// Admin Pages
import AdminUsers from "./pages/admin/Users.jsx";
import AuditLog from "./pages/admin/AuditLog.jsx";

function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
      {user?.role === "student" && <AssistantWidget />}
    </div>
  );
}

function RoleHomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Landing />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "coordinator") return <Navigate to="/coordinator" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<RoleHomeRedirect />} />

          {/* Protected Application Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/drives"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentDrives />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/drives/:id"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentDriveDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/applications"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/schedule"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentNotifications />
                </ProtectedRoute>
              }
            />

            {/* Coordinator Routes */}
            <Route
              path="/coordinator"
              element={
                <ProtectedRoute roles={["coordinator", "admin"]}>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/drives"
              element={
                <ProtectedRoute roles={["coordinator", "admin"]}>
                  <DrivesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/drives/create"
              element={
                <ProtectedRoute roles={["coordinator", "admin"]}>
                  <CreateDrive />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/drives/:id/manage"
              element={
                <ProtectedRoute roles={["coordinator", "admin"]}>
                  <DriveManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/drives/:id/shortlist"
              element={
                <ProtectedRoute roles={["coordinator", "admin"]}>
                  <Shortlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/drives/:id/schedule"
              element={
                <ProtectedRoute roles={["coordinator", "admin"]}>
                  <Scheduler />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/reports"
              element={
                <ProtectedRoute roles={["coordinator", "admin"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/companies"
              element={
                <ProtectedRoute roles={["coordinator", "admin"]}>
                  <Companies />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AuditLog />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
