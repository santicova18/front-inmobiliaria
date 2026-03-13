import { useState } from "react";
import { useApp } from "../../context/AppContext";

const adminNavItems = [
  { key: "dashboard", label: "Dashboard", icon: "⬡", },
  { key: "lotes", label: "Gestión de Lotes", icon: "◈" },
  { key: "compras", label: "Compras", icon: "◉" },
  { key: "pagos", label: "Pagos", icon: "◆" },
  { key: "pqrs", label: "PQRS", icon: "◎" },
  { key: "proyecto", label: "Proyecto", icon: "◇" },
  { key: "clientes", label: "Clientes", icon: "◍" },
];

const clienteNavItems = [
  { key: "dashboard", label: "Mi Panel", icon: "⬡" },
  { key: "mis-lotes", label: "Mis Lotes", icon: "◈" },
  { key: "mis-pagos", label: "Mis Pagos", icon: "◆" },
  { key: "mis-pqrs", label: "Mis PQRS", icon: "◎" },
  { key: "proyecto", label: "El Proyecto", icon: "◇" },
];

export function Sidebar({ activePage, onNavigate }) {
  const { state, dispatch } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = state.role === "admin" ? adminNavItems : clienteNavItems;

  return (
    <aside className={`${collapsed ? "w-16" : "w-60"} shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 h-screen sticky top-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">IL</div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm leading-none">InmoLotes</div>
            <div className="text-slate-500 text-xs mt-0.5">{state.role === "admin" ? "Administrador" : "Cliente"}</div>
          </div>
        )}
        <button className="ml-auto text-slate-500 hover:text-slate-300" onClick={() => setCollapsed(!collapsed)}>
          <svg className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
              activePage === item.key
                ? "bg-teal-600/20 text-teal-400 border border-teal-700/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
              {state.user?.nombre?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-200 text-xs font-semibold truncate">{state.user?.nombre || "Usuario"}</div>
              <div className="text-slate-500 text-xs truncate">{state.user?.correo || ""}</div>
            </div>
            <button onClick={() => dispatch({ type: "LOGOUT" })} className="text-slate-500 hover:text-red-400 transition-colors" title="Cerrar sesión">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <button onClick={() => dispatch({ type: "LOGOUT" })} className="w-full flex justify-center text-slate-500 hover:text-red-400 py-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}

export function TopBar({ title }) {
  return (
    <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 py-4">
      <h1 className="text-slate-200 font-semibold text-sm">{title}</h1>
    </header>
  );
}
