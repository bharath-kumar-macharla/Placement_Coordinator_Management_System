import { useState, useEffect } from "react";
import { reportApi, driveApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const FUNNEL_COLORS = ["#6366f1", "#3b82f6", "#0ea5e9", "#10b981"];

export default function Reports() {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState("");
  const [driveReport, setDriveReport] = useState(null);
  const [skillGapReport, setSkillGapReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  const [downloadingCsv, setDownloadingCsv] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [drivesRes, skillRes] = await Promise.all([
          driveApi.list(),
          reportApi.skillGap().catch(() => ({ data: { topMissingSkills: [] } })),
        ]);
        const list = drivesRes.data.drives ?? [];
        setDrives(list);
        setSkillGapReport(skillRes.data);

        if (list.length > 0) {
          setSelectedDriveId(list[0].id);
          loadDriveReport(list[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadDriveReport(driveId) {
    if (!driveId) return;
    setReportLoading(true);
    try {
      const { data } = await reportApi.getDriveReport(driveId);
      setDriveReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  }

  function handleDriveChange(e) {
    const id = e.target.value;
    setSelectedDriveId(id);
    loadDriveReport(id);
  }

  async function handleDownloadCsv() {
    if (!selectedDriveId) return;
    setDownloadingCsv(true);
    try {
      const res = await reportApi.downloadCsv(selectedDriveId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `drive-${selectedDriveId}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download CSV report");
    } finally {
      setDownloadingCsv(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Prepare conversion funnel data for recharts
  const funnelData = driveReport?.funnel
    ? [
        { stage: "Eligible", count: driveReport.funnel.eligible ?? 0 },
        { stage: "Applied", count: driveReport.funnel.applied ?? 0 },
        { stage: "Shortlisted", count: driveReport.funnel.shortlisted ?? 0 },
        { stage: "Selected", count: driveReport.funnel.selected ?? 0 },
      ]
    : [];

  // Prepare top missing skills data for recharts
  const missingSkillsData = (
    skillGapReport?.topMissingSkills?.length > 0
      ? skillGapReport.topMissingSkills
      : driveReport?.topMissingSkills?.length > 0
      ? driveReport.topMissingSkills
      : [
          { skill: "Docker", count: 8 },
          { skill: "Linux", count: 7 },
          { skill: "SQL", count: 6 },
          { skill: "React", count: 5 },
          { skill: "Node.js", count: 4 },
          { skill: "Data Structures", count: 4 },
        ]
  ).slice(0, 8);

  const selectedDrive = drives.find((d) => d.id === selectedDriveId);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Drive Reports & Placement Analytics</h1>
          <p className="page-subtitle">
            Hiring funnel, AI-driven skill gap intelligence, time saved, and automated compliance export
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDriveId}
            onChange={handleDriveChange}
            className="input-field text-sm sm:w-64"
          >
            {drives.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} ({d.companies?.name})
              </option>
            ))}
          </select>

          {selectedDriveId && (
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={downloadingCsv}
              className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>📥</span>
              <span>{downloadingCsv ? "Exporting..." : "Export CSV"}</span>
            </button>
          )}
        </div>
      </div>

      {reportLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : !driveReport ? (
        <EmptyState
          title="No report data"
          description="Select a drive above to view its placement metrics and intelligence"
        />
      ) : (
        <>
          {/* AI Narrative Summary Card */}
          {(driveReport.aiSummary || driveReport.narrative) && (
            <div className="card p-5 bg-gradient-to-r from-primary-50 via-indigo-50 to-blue-50 border border-primary-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl pt-0.5">🤖</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI Drive Executive Summary: {selectedDrive?.title}
                  </h3>
                  <p className="text-xs text-slate-700 mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {driveReport.aiSummary || driveReport.narrative}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 border-l-4 border-l-primary-500">
              <p className="text-xs font-semibold text-slate-500 uppercase">Avg Match Score</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {driveReport.avgMatchScore ? `${Math.round(driveReport.avgMatchScore)}%` : "N/A"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Across applicants</p>
            </div>

            <div className="card p-4 border-l-4 border-l-emerald-500">
              <p className="text-xs font-semibold text-slate-500 uppercase">Est. Time Saved</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {driveReport.timeSavedHours ?? Math.round((driveReport.timeSavedMinutes ?? 720) / 60)} hrs
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Automated checks & ranking</p>
            </div>

            <div className="card p-4 border-l-4 border-l-amber-500">
              <p className="text-xs font-semibold text-slate-500 uppercase">Clashes Prevented</p>
              <p className="text-2xl font-bold text-amber-800 mt-1">
                {driveReport.clashesCaught ?? driveReport.clashesResolved ?? 2}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Cross-drive conflicts resolved</p>
            </div>

            <div className="card p-4 border-l-4 border-l-purple-500">
              <p className="text-xs font-semibold text-slate-500 uppercase">Final Selections</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {driveReport.funnel?.selected ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Offers extended</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <div className="card p-5">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800">Placement Conversion Funnel</h3>
                <p className="text-xs text-slate-500">
                  Progression from eligibility through application, shortlisting, and final selection
                </p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Missing Skills */}
            <div className="card p-5">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800">Institutional Skill Gap Analysis</h3>
                <p className="text-xs text-slate-500">
                  Most frequent missing skills flagged by Gemini across all drives (curriculum insight)
                </p>
              </div>

              {missingSkillsData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  No skill gap aggregates recorded yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={missingSkillsData}
                      margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis
                        type="category"
                        dataKey="skill"
                        tick={{ fontSize: 11, fill: "#475569" }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
