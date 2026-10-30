import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { scheduleApi, driveApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function Scheduler() {
  const { id } = useParams();
  const [drive, setDrive] = useState(null);
  const [existingSlots, setExistingSlots] = useState([]);
  const [previewSlots, setPreviewSlots] = useState(null);
  const [clashMetrics, setClashMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Configuration Parameters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [dailyStartTime, setDailyStartTime] = useState("09:00");
  const [dailyEndTime, setDailyEndTime] = useState("17:00");
  const [roomsInput, setRoomsInput] = useState("Lab 101, Lab 102, Interview Room A, Interview Room B");
  const [slotDuration, setSlotDuration] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(15);

  async function loadSchedule() {
    try {
      const [driveRes, schedRes] = await Promise.all([
        driveApi.getById(id),
        scheduleApi.get(id).catch(() => ({ data: { slots: [] } })),
      ]);
      setDrive(driveRes.data.drive);
      setExistingSlots(schedRes.data.slots ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedule();
  }, [id]);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    setSuccessMessage("");
    try {
      const rooms = roomsInput
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const payload = {
        startDate,
        dailyStartTime,
        dailyEndTime,
        rooms,
        slotDuration: parseInt(slotDuration, 10),
        bufferMinutes: parseInt(bufferMinutes, 10),
      };

      const { data } = await scheduleApi.generate(id, payload);
      setPreviewSlots(data.slots ?? []);
      setClashMetrics({
        clashesDetected: data.clashesDetected ?? 0,
        clashesResolved: data.clashesResolved ?? 0,
        totalSlots: data.slots?.length ?? 0,
      });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to generate schedule preview");
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm() {
    if (!previewSlots || previewSlots.length === 0) return;
    setConfirming(true);
    try {
      await scheduleApi.confirm(id, { slots: previewSlots });
      setSuccessMessage("Schedule successfully published! Students have been notified.");
      setPreviewSlots(null);
      await loadSchedule();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to confirm schedule");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const slotsToDisplay = previewSlots || existingSlots;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to={`/coordinator/drives/${id}/manage`} className="text-slate-400 hover:text-slate-600 text-sm">
              ← {drive?.title || "Drive"}
            </Link>
          </div>
          <h1 className="page-title mt-1">Clash-Aware Drive Scheduler</h1>
          <p className="page-subtitle">
            Automated conflict detection across drives, round dependencies, and heuristic room allocation
          </p>
        </div>

        {previewSlots && previewSlots.length > 0 && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {confirming ? (
              <>
                <Spinner size="sm" />
                <span>Publishing Schedule...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Confirm & Publish Timetable</span>
              </>
            )}
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-700 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Clash Metrics Banner if preview generated */}
      {clashMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 border-l-4 border-l-primary-500">
            <p className="text-xs font-semibold text-slate-500">Preview Slots</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{clashMetrics.totalSlots}</p>
            <p className="text-xs text-slate-400 mt-0.5">Allocated across available rooms</p>
          </div>
          <div className="card p-4 border-l-4 border-l-amber-500 bg-amber-50/20">
            <p className="text-xs font-semibold text-amber-700">Clashes Caught</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{clashMetrics.clashesDetected}</p>
            <p className="text-xs text-amber-600 mt-0.5">Cross-drive conflicts identified</p>
          </div>
          <div className="card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/20">
            <p className="text-xs font-semibold text-emerald-700">Clashes Resolved</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{clashMetrics.clashesResolved}</p>
            <p className="text-xs text-emerald-600 mt-0.5">Resolved by priority policy</p>
          </div>
        </div>
      )}

      {/* Scheduler Configuration Form */}
      <form onSubmit={handleGenerate} className="card p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800">Timetable Generation Parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field text-sm"
              required
            />
          </div>

          <div>
            <label className="label">Daily Window</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={dailyStartTime}
                onChange={(e) => setDailyStartTime(e.target.value)}
                className="input-field text-sm"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="time"
                value={dailyEndTime}
                onChange={(e) => setDailyEndTime(e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>

          <div>
            <label className="label">Slot Duration (Mins)</label>
            <input
              type="number"
              min="15"
              max="120"
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="label">Buffer (Mins)</label>
            <input
              type="number"
              min="0"
              max="60"
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(e.target.value)}
              className="input-field text-sm"
            />
          </div>
        </div>

        <div>
          <label className="label">Available Interview Rooms / Labs (Comma-separated)</label>
          <input
            type="text"
            value={roomsInput}
            onChange={(e) => setRoomsInput(e.target.value)}
            placeholder="e.g. Lab 1, Lab 2, Interview Room 3..."
            className="input-field text-sm"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={generating}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {generating ? (
              <>
                <Spinner size="sm" />
                <span>Analyzing Cross-Drive Timelines...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Generate Conflict-Free Schedule Preview</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Slots Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {previewSlots ? "Schedule Preview (Pending Confirmation)" : "Published Schedule"}
            </h2>
            <p className="text-xs text-slate-500">
              {slotsToDisplay.length} interview slots allocated
            </p>
          </div>
          {previewSlots && (
            <span className="badge bg-amber-100 text-amber-800 border-amber-300 text-xs font-semibold">
              Preview Mode
            </span>
          )}
        </div>

        {slotsToDisplay.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<span className="text-2xl">📅</span>}
              title="No slots scheduled yet"
              description="Configure the rooms and time window above and click 'Generate Conflict-Free Schedule Preview'."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Round</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Room / Venue</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3">Clash Resolution Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slotsToDisplay.map((slot, index) => {
                  const student = slot.applications?.student_profiles || slot.student || {};
                  const user = student.users || {};
                  const round = slot.rounds || {};
                  const hasClashResolution = Boolean(slot.clash_resolved_note);

                  return (
                    <tr
                      key={slot.id ?? index}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        hasClashResolution ? "bg-amber-50/20" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{round.name || `Round ${round.round_no || 1}`}</p>
                        <p className="text-xs text-slate-400 capitalize">{round.type || "Interview"}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">{user.name || "Student"}</p>
                        <p className="text-xs text-slate-400 font-mono">{student.roll_no || user.email}</p>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-700 text-xs">
                        📍 {slot.room || "Room TBA"}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <p className="font-medium text-slate-800">
                          {new Date(slot.start_time).toLocaleDateString("en-IN", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-slate-500">
                          {new Date(slot.start_time).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          –{" "}
                          {new Date(slot.end_time).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={slot.status || "scheduled"} />
                      </td>

                      <td className="px-5 py-3.5 text-xs">
                        {hasClashResolution ? (
                          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-tight">
                            <span className="font-semibold">⚡ Clash Handled: </span>
                            {slot.clash_resolved_note}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">✓ No clash</span>
                        )}
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
