import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import Spinner from "../../components/Spinner.jsx";

export default function Landing() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loggingInRole, setLoggingInRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleQuickLogin(email, password, role) {
    setLoggingInRole(role);
    setErrorMsg("");
    try {
      const loggedUser = await login(email, password);
      const target =
        loggedUser.role === "admin"
          ? "/admin"
          : loggedUser.role === "coordinator"
          ? "/coordinator"
          : "/student";
      navigate(target, { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || "Failed to log in");
    } finally {
      setLoggingInRole(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-primary-500 selection:text-white">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-primary-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-xl tracking-tight">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tracking-tight">PlacementAI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  Campus 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Autonomous Campus Placement Coordinator
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#drives" className="hover:text-white transition-colors">Active Drives</a>
            <a href="#demo" className="hover:text-white transition-colors">1-Click Demos</a>
            <a href="#stats" className="hover:text-white transition-colors">Analytics</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={user.role === "admin" ? "/admin" : user.role === "coordinator" ? "/coordinator" : "/student"}
                className="btn-primary text-xs py-2 px-4 shadow-lg shadow-primary-600/30"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white py-2 px-3 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs py-2 px-4 shadow-lg shadow-primary-600/30 hidden sm:inline-flex"
                >
                  Student Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-600/20 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-purple-600/15 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-medium text-primary-300 mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI-Driven Deterministic Eligibility & Clash-Free Scheduling</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Next-Generation Campus Placements Powered by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-indigo-300 to-purple-400">
              Autonomous AI
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate placement spreadsheets forever. Automatic JD criteria extraction, multi-factor student match scoring, human-in-the-loop shortlisting & offer extension, and algorithmic clash-free round scheduling.
          </p>

          {/* 1-Click Role Portals */}
          <div id="demo" className="mt-10 max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              ⚡ Instant 1-Click Demo Portals (No Password Required)
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Coordinator Card */}
              <button
                type="button"
                onClick={() => handleQuickLogin("coordinator@demo.com", "Demo@1234", "coordinator")}
                disabled={loggingInRole !== null}
                className="group relative p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-primary-500/60 transition-all text-left shadow-lg hover:shadow-primary-500/10 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">👔</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Coordinator
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors">
                  Coordinator Hub
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage drives, review shortlists, select offers & view reports.
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-primary-400">
                  {loggingInRole === "coordinator" ? (
                    <span className="flex items-center gap-1.5">
                      <Spinner size="sm" /> Entering...
                    </span>
                  ) : (
                    <span>Launch as Coordinator →</span>
                  )}
                </div>
              </button>

              {/* Student Card */}
              <button
                type="button"
                onClick={() => handleQuickLogin("student1@demo.com", "Demo@1234", "student")}
                disabled={loggingInRole !== null}
                className="group relative p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 transition-all text-left shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🎓</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Student
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Student Portal
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Arjun Mehta (9.1 CGPA). Browse eligible drives & AI prep.
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-emerald-400">
                  {loggingInRole === "student" ? (
                    <span className="flex items-center gap-1.5">
                      <Spinner size="sm" /> Entering...
                    </span>
                  ) : (
                    <span>Launch as Student →</span>
                  )}
                </div>
              </button>

              {/* Admin Card */}
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@demo.com", "Demo@1234", "admin")}
                disabled={loggingInRole !== null}
                className="group relative p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 transition-all text-left shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🛡️</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Administrator
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  System Admin
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage users, audit trails, system health & configurations.
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-purple-400">
                  {loggingInRole === "admin" ? (
                    <span className="flex items-center gap-1.5">
                      <Spinner size="sm" /> Entering...
                    </span>
                  ) : (
                    <span>Launch as Admin →</span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Campus Placement Metrics Strip ───────────────────────────────── */}
      <section id="stats" className="border-y border-slate-800 bg-slate-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-white">50+</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Enrolled Students
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across 8 Engineering Branches</p>
            </div>

            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-primary-400">₹16 LPA</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Highest Package
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">FinTech Global Labs Quant Drive</p>
            </div>

            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">24</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Applications Evaluated
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Shortlisted, Selected & Rejected</p>
            </div>

            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-purple-400">100%</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Clash-Free Scheduling
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Zero Multi-Drive Overlaps</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Active Drives Showcase ────────────────────────────────────────── */}
      <section id="drives" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Active Placement Drives
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Multi-tier campus hiring with strict criteria verification and AI skill gap analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Drive 1 */}
          <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 flex flex-col justify-between hover:border-slate-600 transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acme Technologies</span>
                <span className="badge-green">Open Drive</span>
              </div>
              <h3 className="text-lg font-bold text-white">Graduate Engineer Trainee 2025</h3>
              <p className="text-2xl font-black text-emerald-400 mt-2">₹12 LPA</p>
              <p className="text-xs text-slate-400 mt-1">Bangalore / Hyderabad · Full-time</p>

              <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Min CGPA:</span>
                  <span className="font-semibold text-white">7.00 / 10.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Backlogs:</span>
                  <span className="font-semibold text-white">0 Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Branches:</span>
                  <span className="font-semibold text-white">CSE, IT, ECE</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">11 Candidates Evaluated</span>
              <button
                type="button"
                onClick={() => handleQuickLogin("coordinator@demo.com", "Demo@1234", "coordinator")}
                className="text-xs font-bold text-primary-400 hover:text-primary-300"
              >
                Review Shortlist →
              </button>
            </div>
          </div>

          {/* Drive 2 */}
          <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 flex flex-col justify-between hover:border-slate-600 transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CloudScale Systems</span>
                <span className="badge-green">Open Drive</span>
              </div>
              <h3 className="text-lg font-bold text-white">Site Reliability Engineer 2026</h3>
              <p className="text-2xl font-black text-emerald-400 mt-2">₹14.5 LPA</p>
              <p className="text-xs text-slate-400 mt-1">Pune / Remote · Full-time</p>

              <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Min CGPA:</span>
                  <span className="font-semibold text-white">7.50 / 10.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mandatory Skills:</span>
                  <span className="font-semibold text-white">Docker, AWS, Linux</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Branches:</span>
                  <span className="font-semibold text-white">CSE, IT</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">7 Candidates Evaluated</span>
              <button
                type="button"
                onClick={() => handleQuickLogin("coordinator@demo.com", "Demo@1234", "coordinator")}
                className="text-xs font-bold text-primary-400 hover:text-primary-300"
              >
                Review Shortlist →
              </button>
            </div>
          </div>

          {/* Drive 3 */}
          <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-6 flex flex-col justify-between hover:border-slate-600 transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">FinTech Global Labs</span>
                <span className="badge-green">Open Drive</span>
              </div>
              <h3 className="text-lg font-bold text-white">Quant & Platform Engineer 2026</h3>
              <p className="text-2xl font-black text-emerald-400 mt-2">₹16 LPA</p>
              <p className="text-xs text-slate-400 mt-1">Mumbai · High-Frequency Trading</p>

              <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Min CGPA:</span>
                  <span className="font-semibold text-white">8.00 / 10.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Required Skills:</span>
                  <span className="font-semibold text-white">Python, Algorithms, SQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Branches:</span>
                  <span className="font-semibold text-white">CSE, IT, AIDS, CSBS</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">6 Candidates Evaluated</span>
              <button
                type="button"
                onClick={() => handleQuickLogin("coordinator@demo.com", "Demo@1234", "coordinator")}
                className="text-xs font-bold text-primary-400 hover:text-primary-300"
              >
                Review Shortlist →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-16 bg-slate-800/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Placement Capabilities
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Designed for institutional placement cells managing thousands of applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="text-3xl">📄</span>
              <h3 className="text-base font-bold text-white mt-3">Autonomous Criteria Extraction</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Gemini LLM parses raw recruiter JD PDFs and emails into deterministic filters: CGPA cut-offs, active backlog restrictions, and mandatory technical competencies.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="text-3xl">🎯</span>
              <h3 className="text-base font-bold text-white mt-3">Multi-Factor Match Engine</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Ranks students dynamically using skill vector alignment, project relevance, and academic scores while flagging borderline and criteria-failing applicants.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="text-3xl">🤝</span>
              <h3 className="text-base font-bold text-white mt-3">Human-in-the-Loop Decisions</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Coordinators retain ultimate control with 1-click Shortlist, Select (Offer Extended), and Reject buttons, alongside override logs and audit tracking.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="text-3xl">📅</span>
              <h3 className="text-base font-bold text-white mt-3">Clash-Free Round Scheduler</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Graph-coloring constraint engine resolves multi-drive timetable overlaps and interviewer capacity, guaranteeing no student has simultaneous interviews.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="text-3xl">📊</span>
              <h3 className="text-base font-bold text-white mt-3">Institutional Skill Intelligence</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Real-time conversion funnels, estimated coordinator hours saved, and institutional skill gap intelligence to update engineering curricula.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="text-3xl">🤖</span>
              <h3 className="text-base font-bold text-white mt-3">Student Placement Copilot</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Real-time resume ATS scoring, actionable technical skill gap recommendations, personalized interview prep plans, and deadline reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="font-semibold text-slate-400">PlacementAI</span>
            <span>· Campus Placement Coordinator System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/login" className="hover:text-white">Sign In</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
            <a href="#demo" className="hover:text-white">1-Click Portals</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
