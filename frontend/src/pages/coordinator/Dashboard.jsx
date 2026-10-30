import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { driveApi, reportApi, applicationApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function CoordinatorDashboard() {
  const [drives, setDrives] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decisionFilter, setDecisionFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const [drivesRes, overviewRes] = await Promise.all([
          driveApi.list({ limit: 6 }),
          reportApi.overview().catch(() => ({ data: { totalDrives: 0, totalApplications: 0, totalShortlisted: 0, totalPlaced: 0 } })),
        ]);
        setDrives(drivesRes.data.drives ?? []);
        setOverview(overviewRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const decisions = overview?.recentDecisions ?? [];
  const filteredDecisions = decisions.filter((d) => {
    if (decisionFilter === "all") return true;
    return d.status === decisionFilter;
  });

  const activeDrives = drives.filter(
    (d) => d.status === "open" || d.status === "shortlisting" || d.status === "scheduled"
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Placement Coordinator Hub</h1>
          <p className="page-subtitle">
            AI-driven drive management, eligibility checks, shortlisting, and clash-free scheduling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/coordinator/drives/create" className="btn-primary text-sm flex items-center gap-1.5">
            <span>➕</span>
            <span>Create Drive with AI</span>
          </Link>
          <Link to="/coordinator/reports" className="btn-secondary text-sm flex items-center gap-1.5">
            <span>📈</span>
            <span>Analytics</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-5 border-l-4 border-l-primary-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Drives</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{activeDrives.length}</p>
          <p className="text-xs text-slate-400 mt-1">{drives.length} drives total</p>
        </div>
        <div className="card p-5 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{overview?.totalApplications ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">Across all drives</p>
        </div>
        <div className="card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shortlisted</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{overview?.totalShortlisted ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">AI-ranked & approved</p>
        </div>
        <div className="card p-5 border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{overview?.totalRejected ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">Criteria or skill mismatch</p>
        </div>
        <div className="card p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Offers Made</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{overview?.totalPlaced ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">Selected candidates</p>
        </div>
      </div>

      {/* Quick Drive Workflow Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Current Placement Drives</h2>
          <Link to="/coordinator/drives" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            View all drives →
          </Link>
        </div>

        {drives.length === 0 ? (
          <EmptyState
            icon={<span className="text-2xl">🏢</span>}
            title="No drives created yet"
            description="Create your first placement drive using the AI criteria extraction wizard"
            action={
              <Link to="/coordinator/drives/create" className="btn-primary text-sm mt-3">
                Create Drive
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drives.map((d) => (
              <div key={d.id} className="card p-5 flex flex-col justify-between hover:border-primary-300 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{d.title}</h3>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-sm text-slate-600 font-medium mt-1">{d.companies?.name || "Company"}</p>
                  
                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Role:</span>
                      <span className="font-medium text-slate-800">{d.role_title || "Software Engineer"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Package (CTC):</span>
                      <span className="font-semibold text-emerald-600">{d.ctc_lpa ? `₹${d.ctc_lpa} LPA` : "Not disclosed"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Deadline:</span>
                      <span className="font-medium text-slate-700">
                        {d.registration_deadline
                          ? new Date(d.registration_deadline).toLocaleDateString("en-IN", { dateStyle: "medium" })
                          : "Open"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Criteria Confirmed:</span>
                      <span className={d.criteria_confirmed ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                        {d.criteria_confirmed ? "✓ Confirmed" : "⚠️ Needs Review"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  <Link
                    to={`/coordinator/drives/${d.id}/manage`}
                    className="btn-secondary text-xs flex-1 text-center py-1.5"
                  >
                    Manage
                  </Link>
                  <Link
                    to={`/coordinator/drives/${d.id}/shortlist`}
                    className="btn-secondary text-xs flex-1 text-center py-1.5"
                  >
                    Shortlist
                  </Link>
                  <Link
                    to={`/coordinator/drives/${d.id}/schedule`}
                    className="btn-primary text-xs flex-1 text-center py-1.5"
                  >
                    Schedule
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Decision & Review Stream */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Student Applications & Decision Stream</h2>
            <p className="text-xs text-slate-500">Live reflection of shortlisted, applied, and rejected candidates across all criteria</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
            {["all", "shortlisted", "rejected", "applied", "selected"].map((tab) => {
              const count = tab === "all"
                ? (overview?.recentDecisions?.length ?? 0)
                : (overview?.recentDecisions?.filter((d) => d.status === tab).length ?? 0);
              const isActive = decisionFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDecisionFilter(tab)}
                  className={`px-3 py-1 rounded-md transition-all capitalize ${
                    isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filteredDecisions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No candidates matching filter "{decisionFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Student & Roll No</th>
                  <th className="px-4 py-3">Drive & Company</th>
                  <th className="px-4 py-3">Academics</th>
                  <th className="px-4 py-3">Match Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason / Evaluation</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDecisions.map((app) => {
                  const student = app.student_profiles || {};
                  const user = student.users || {};
                  const drive = app.drives || {};
                  const company = drive.companies || {};

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{user.name || "Student"}</p>
                        <p className="text-xs text-slate-400 font-mono">{student.roll_no || user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 text-xs line-clamp-1">{drive.title || "Drive"}</p>
                        <p className="text-xs text-slate-400">{company.name || "Company"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="badge bg-slate-100 text-slate-700 mr-1.5">{student.branch || "CSE"}</span>
                        <span>{student.cgpa} CGPA</span>
                        {student.backlogs > 0 && (
                          <span className="text-rose-600 font-bold ml-1.5">({student.backlogs} backlog)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-sm">
                        <span className={
                          (app.match_score ?? 0) >= 75
                            ? "text-emerald-600"
                            : (app.match_score ?? 0) >= 50
                            ? "text-amber-600"
                            : "text-rose-600"
                        }>
                          {app.match_score !== null && app.match_score !== undefined ? `${app.match_score}%` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs text-slate-600">
                        <p className="line-clamp-2">{app.status_reason || app.ai_reason || "Evaluated by placement criteria."}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/coordinator/drives/${app.drive_id}/shortlist`}
                          className="btn-ghost text-xs text-primary-600 hover:text-primary-700"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
