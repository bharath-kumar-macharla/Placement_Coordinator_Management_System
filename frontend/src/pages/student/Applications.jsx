import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { applicationApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";

function Timeline({ events }) {
  if (!events?.length) return <p className="text-sm text-slate-400 text-center py-4">No events yet</p>;
  return (
    <ol className="relative border-l border-slate-200 ml-3 space-y-4">
      {events.map((e, i) => (
        <li key={e.id ?? i} className="ml-6">
          <span className="absolute -left-2 mt-1 h-4 w-4 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-800">
              {e.from_status ? `${e.from_status} → ${e.to_status}` : e.to_status}
            </p>
            {e.reason && <p className="text-xs text-slate-500">{e.reason}</p>}
            <p className="text-xs text-slate-400">
              {new Date(e.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              {e.users?.name && ` · by ${e.users.name}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Applications() {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    applicationApi.mine()
      .then(({ data }) => setApps(data.applications ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function openTimeline(app) {
    setSelected(app);
    setTimelineLoading(true);
    try {
      const { data } = await applicationApi.timeline(app.id);
      setTimeline(data.timeline ?? []);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const activeApps = apps.filter((a) => !["withdrawn", "rejected"].includes(a.status));
  const pastApps   = apps.filter((a) => ["withdrawn", "rejected"].includes(a.status));

  function AppCard({ app }) {
    return (
      <div className="card p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{app.drives?.title}</h3>
            <p className="text-sm text-slate-400">{app.drives?.companies?.name}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          {app.match_score !== null && <span>🎯 {app.match_score}% match</span>}
          <span>Applied {new Date(app.created_at).toLocaleDateString("en-IN")}</span>
        </div>
        {app.status_reason && (
          <p className="text-xs text-red-600 mt-2 bg-red-50 px-3 py-2 rounded-lg">{app.status_reason}</p>
        )}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <button onClick={() => openTimeline(app)} className="btn-ghost btn-sm">
            View Timeline
          </button>
          <Link to={`/student/drives/${app.drives?.id}`} className="btn-secondary btn-sm">
            Drive Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Applications</h1>
        <p className="page-subtitle">{apps.length} total application{apps.length !== 1 ? "s" : ""}</p>
      </div>

      {apps.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title="No applications yet"
          description="Browse eligible drives and apply"
          action={<Link to="/student/drives" className="btn-primary btn-sm">Browse Drives</Link>}
        />
      ) : (
        <>
          {activeApps.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-700 mb-3">Active</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {activeApps.map((a) => <AppCard key={a.id} app={a} />)}
              </div>
            </div>
          )}
          {pastApps.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-500 mb-3">Past</h2>
              <div className="grid gap-4 sm:grid-cols-2 opacity-70">
                {pastApps.map((a) => <AppCard key={a.id} app={a} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Timeline Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Status Timeline — ${selected?.drives?.title ?? ""}`}>
        {timelineLoading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <Timeline events={timeline} />
        )}
      </Modal>
    </div>
  );
}
