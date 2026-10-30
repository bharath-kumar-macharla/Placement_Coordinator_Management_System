import { useState, useEffect } from "react";
import { notificationApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadNotifications() {
    try {
      const { data } = await notificationApi.list();
      setNotifications(data.notifications ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkRead(id) {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    setActionLoading(true);
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up! No unread notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={actionLoading}
            className="btn-secondary text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">🔔</span>}
          title="No notifications yet"
          description="When placement drives match your profile or schedules update, you'll be notified here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card p-4 transition-all flex items-start gap-4 ${
                !n.is_read ? "border-l-4 border-l-primary-500 bg-primary-50/20" : ""
              }`}
            >
              <div className="text-2xl pt-0.5">
                {n.type === "drive_match"
                  ? "🎯"
                  : n.type === "schedule" || n.type === "clash_resolved"
                  ? "📅"
                  : n.type === "deadline"
                  ? "⏰"
                  : n.type === "shortlist"
                  ? "⭐"
                  : "ℹ️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-sm ${
                      !n.is_read
                        ? "font-semibold text-slate-900"
                        : "font-medium text-slate-700"
                    }`}
                  >
                    {n.title}
                  </h3>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(n.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                  {n.body}
                </p>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
