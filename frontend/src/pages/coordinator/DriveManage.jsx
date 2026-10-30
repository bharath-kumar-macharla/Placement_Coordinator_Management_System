import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { driveApi, applicationApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";

export default function DriveManage() {
  const { id } = useParams();
  const [drive, setDrive] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningEligibility, setRunningEligibility] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [filter, setFilter] = useState("all");

  // Round creation modal
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [roundName, setRoundName] = useState("");
  const [roundType, setRoundType] = useState("technical");
  const [roundDuration, setRoundDuration] = useState(30);
  const [roundMode, setRoundMode] = useState("offline");
  const [creatingRound, setCreatingRound] = useState(false);

  // Selected student reason inspection
  const [inspectStudent, setInspectStudent] = useState(null);

  async function loadData() {
    try {
      const [driveRes, roundsRes, appsRes] = await Promise.all([
        driveApi.getById(id),
        driveApi.getRounds(id).catch(() => ({ data: { rounds: [] } })),
        applicationApi.list({ drive_id: id }).catch(() => ({ data: { applications: [] } })),
      ]);
      setDrive(driveRes.data.drive);
      setRounds(roundsRes.data.rounds ?? []);
      setApplications(appsRes.data.applications ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleRunEligibility(dryRun = false) {
    setRunningEligibility(true);
    try {
      const { data } = await driveApi.runEligibility(id, dryRun);
      setEligibilityResult(data);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to run eligibility");
    } finally {
      setRunningEligibility(false);
    }
  }

  async function handleCreateRound(e) {
    e.preventDefault();
    setCreatingRound(true);
    try {
      await driveApi.createRound(id, {
        name: roundName,
        type: roundType,
        duration_minutes: parseInt(roundDuration, 10),
        mode: roundMode,
        round_no: rounds.length + 1,
      });
      setShowRoundModal(false);
      setRoundName("");
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to create round");
    } finally {
      setCreatingRound(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!drive) {
    return (
      <EmptyState
        title="Drive not found"
        description="This drive does not exist or was deleted"
      />
    );
  }

  const filteredApps = applications.filter((app) => {
    if (filter === "all") return true;
    if (filter === "eligible") return app.status === "eligible";
    if (filter === "applied") return app.status === "applied";
    if (filter === "shortlisted") return app.status === "shortlisted";
    if (filter === "rejected") return app.status === "rejected";
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Drive Meta Header */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{drive.title}</h1>
            <StatusBadge status={drive.status} />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {drive.companies?.name} · {drive.role_title} · {drive.location}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
            <span>Package: <strong>{drive.ctc_lpa ? `₹${drive.ctc_lpa} LPA` : "Not disclosed"}</strong></span>
            <span>Deadline: <strong>{drive.registration_deadline ? new Date(drive.registration_deadline).toLocaleDateString() : "Open"}</strong></span>
            <span>Rounds: <strong>{rounds.length}</strong></span>
            <span>Applicants: <strong>{applications.length}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleRunEligibility(false)}
            disabled={runningEligibility}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            {runningEligibility ? (
              <>
                <Spinner size="sm" />
                <span>Running Rule Engine...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Run Eligibility Engine</span>
              </>
            )}
          </button>

          <Link
            to={`/coordinator/drives/${id}/shortlist`}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>⭐</span>
            <span>Shortlist Candidates</span>
          </Link>

          <Link
            to={`/coordinator/drives/${id}/schedule`}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>📅</span>
            <span>Schedule Rounds</span>
          </Link>

          <button
            onClick={() => setShowRoundModal(true)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Add Round</span>
          </button>
        </div>
      </div>

      {/* Eligibility Execution Banner if available */}
      {eligibilityResult && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span>
              Eligibility completed: <strong>{eligibilityResult.eligibleCount ?? 0} students eligible</strong>,{" "}
              {eligibilityResult.ineligibleCount ?? 0} ineligible across student database.
            </span>
          </div>
          <button
            onClick={() => setEligibilityResult(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Rounds Overview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800">Drive Rounds</h2>
          <button
            onClick={() => setShowRoundModal(true)}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            + Add Round
          </button>
        </div>
        {rounds.length === 0 ? (
          <p className="text-xs text-slate-400">No rounds configured yet. Click "Add Round" above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {rounds.map((r) => (
              <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="badge bg-primary-100 text-primary-800 text-[10px] font-semibold">
                    Round {r.round_no}
                  </span>
                  <span className="text-[11px] text-slate-400 uppercase font-medium">{r.mode}</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm mt-1">{r.name}</p>
                <p className="text-xs text-slate-500 capitalize">{r.type} · {r.duration_minutes} mins</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Eligibility & Application Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">Candidates & Eligibility Status</h2>
            <p className="text-xs text-slate-500">
              Students evaluated by the deterministic rule engine (CGPA, backlogs, branch, year)
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["all", "eligible", "applied", "shortlisted", "rejected"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 text-xs rounded-lg font-medium capitalize transition-all ${
                  filter === tab
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredApps.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<span className="text-2xl">📋</span>}
              title="No students match this filter"
              description="Click 'Run Eligibility Engine' above to check all students against drive criteria"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Branch & Year</th>
                  <th className="px-4 py-3">CGPA / Backlogs</th>
                  <th className="px-4 py-3">Match Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Reason & Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const student = app.student_profiles || {};
                  const user = student.users || {};
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{user.name || "Student"}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs">{student.roll_no || "—"}</td>
                      <td className="px-4 py-3.5 text-xs">
                        {student.branch || "—"} ({student.year || "—"})
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <span className="font-semibold text-slate-800">{student.cgpa ?? "—"}</span>
                        <span className="text-slate-400"> / {student.backlogs ?? 0} backlogs</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        {app.match_score !== null && app.match_score !== undefined ? (
                          <span className={`font-bold ${
                            app.match_score >= 70 ? "text-emerald-600" : app.match_score >= 50 ? "text-amber-600" : "text-slate-500"
                          }`}>
                            {app.match_score}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setInspectStudent(app)}
                          className="btn-ghost text-xs py-1 px-2.5 text-primary-600 hover:text-primary-700"
                        >
                          View Reasons
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Student Reasons Modal */}
      {inspectStudent && (
        <Modal
          isOpen={true}
          onClose={() => setInspectStudent(null)}
          title={`Eligibility & AI Evaluation: ${inspectStudent.student_profiles?.users?.name || "Student"}`}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Current Status</p>
              <div className="mt-1">
                <StatusBadge status={inspectStudent.status} />
              </div>
            </div>

            {inspectStudent.status_reason && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-700">Deterministic Rule Evaluation:</p>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{inspectStudent.status_reason}</p>
              </div>
            )}

            {inspectStudent.ai_reason && (
              <div className="p-3 bg-primary-50/40 rounded-lg border border-primary-200">
                <p className="text-xs font-semibold text-primary-900">AI Match Evaluation:</p>
                <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{inspectStudent.ai_reason}</p>
              </div>
            )}

            {inspectStudent.skill_gap && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Skill Gap Analysis:</p>
                <div className="flex flex-wrap gap-1">
                  {inspectStudent.skill_gap.missing?.map((s, idx) => (
                    <span key={idx} className="badge bg-red-50 text-red-700 border-red-200 text-xs">
                      Missing: {s}
                    </span>
                  ))}
                  {inspectStudent.skill_gap.matched?.map((s, idx) => (
                    <span key={idx} className="badge bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                      Matched: {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setInspectStudent(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Round Modal */}
      {showRoundModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowRoundModal(false)}
          title="Add Interview / Selection Round"
        >
          <form onSubmit={handleCreateRound} className="space-y-4">
            <div>
              <label className="label">Round Name *</label>
              <input
                type="text"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                placeholder="e.g. Technical Round 1 (System Design & DSA)"
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Round Type</label>
                <select
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value)}
                  className="input-field"
                >
                  <option value="aptitude">Aptitude Test</option>
                  <option value="technical">Technical Interview</option>
                  <option value="hr">HR Interview</option>
                  <option value="group_discussion">Group Discussion</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="label">Duration (Minutes)</label>
                <input
                  type="number"
                  min="10"
                  max="180"
                  value={roundDuration}
                  onChange={(e) => setRoundDuration(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Mode</label>
              <select
                value={roundMode}
                onChange={(e) => setRoundMode(e.target.value)}
                className="input-field"
              >
                <option value="offline">Offline (On-campus)</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRoundModal(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingRound}
                className="btn-primary text-xs"
              >
                {creatingRound ? "Adding..." : "Add Round"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
