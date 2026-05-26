import { useState, useEffect, useCallback } from "react";

/**
 * Toast Component - Notifikasi alert
 *
 * Merah tegas untuk error fatal, hijau untuk sukses,
 * kuning untuk peringatan. Auto-dismiss 5 detik.
 */
export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  const styles = {
    error: {
      bg: "bg-red-950/90 border-red-500/60",
      icon: "🚨",
      bar: "bg-red-500",
      title: "text-red-300",
    },
    success: {
      bg: "bg-emerald-950/90 border-emerald-500/60",
      icon: "✅",
      bar: "bg-emerald-500",
      title: "text-emerald-300",
    },
    warning: {
      bg: "bg-amber-950/90 border-amber-500/60",
      icon: "⚠️",
      bar: "bg-amber-500",
      title: "text-amber-300",
    },
  };

  const style = styles[toast.type] || styles.error;

  return (
    <div
      className={`
        pointer-events-auto
        ${isExiting ? "animate-slide-out-right" : "animate-slide-in-right"}
        ${style.bg}
        backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden
      `}
    >
      {/* Progress bar */}
      <div className={`h-1 ${style.bar}`} style={{
        animation: "shrink 5s linear forwards",
      }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${style.title} mb-1`}>
              {toast.title || (toast.type === "error" ? "Error" : toast.type === "success" ? "Berhasil" : "Peringatan")}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed break-words">
              {toast.message}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0 p-1"
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/**
 * Custom Hook: useToast
 * Mengelola state toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
