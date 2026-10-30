import { useState, useEffect } from "react";
import { scheduleApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

function groupByDate(slots) {
  const groups = {};
  for (const slot of slots) {
    const date = new Date(slot.start_time).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (!groups[date]) groups[date] = [];
    groups[date].push(slot);
  }
  return groups;
}

export default function Schedule() {
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scheduleApi.mySchedule()
      .then(({ data }) => setSlots(data.slots ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const upcoming = slots.filter((s) => new Date(s.start_time) >= new Date());
  const past     = slots.filter((s) => new Date(s.start_time) <  new Date());
  const grouped  = groupByDate(upcoming);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Schedule</h1>
        <p className="page-subtitle">{upcoming.length} upcoming interview{upcoming.length !== 1 ? "s" : ""}</p>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">📅</span>}
          title="No scheduled interviews"
          description="Your interview slots will appear here once the coordinator publishes the schedule"
        />
      ) : (
        <>
          {Object.entries(grouped).map(([date, daySlots]) => (
            <div key={date}>
              <h2 className="font-semibold text-slate-600 text-sm mb-3">{date}</h2>
              <div className="space-y-3">
                {daySlots.map((slot) => (
                  <div key={slot.id} className={`card p-5 ${slot.status === "rescheduled" ? "border-yellow-300 bg-yellow-50" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{slot.rounds?.name}</h3>
                          <StatusBadge status={slot.status} />
                        </div>
                        <p className="text-sm text-slate-500">{slot.rounds?.drives?.title}</p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>🕐 {new Date(slot.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          {" – "}{new Date(slot.end_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                          {slot.room && <span>📍 {slot.room}</span>}
                          <span>🖥️ {slot.rounds?.mode}</span>
                        </div>
                        {slot.clash_resolved_note && (
                          <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
                            ⚠️ Rescheduled: {slot.clash_resolved_note}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-400 flex-shrink-0">
                        <p className="font-semibold text-slate-700">{slot.rounds?.type?.toUpperCase()}</p>
                        <p>{slot.rounds?.duration_minutes} min</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {past.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700">
                Past interviews ({past.length})
              </summary>
              <div className="mt-3 space-y-2 opacity-60">
                {past.map((slot) => (
                  <div key={slot.id} className="card p-4 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>{slot.rounds?.name} — {slot.rounds?.drives?.title}</span>
                      <StatusBadge status={slot.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(slot.start_time).toLocaleDateString("en-IN")} · {slot.room}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
