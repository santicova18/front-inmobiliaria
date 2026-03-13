import { useApp } from "../context/AppContext";
import { useEffect } from "react";

// ─── Notification Toast ───────────────────────────────────────────────────────
export function Notification() {
  const { state, dispatch } = useApp();
  if (!state.notification) return null;
  const { message, type } = state.notification;
  const colors = {
    success: "bg-emerald-600 border-emerald-500",
    error: "bg-red-600 border-red-500",
    warning: "bg-amber-600 border-amber-500",
    info: "bg-sky-600 border-sky-500",
  };
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border text-white shadow-2xl ${colors[type] || colors.info} animate-slide-in`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => dispatch({ type: "CLEAR_NOTIFICATION" })} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = "md" }) {
  const s = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-10 h-10" : "w-6 h-6";
  return (
    <div className={`${s} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = "primary", size = "md", loading, className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    ghost: "hover:bg-slate-700 text-slate-300",
    outline: "border border-slate-600 hover:bg-slate-700 text-slate-200",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>}
      <input
        className={`w-full px-4 py-2.5 bg-slate-800 border ${error ? "border-red-500" : "border-slate-700"} rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>}
      <select
        className={`w-full px-4 py-2.5 bg-slate-800 border ${error ? "border-red-500" : "border-slate-700"} rounded-xl text-slate-100 focus:outline-none focus:border-teal-500 transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>}
      <textarea
        className={`w-full px-4 py-2.5 bg-slate-800 border ${error ? "border-red-500" : "border-slate-700"} rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors resize-none ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", ...props }) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-emerald-900/50 text-emerald-400 border border-emerald-700/50",
    warning: "bg-amber-900/50 text-amber-400 border border-amber-700/50",
    danger: "bg-red-900/50 text-red-400 border border-red-700/50",
    info: "bg-sky-900/50 text-sky-400 border border-sky-700/50",
    purple: "bg-violet-900/50 text-violet-400 border border-violet-700/50",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = "teal", trend }) {
  const colors = {
    teal: "from-teal-600/20 to-teal-800/10 border-teal-700/30 text-teal-400",
    amber: "from-amber-600/20 to-amber-800/10 border-amber-700/30 text-amber-400",
    blue: "from-blue-600/20 to-blue-800/10 border-blue-700/30 text-blue-400",
    red: "from-red-600/20 to-red-800/10 border-red-700/30 text-red-400",
    purple: "from-violet-600/20 to-violet-800/10 border-violet-700/30 text-violet-400",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && <span className={`text-xs font-semibold ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>{trend > 0 ? "+" : ""}{trend}%</span>}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}
