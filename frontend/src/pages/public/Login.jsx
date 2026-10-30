import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useToast } from "../../components/useToast.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const { toast, ToastContainerEl } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      const dashboard =
        user.role === "admin"       ? "/admin" :
        user.role === "coordinator" ? "/coordinator" :
        "/student";
      navigate(dashboard, { replace: true });
    } catch (err) {
      toast(err.response?.data?.error?.message ?? "Invalid email or password", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-100 flex items-center justify-center p-4">
      {ToastContainerEl}

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white text-2xl font-bold shadow-lg mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to PlacementAI</p>
        </div>

        <div className="card p-8 shadow-xl border-0">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="form-group">
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              id="login-submit"
              className="btn-primary w-full btn-lg mt-2"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            New student?{" "}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Demo credentials & 1-Click Fill */}
        <div className="mt-4 card p-4 bg-slate-50 border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">⚡ 1-Click Demo Login</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("coordinator@demo.com");
                setPassword("Demo@1234");
              }}
              className="py-1.5 px-2 rounded-md bg-white border border-slate-300 hover:border-primary-500 text-xs font-medium text-slate-700 hover:text-primary-600 transition-colors shadow-2xs text-center"
            >
              👔 Coordinator
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("student1@demo.com");
                setPassword("Demo@1234");
              }}
              className="py-1.5 px-2 rounded-md bg-white border border-slate-300 hover:border-emerald-500 text-xs font-medium text-slate-700 hover:text-emerald-600 transition-colors shadow-2xs text-center"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@demo.com");
                setPassword("Demo@1234");
              }}
              className="py-1.5 px-2 rounded-md bg-white border border-slate-300 hover:border-purple-500 text-xs font-medium text-slate-700 hover:text-purple-600 transition-colors shadow-2xs text-center"
            >
              🛡️ Admin
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Click above to fill demo credentials, or visit the <Link to="/" className="text-primary-600 underline">Landing page</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
