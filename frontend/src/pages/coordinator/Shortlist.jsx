import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { applicationApi, driveApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";

export default function Shortlist() {
  const { id } = useParams();
  const [drive, setDrive] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [overrideModalApp, setOverrideModalApp] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState("selected");
  const [overrideReason, setOverrideReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [candidateFilter, setCandidateFilter] = useState("all");

  async function loadShortlist() {
    try {
      const [driveRes, shortlistRes] = await Promise.all([
        driveApi.getById(id),
        applicationApi.shortlist(id),
      ]);
      setDrive(driveRes.data.drive);
      const list = shortlistRes.data.candidates ?? shortlistRes.data.shortlist ?? [];
      setCandidates(list);

      // Pre-select already shortlisted or top match candidates
      const preselected = new Set(
        list
          .filter((c) => c.status === "shortlisted" || (c.match_score >= 65 && c.status === "applied"))
          .map((c) => c.id)
      );
      setSelectedIds(preselected);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShortlist();
  }, [id]);

  function toggleCandidate(appId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }

  const filteredCandidates = candidates.filter((c) => {
    if (candidateFilter === "all") return true;
    return c.status === candidateFilter;
  });

  function toggleAll() {
    if (selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map((c) => c.id)));
    }
  }

  async function handleQuickDecision(appId, newStatus, reason = "") {
    setSubmitting(true);
    try {
      if (newStatus === "selected") {
        await applicationApi.approveShortlist(id, {
          approvedIds: [],
          rejectedIds: [],
          selectedIds: [appId],
          reasonOverrides: { [appId]: reason || "Selected: Formal placement offer extended." },
        });
        setActionSuccess("Candidate marked as Selected! Placement offer extended.");
      } else if (newStatus === "shortlisted") {
        await applicationApi.approveShortlist(id, {
          approvedIds: [appId],
          rejectedIds: [],
          selectedIds: [],
          reasonOverrides: { [appId]: reason || "Approved by coordinator" },
        });
        setActionSuccess("Candidate shortlisted successfully.");
      } else if (newStatus === "rejected") {
        await applicationApi.approveShortlist(id, {
          approvedIds: [],
          rejectedIds: [appId],
          selectedIds: [],
          reasonOverrides: { [appId]: reason || "Rejected by coordinator" },
        });
        setActionSuccess("Candidate rejected.");
      }
      await loadShortlist();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to update candidate decision");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBatchDecision(actionType) {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    setActionSuccess("");
    try {
      const ids = Array.from(selectedIds);
      if (actionType === "selected") {
        await applicationApi.approveShortlist(id, {
          approvedIds: [],
          selectedIds: ids,
          rejectedIds: [],
          reasonOverrides: ids.reduce((acc, curr) => ({ ...acc, [curr]: "Selected: Placement offer extended." }), {}),
        });
        setActionSuccess(`Marked ${ids.length} candidate(s) as Selected! Placement offers extended.`);
      } else if (actionType === "shortlist") {
        await applicationApi.approveShortlist(id, {
          approvedIds: ids,
          selectedIds: [],
          rejectedIds: [],
        });
        setActionSuccess(`Shortlisted ${ids.length} candidate(s).`);
      } else if (actionType === "reject") {
        await applicationApi.approveShortlist(id, {
          approvedIds: [],
          selectedIds: [],
          rejectedIds: ids,
        });
        setActionSuccess(`Rejected ${ids.length} candidate(s).`);
      }
      await loadShortlist();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to execute batch update");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSingleOverride() {
    if (!overrideModalApp) return;
    setSubmitting(true);
    try {
      await applicationApi.approveShortlist(id, {
        approvedIds: overrideStatus === "shortlisted" ? [overrideModalApp.id] : [],
        selectedIds: overrideStatus === "selected" ? [overrideModalApp.id] : [],
        rejectedIds: overrideStatus === "rejected" ? [overrideModalApp.id] : [],
        reasonOverrides: { [overrideModalApp.id]: overrideReason || `Status overridden to ${overrideStatus} by coordinator` },
      });
      setOverrideModalApp(null);
      setOverrideReason("");
      setActionSuccess(`Candidate ${overrideModalApp.student_profiles?.users?.name} updated to ${overrideStatus}.`);
      await loadShortlist();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to submit override");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to={`/coordinator/drives/${id}/manage`} className="text-slate-400 hover:text-slate-600 text-sm">
              ← {drive?.title || "Drive"}
            </Link>
          </div>
          <h1 className="page-title mt-1">Shortlist & Candidate Selection Hub</h1>
          <p className="page-subtitle">
            Ranked by AI match score & criteria evaluation. Review, shortlist, reject, or directly extend final offers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleBatchDecision("shortlist")}
            disabled={submitting || selectedIds.size === 0}
            className="btn-primary text-sm flex items-center gap-1.5"
            title="Approve / Shortlist selected candidates"
          >
            <span>✓</span>
            <span>Shortlist Selected ({selectedIds.size})</span>
          </button>
          <button
            onClick={() => handleBatchDecision("selected")}
            disabled={submitting || selectedIds.size === 0}
            className="btn-secondary text-sm flex items-center gap-1.5 text-purple-700 border-purple-300 hover:bg-purple-50 font-semibold"
            title="Mark selected candidates as Selected (Extend Final Offer)"
          >
            <span>★</span>
            <span>Mark Selected / Offer ({selectedIds.size})</span>
          </button>
          <button
            onClick={() => handleBatchDecision("reject")}
            disabled={submitting || selectedIds.size === 0}
            className="btn-secondary text-sm flex items-center gap-1.5 text-rose-700 border-rose-300 hover:bg-rose-50"
            title="Reject selected candidates"
          >
            <span>✕</span>
            <span>Reject Selected ({selectedIds.size})</span>
          </button>
          <Link
            to={`/coordinator/drives/${id}/schedule`}
            className="btn-ghost text-sm flex items-center gap-1.5 text-slate-700 hover:text-slate-900 border border-slate-200"
          >
            <span>📅</span>
            <span>Schedule Slots →</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold">
            ✕
          </button>
        </div>
      )}

      {/* Summary Chips - 5 Phases */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-3.5">
          <p className="text-xs text-slate-500 font-medium">Total Applicants</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{candidates.length}</p>
        </div>
        <div className="card p-3.5 border-l-4 border-l-blue-500">
          <p className="text-xs text-slate-500 font-medium">Shortlisted</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {candidates.filter((c) => c.status === "shortlisted").length}
          </p>
        </div>
        <div className="card p-3.5 border-l-4 border-l-purple-500">
          <p className="text-xs text-slate-500 font-medium">Selected / Offers</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            {candidates.filter((c) => c.status === "selected").length}
          </p>
        </div>
        <div className="card p-3.5 border-l-4 border-l-rose-500">
          <p className="text-xs text-slate-500 font-medium">Rejected</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {candidates.filter((c) => c.status === "rejected").length}
          </p>
        </div>
        <div className="card p-3.5 border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-500 font-medium">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {candidates.filter((c) => c.status === "applied").length}
          </p>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-xs font-semibold text-slate-700">
              Select Visible ({selectedIds.size}/{filteredCandidates.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
            {["all", "shortlisted", "selected", "rejected", "applied"].map((tab) => {
              const count = tab === "all"
                ? candidates.length
                : candidates.filter((c) => c.status === tab).length;
              const isActive = candidateFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCandidateFilter(tab)}
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

        {filteredCandidates.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<span className="text-2xl">👥</span>}
              title={`No ${candidateFilter} applicants found`}
              description="Candidates will appear here as their applications are processed."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">Select</th>
                  <th className="px-4 py-3">Rank & Student</th>
                  <th className="px-4 py-3">Academics</th>
                  <th className="px-4 py-3">Match Score</th>
                  <th className="px-5 py-3">AI Explanation & Status Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((app, index) => {
                  const student = app.student_profiles || {};
                  const user = student.users || {};
                  const isChecked = selectedIds.has(app.id);
                  const isLowConfidence = app.confidence !== undefined && app.confidence < 0.7;

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? "bg-primary-50/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCandidate(app.id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 text-center text-xs font-bold text-slate-400">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name || "Student"}</p>
                            <p className="text-xs text-slate-400 font-mono">{student.roll_no || user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-medium text-slate-800">{student.branch} · {student.year}</p>
                        <p className="text-slate-500">{student.cgpa} CGPA · {student.backlogs ?? 0} backlogs</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-base font-bold ${
                              (app.match_score ?? 0) >= 75
                                ? "text-emerald-600"
                                : (app.match_score ?? 0) >= 50
                                ? "text-amber-600"
                                : "text-rose-600"
                            }`}
                          >
                            {app.match_score !== null && app.match_score !== undefined
                              ? `${app.match_score}%`
                              : "—"}
                          </span>
                          {isLowConfidence && (
                            <span className="badge bg-amber-100 text-amber-800 border-amber-300 text-[10px]" title="AI confidence below threshold — human review advised">
                              ⚠️ Review
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs max-w-md">
                        <p className="text-slate-700 leading-snug line-clamp-2">
                          {app.status_reason || app.ai_reason || "Deterministic match computed from skills and criteria."}
                        </p>
                        {app.skill_gap?.missing?.length > 0 && (
                          <p className="text-[11px] text-rose-600 mt-1 line-clamp-1">
                            Missing: {app.skill_gap.missing.slice(0, 3).join(", ")}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status !== "selected" && (
                            <button
                              type="button"
                              onClick={() => handleQuickDecision(app.id, "selected")}
                              disabled={submitting}
                              className="btn-secondary text-[11px] py-1 px-2.5 text-purple-700 border-purple-300 hover:bg-purple-50 font-semibold flex items-center gap-1 shadow-2xs"
                              title="Mark Selected / Extend Offer"
                            >
                              <span>★</span>
                              <span>Select</span>
                            </button>
                          )}
                          {app.status !== "shortlisted" && (
                            <button
                              type="button"
                              onClick={() => handleQuickDecision(app.id, "shortlisted")}
                              disabled={submitting}
                              className="btn-secondary text-[11px] py-1 px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              title="Approve / Shortlist candidate"
                            >
                              ✓ Shortlist
                            </button>
                          )}
                          {app.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => handleQuickDecision(app.id, "rejected")}
                              disabled={submitting}
                              className="btn-secondary text-[11px] py-1 px-2 text-rose-700 border-rose-300 hover:bg-rose-50"
                              title="Reject candidate"
                            >
                              ✕ Reject
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setOverrideModalApp(app);
                              setOverrideStatus(app.status === "selected" ? "selected" : app.status === "rejected" ? "rejected" : "shortlisted");
                              setOverrideReason(app.status_reason || "");
                            }}
                            className="btn-ghost text-[11px] py-1 px-2 text-slate-600 hover:text-primary-600"
                          >
                            Override
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Override Reason Modal */}
      {overrideModalApp && (
        <Modal
          isOpen={true}
          onClose={() => setOverrideModalApp(null)}
          title={`Coordinator Override: ${overrideModalApp.student_profiles?.users?.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Provide a rationale for manually adjusting this candidate's placement status. This decision will be logged in audit history and candidate notification events.
            </p>
            <div>
              <label className="label text-xs font-semibold text-slate-700">Target Decision Status *</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="input-field text-xs mt-1"
              >
                <option value="selected">★ Selected (Offer Extended)</option>
                <option value="shortlisted">✓ Shortlisted (Advanced to Round)</option>
                <option value="rejected">✕ Rejected (Does Not Meet Criteria)</option>
                <option value="applied">⏳ Applied (Pending Review)</option>
              </select>
            </div>
            <div>
              <label className="label text-xs font-semibold text-slate-700">Evaluation Justification / Remarks *</label>
              <textarea
                rows={4}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Candidate demonstrated exemplary system design and problem solving in technical rounds..."
                className="input-field text-sm mt-1"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOverrideModalApp(null)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSingleOverride}
                disabled={submitting || !overrideReason.trim()}
                className="btn-primary text-xs"
              >
                Save Decision & Update
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
