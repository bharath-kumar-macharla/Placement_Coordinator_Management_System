import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { applicationApi, notificationApi, scheduleApi } from "../../api/index.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

function KpiCard({ label, value, sub, color = "primary" }) {
  const colors = {
    primary: "bg-primary-50 text-primary-700",
    green:   "bg-emerald-50 text-emerald-700",
    yellow:  "bg-yellow-50  text-yellow-700",
    purple:  "bg-purple-50  text-purple-700",
  };
  return (
    <div className="kpi-card">
      <span className={`text-3xl font-bold ${colors[color].split(" ")[1]}`}>{value}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

export default function StudentDashboard() {
  const { user }    = useAuth();
  const [data, setData] = useState({ applications: [], notifications: [], schedule: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      applicationApi.mine(),
      notificationApi.list({ limit: 5 }),
      scheduleApi.mySchedule(),
    ])
      .then(([appsResult, notifResult, schedResult]) => {
        setData({
          applications:  appsResult.status === "fulfilled" ? (appsResult.value.data.applications ?? []) : [],
          notifications: notifResult.status === "fulfilled" ? (notifResult.value.data.notifications ?? []) : [],
          schedule:      schedResult.status === "fulfilled" ? (schedResult.value.data.slots ?? []) : [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const { applications, notifications, schedule } = data;
  const eligible    = applications.filter((a) => !["rejected", "withdrawn"].includes(a.status));
  const shortlisted = applications.filter((a) => ["shortlisted", "round_1", "round_2", "round_3", "selected"].includes(a.status));
  const selected    = applications.filter((a) => a.status === "selected");
  const upcoming    = schedule.filter((s) => new Date(s.start_time) > new Date() && s.status === "scheduled");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="page-title">Good day, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="page-subtitle">Here's your placement overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Eligible Drives" value={eligible.length} color="primary" />
        <KpiCard label="Shortlisted"     value={shortlisted.length} color="yellow" />
        <KpiCard label="Selected"        value={selected.length} color="green" />
        <KpiCard label="Upcoming Rounds" value={upcoming.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">My Applications</h2>
            <Link to="/student/applications" className="text-sm text-primary-600 hover:underline font-medium">View all</Link>
          </div>
          {applications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<span className="text-2xl">📋</span>}
                title="No applications yet"
                description="Browse open drives to apply"
                action={<Link to="/student/drives" className="btn-primary btn-sm">Browse Drives</Link>}
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {applications.slice(0, 5).map((app) => (
                <li key={app.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">
                      {app.drives?.title ?? "Drive"}
                    </p>
                    <p className="text-xs text-slate-400">{app.drives?.companies?.name}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming schedule */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Upcoming Rounds</h2>
            <Link to="/student/schedule" className="text-sm text-primary-600 hover:underline font-medium">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<span className="text-2xl">📅</span>}
                title="No upcoming rounds"
                description="Your scheduled interviews will appear here"
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.slice(0, 4).map((slot) => (
                <li key={slot.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{slot.rounds?.name}</p>
                      <p className="text-xs text-slate-400">{slot.rounds?.drives?.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📍 {slot.room} · {slot.rounds?.mode}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs font-semibold text-primary-600">
                        {new Date(slot.start_time).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(slot.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent notifications */}
      {notifications.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Notifications</h2>
            <Link to="/student/notifications" className="text-sm text-primary-600 hover:underline font-medium">View all</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {notifications.slice(0, 3).map((n) => (
              <li key={n.id} className={`flex items-start gap-3 px-5 py-3 ${!n.is_read ? "bg-primary-50/50" : ""}`}>
                <span className="text-lg mt-0.5">🔔</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 leading-snug">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
