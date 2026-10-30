import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { driveApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function Drives() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    driveApi.eligible()
      .then(({ data }) => setItems(data.applications ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((a) =>
    !search ||
    a.drives?.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.drives?.companies?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Placement Drives</h1>
        <p className="page-subtitle">Drives you are eligible for based on your profile</p>
      </div>

      <input
        type="search"
        className="input max-w-sm"
        placeholder="Search drives or companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search drives"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">🏢</span>}
          title="No eligible drives"
          description="Update your profile (CGPA, branch, skills) to become eligible for more drives"
          action={<Link to="/student/profile" className="btn-primary btn-sm">Update Profile</Link>}
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((app) => {
            const drive = app.drives;
            const eligible = !["rejected", "withdrawn"].includes(app.status);
            const deadline = drive?.registration_deadline ? new Date(drive.registration_deadline) : null;
            const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <Link
                key={app.id}
                to={`/student/drives/${drive?.id}`}
                className="card-hover p-5 block"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{drive?.title}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-slate-500">{drive?.companies?.name} · {drive?.companies?.industry}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                      {drive?.ctc_lpa && <span>💰 {drive.ctc_lpa} LPA</span>}
                      {drive?.location && <span>📍 {drive.location}</span>}
                      {deadline && (
                        <span className={daysLeft !== null && daysLeft <= 3 ? "text-orange-500 font-medium" : ""}>
                          ⏰ {daysLeft !== null && daysLeft > 0 ? `${daysLeft}d left` : "Deadline passed"}
                        </span>
                      )}
                      {app.match_score !== null && (
                        <span className="text-primary-600 font-medium">🎯 {app.match_score}% match</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {eligible ? (
                      <span className="badge-green">✓ Eligible</span>
                    ) : (
                      <span className="badge-red">✗ Not eligible</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
