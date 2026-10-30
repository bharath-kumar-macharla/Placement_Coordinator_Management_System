import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { driveApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function DrivesList() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    driveApi.list()
      .then(({ data }) => setDrives(data.drives ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const filtered = drives.filter((d) => {
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.companies?.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.role_title?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Placement Drives</h1>
          <p className="page-subtitle">
            Manage company drives, run deterministic eligibility, and track rounds
          </p>
        </div>
        <Link to="/coordinator/drives/create" className="btn-primary text-sm flex items-center gap-2">
          <span>➕</span>
          <span>Create Drive</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, role, or title..."
          className="input-field text-sm flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field text-sm sm:w-48"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="shortlisting">Shortlisting</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">🏢</span>}
          title="No drives found"
          description="Try adjusting your filter or search query"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((d) => (
            <div key={d.id} className="card p-5 flex flex-col justify-between hover:border-primary-300 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{d.title}</h3>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-sm font-medium text-slate-600 mt-1">{d.companies?.name || "Company"}</p>

                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Role:</span>
                    <span className="font-medium text-slate-800">{d.role_title || "Engineer"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>CTC:</span>
                    <span className="font-semibold text-emerald-600">
                      {d.ctc_lpa ? `₹${d.ctc_lpa} LPA` : "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Deadline:</span>
                    <span className="font-medium text-slate-700">
                      {d.registration_deadline
                        ? new Date(d.registration_deadline).toLocaleDateString("en-IN", { dateStyle: "medium" })
                        : "Open"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
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
  );
}
