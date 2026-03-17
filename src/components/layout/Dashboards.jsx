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
      api.getPagos(state.token),
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
    <div className="flex justify-center items-center min-h-96 text-teal-400">
      <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const recentPQRS = state.pqrs.slice(0, 4);
  const recentCompras = state.compras.slice(0, 4);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Bienvenido, {state.user?.nombre?.split(" ")[0]} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Panel de administración — InmoLotes</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Lotes" value={stats.lotes} icon="◈" color="blue" />
        <StatCard label="Disponibles" value={stats.disponibles} icon="●" color="teal" />
        <StatCard label="Vendidos" value={stats.vendidos} icon="◉" color="red" />
        <StatCard label="Clientes" value={stats.clientes} icon="◍" color="purple" />
        <StatCard label="Recaudado" value={formatCOP(stats.recaudado).replace("$", "$\n")} icon="◆" color="teal" />
        <StatCard label="PQRS Pend." value={stats.pqrsPendientes} icon="◎" color="amber" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Últimas compras */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Últimas Compras</h3>
            <button onClick={() => onNavigate("compras")} className="text-xs text-teal-400 hover:text-teal-300">Ver todas →</button>
          </div>
          {recentCompras.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Sin compras aún</p>
          ) : (
            <div className="space-y-3">
              {recentCompras.map(c => (
                <div key={c.id} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm text-white">Lote #{c.lote_id}</p>
                    <p className="text-xs text-slate-400">{c.cliente_nombre || "Cliente"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-teal-400">{formatCOP(c.valor_total)}</p>
                    <p className="text-xs text-slate-500">{c.cuotas} cuotas</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* PQRS recientes */}
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-200">PQRS Recientes</h3>
            <button onClick={() => onNavigate("pqrs")} className="text-xs text-teal-400 hover:text-teal-300">Ver todas →</button>
          </div>
          {recentPQRS.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Sin PQRS aún</p>
          ) : (
            <div className="space-y-3">
              {recentPQRS.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm text-white truncate">{p.asunto}</p>
                    <p className="text-xs text-slate-400">{p.cliente_nombre || "Cliente"}</p>
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
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Estado del Inventario</h3>
          <div className="flex gap-4 items-center">
            <div className="flex-1 h-4 rounded-full bg-slate-700 overflow-hidden flex">
              {stats.lotes > 0 && <>
                <div style={{ width: `${(stats.disponibles / stats.lotes) * 100}%` }} className="bg-teal-500 transition-all" title="Disponibles" />
                <div style={{ width: `${((stats.lotes - stats.disponibles - stats.vendidos) / stats.lotes) * 100}%` }} className="bg-amber-500" title="Reservados" />
                <div style={{ width: `${(stats.vendidos / stats.lotes) * 100}%` }} className="bg-red-500" title="Vendidos" />
              </>}
            </div>
          </div>
          <div className="flex gap-6 mt-3">
            {[["Disponibles", stats.disponibles, "bg-teal-500"], ["Reservados", stats.lotes - stats.disponibles - stats.vendidos, "bg-amber-500"], ["Vendidos", stats.vendidos, "bg-red-500"]].map(([l, v, c]) => (
              <div key={l} className="flex items-center gap-2 text-xs text-slate-400">
                <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
                {l}: <span className="text-white font-semibold">{v}</span>
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
      api.getPagos(state.token),
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
    <div className="flex justify-center items-center min-h-96 text-teal-400">
      <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalDeuda = compras.reduce((sum, c) => {
    const paid = pagos.filter(p => p.compra_id === c.id).reduce((s, p) => s + Number(p.monto), 0);
    return sum + (Number(c.valor_total) - paid);
  }, 0);
  const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Hola, {state.user?.nombre?.split(" ")[0]} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Este es tu estado de cuenta InmoLotes</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Lotes adquiridos" value={compras.length} icon="◈" color="teal" />
        <StatCard label="Total pagado" value={formatCOP(totalPagado)} icon="◆" color="blue" />
        <StatCard label="Saldo pendiente" value={formatCOP(totalDeuda)} icon="◇" color="amber" />
      </div>

      {compras.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">◈</div>
          <h3 className="text-white font-semibold mb-2">Aún no tienes lotes</h3>
          <p className="text-slate-400 text-sm">Cuando adquieras un lote aparecerá aquí</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-200">Mis Lotes</h2>
          {compras.map(compra => {
            const pagosList = pagos.filter(p => p.compra_id === compra.id);
            const saldo = Number(compra.valor_total) - pagosList.reduce((s, p) => s + Number(p.monto), 0);
            const prog = Math.min(100, ((Number(compra.valor_total) - saldo) / Number(compra.valor_total)) * 100);
            return (
              <Card key={compra.id} className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-white font-bold">Lote #{compra.lote_id}</h3>
                    <p className="text-slate-400 text-xs">Compra #{compra.id}</p>
                  </div>
                  <Badge variant={saldo <= 0 ? "success" : "warning"}>{saldo <= 0 ? "Cancelado" : "En cuotas"}</Badge>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full" style={{ width: `${prog}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mb-4">
                  <span>{prog.toFixed(1)}% pagado</span>
                  <span>Saldo: <strong className="text-amber-400">{formatCOP(saldo)}</strong></span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onNavigate("mis-pagos")}
                    className="flex-1 py-2 text-xs rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold transition-colors">
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
