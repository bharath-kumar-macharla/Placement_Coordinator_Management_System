import { useEffect, useCallback } from "react";

const ICONS = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
    </svg>
  ),
};

const STYLES = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error:   "bg-red-50    border-red-200    text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info:    "bg-blue-50   border-blue-200   text-blue-800",
};

const ICON_STYLES = {
  success: "text-emerald-500",
  error:   "text-red-500",
  warning: "text-yellow-500",
  info:    "text-blue-500",
};

/**
 * Toast notification component.
 * Usage: manage state in parent, pass onClose to remove toast.
 */
export default function Toast({ message, type = "info", onClose, duration = 4000 }) {
  const close = useCallback(() => onClose?.(), [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const t = setTimeout(close, duration);
      return () => clearTimeout(t);
    }
  }, [close, duration]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-up max-w-sm w-full ${STYLES[type]}`}
    >
      <span className={`flex-shrink-0 mt-0.5 ${ICON_STYLES[type]}`}>{ICONS[type]}</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={close}
        aria-label="Dismiss notification"
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Toast container — fixed bottom-right.
 */
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end"
    >
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
