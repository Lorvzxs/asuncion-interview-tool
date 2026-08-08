import { useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (message, type = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  return { toasts, addToast, dismissToast };
}

function ToastItem({ toast, onDismiss }) {
  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm px-4 py-3 rounded-xl glass-card border shadow-lg ${
        toast.exiting ? 'toast-exit' : 'toast-enter'
      } ${isSuccess ? 'border-emerald-200/80' : 'border-red-200/80'}`}
      role="alert"
    >
      {isSuccess ? (
        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 success-pop" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      )}
      <p className="flex-1 text-sm font-medium text-slate-700 leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-0.5 text-slate-400 hover:text-slate-600 ui-transition cursor-pointer shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
