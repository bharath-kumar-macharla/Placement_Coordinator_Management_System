import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Spinner from "../components/Spinner.jsx";

/**
 * Protects a route — redirects to /login if not authenticated.
 * Optionally restricts to specific roles.
 *
 * @param {string[]} [roles] - Allowed roles. If omitted, any authenticated user passes.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to the right dashboard
    const dashboard = user.role === "admin" ? "/admin" : user.role === "coordinator" ? "/coordinator" : "/student";
    return <Navigate to={dashboard} replace />;
  }

  return children;
}
