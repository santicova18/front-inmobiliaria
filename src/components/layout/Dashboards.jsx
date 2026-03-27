import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../utils/api";
import { StatCard, Card, Badge, PageHeader } from "../ui";

function formatCOP(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

export function AdminDashboard({ onNavigate }) {
  const { state, dispatch } = useApp();
  const [stats, setStats] = useState({ lotes: 0, disponibles: 0, vendidos: 0, clientes: 0, recaudado: 0, pqrsPendientes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getLotes(state.token),
      api.getCompras(state.token),
      Promise.resolve([]),
      api.getPQRS(state.token),
      api.getClientes(state.token),
    ]).then(([lotes, compras, pagos, pqrs, clientes]) => {
      dispatch({ type: "SET_LOTES", payload: lotes });
      dispatch({ type: "SET_COMPRAS", payload: compras });
      dispatch({ type: "SET_PAGOS", payload: pagos });
      dispatch({ type: "SET_PQRS", payload: pqrs });
      setStats({
        lotes: lotes.length,
        disponibles: lotes.filter(l => l.estado === "Disponible").length,
        vendidos: lotes.filter(l => l.estado === "Vendido").length,
        clientes: clientes.length,
        recaudado: pagos.reduce((s, p) => s + Number(p.monto), 0),
        pqrsPendientes: pqrs.filter(p => p.estado === "Pendiente").length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-96 text-emerald-500">
      <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const recentPQRS = state.pqrs.slice(0, 4);
  const recentCompras = state.compras.slice(0, 4);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
            {state.user?.nombre?.[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bienvenido, {state.user?.nombre?.split(" ")[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Panel de administración — InmoLotes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Lotes" value={stats.lotes} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
        } color="blue" />
        <StatCard label="Disponibles" value={stats.disponibles} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } color="teal" />
        <StatCard label="Vendidos" value={stats.vendidos} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
        } color="red" />
        <StatCard label="Clientes" value={stats.clientes} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
        } color="purple" />
        <StatCard label="Recaudado" value={formatCOP(stats.recaudado)} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
        } color="teal" />
        <StatCard label="PQRS Pend." value={stats.pqrsPendientes} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
        } color="amber" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Últimas compras */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Últimas Compras</h3>
            <button onClick={() => onNavigate("compras")} className="text-xs text-emerald-600 hover:text-emerald-700">Ver todas →</button>
          </div>
          {recentCompras.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Sin compras aún</p>
          ) : (
            <div className="space-y-3">
              {recentCompras.map(c => (
                <div key={c.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-slate-900">Lote #{c.lote_id}</p>
                    <p className="text-xs text-gray-500">{c.cliente_nombre || "Cliente"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{formatCOP(c.valor_total)}</p>
                    <p className="text-xs text-gray-500">{c.cuotas} cuotas</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* PQRS recientes */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-700">PQRS Recientes</h3>
            <button onClick={() => onNavigate("pqrs")} className="text-xs text-emerald-600 hover:text-emerald-700">Ver todas →</button>
          </div>
          {recentPQRS.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Sin PQRS aún</p>
          ) : (
            <div className="space-y-3">
              {recentPQRS.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm text-slate-900 truncate">{p.asunto}</p>
                    <p className="text-xs text-gray-500">{p.cliente_nombre || "Cliente"}</p>
                  </div>
                  <Badge variant={p.estado === "Pendiente" ? "warning" : p.estado === "Resuelto" ? "success" : "info"}>
                    {p.estado}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Distribución lotes */}
        <Card className="p-5 col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Estado del Inventario</h3>
          <div className="flex gap-4 items-center">
            <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden flex">
              {stats.lotes > 0 && <>
                <div style={{ width: `${(stats.disponibles / stats.lotes) * 100}%` }} className="bg-emerald-500 transition-all" title="Disponibles" />
                <div style={{ width: `${((stats.lotes - stats.disponibles - stats.vendidos) / stats.lotes) * 100}%` }} className="bg-amber-500" title="Reservados" />
                <div style={{ width: `${(stats.vendidos / stats.lotes) * 100}%` }} className="bg-red-500" title="Vendidos" />
              </>}
            </div>
          </div>
          <div className="flex gap-6 mt-3">
            {[["Disponibles", stats.disponibles, "bg-emerald-500"], ["Reservados", stats.lotes - stats.disponibles - stats.vendidos, "bg-amber-500"], ["Vendidos", stats.vendidos, "bg-red-500"]].map(([l, v, c]) => (
              <div key={l} className="flex items-center gap-2 text-xs text-gray-500">
                <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
                {l}: <span className="text-slate-900 font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ClienteDashboard({ onNavigate }) {
  const { state, notify } = useApp();
  const [compras, setCompras] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getMisCompras(state.token),
      Promise.resolve([]),
    ]).then(([c, p]) => {
      setCompras(c || []);
      setPagos((p || []).filter(pago => c?.some(compra => compra.id === pago.compra_id)));
    }).catch((err) => {
      console.error("Error loading client data:", err);
      setError(err.message || "Error al cargar los datos");
      notify("Error al cargar tus datos. Intenta de nuevo.", "error");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-96 text-emerald-500">
      <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalDeuda = compras.reduce((sum, c) => {
    const paid = pagos.filter(p => p.compra_id === c.id).reduce((s, p) => s + Number(p.monto), 0);
    return sum + (Number(c.valor_total) - paid);
  }, 0);
  const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
            {state.user?.nombre?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hola, {state.user?.nombre?.split(" ")[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Este es tu estado de cuenta InmoLotes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Lotes adquiridos" value={compras.length} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
        } color="teal" />
        <StatCard label="Total pagado" value={formatCOP(totalPagado)} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
        } color="blue" />
        <StatCard label="Saldo pendiente" value={formatCOP(totalDeuda)} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } color="amber" />
      </div>

      {compras.length === 0 ? (
        <Card className="p-8 text-center">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-gray-300 mx-auto mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
          <h3 className="text-slate-700 font-semibold mb-2">Aún no tienes lotes</h3>
          <p className="text-gray-500 text-sm">Cuando adquieras un lote aparecerá aquí</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-700">Mis Lotes</h2>
          {compras.map(compra => {
            const pagosList = pagos.filter(p => p.compra_id === compra.id);
            const saldo = Number(compra.valor_total) - pagosList.reduce((s, p) => s + Number(p.monto), 0);
            const prog = Math.min(100, ((Number(compra.valor_total) - saldo) / Number(compra.valor_total)) * 100);
            return (
              <Card key={compra.id} className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-slate-900 font-bold">Lote #{compra.lote_id}</h3>
                    <p className="text-gray-500 text-xs">Compra #{compra.id}</p>
                  </div>
                  <Badge variant={saldo <= 0 ? "success" : "warning"}>{saldo <= 0 ? "Cancelado" : "En cuotas"}</Badge>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: `${prog}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span>{prog.toFixed(1)}% pagado</span>
                  <span>Saldo: <strong className="text-amber-600">{formatCOP(saldo)}</strong></span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onNavigate("mis-pagos")}
                    className="flex-1 py-2 text-xs rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 font-semibold transition-colors">
                    Ver historial de pagos
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
