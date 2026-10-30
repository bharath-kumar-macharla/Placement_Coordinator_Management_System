import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useToast } from "../../components/useToast.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function Register() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const { register }   = useAuth();
  const navigate       = useNavigate();
  const { toast, ToastContainerEl } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/student", { replace: true });
    } catch (err) {
      toast(err.response?.data?.error?.message ?? "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-100 flex items-center justify-center p-4">
      {ToastContainerEl}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white text-2xl font-bold shadow-lg mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join PlacementAI as a student</p>
        </div>

        <div className="card p-8 shadow-xl border-0">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="form-group">
              <label htmlFor="name" className="label">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                className="input"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
                autoComplete="new-password"
                required
                minLength={8}
                className="input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              id="register-submit"
              className="btn-primary w-full btn-lg mt-2"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
