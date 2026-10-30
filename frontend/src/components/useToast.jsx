import { useCallback, useState } from "react";
import { ToastContainer } from "./Toast.jsx";

let _toastId = 0;

/**
 * Hook to manage toasts.
 * Returns { toasts, toast, ToastContainerEl }
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const ToastContainerEl = (
    <ToastContainer toasts={toasts} removeToast={removeToast} />
  );

  return { toasts, toast, ToastContainerEl };
}
