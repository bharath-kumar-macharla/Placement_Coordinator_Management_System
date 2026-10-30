import { useState, useEffect } from "react";
import { adminApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    adminApi.auditLogs()
      .then(({ data }) => setLogs(data.logs ?? []))
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

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="page-title">System Audit Log</h1>
        <p className="page-subtitle">
          Immutable trail of administrative decisions, shortlisting overrides, drive publishing, and schedule updates
        </p>
      </div>

      <div className="card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<span className="text-2xl">📝</span>}
              title="No audit entries recorded"
              description="System actions like criteria changes, shortlist approvals, and slot modifications will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Entity ID</th>
                  <th className="px-4 py-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const actor = log.users || {};
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 text-xs">{actor.name || "System"}</p>
                        <p className="text-[11px] text-slate-400">{actor.email || "system@automation"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="badge bg-slate-100 text-slate-800 text-xs font-mono font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs capitalize text-slate-700">
                        {log.entity_type}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-400">
                        {log.entity_id ? `${String(log.entity_id).substring(0, 8)}...` : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {(log.before || log.after) && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="btn-ghost text-xs py-1 px-2 text-primary-600 hover:text-primary-700"
                          >
                            View Diff
                          </button>
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

      {/* Diff / Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={`Audit Entry: ${selectedLog.action}`}
        >
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              <p>Action: <strong className="text-slate-800">{selectedLog.action}</strong></p>
              <p>Actor: <strong className="text-slate-800">{selectedLog.users?.name || "System"}</strong> ({selectedLog.users?.email})</p>
              <p>Timestamp: {new Date(selectedLog.created_at).toLocaleString()}</p>
            </div>

            {selectedLog.before && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">State Before:</p>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.before, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.after && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">State After:</p>
                <pre className="bg-slate-900 text-blue-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.after, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
