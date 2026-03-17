import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../utils/api";
import { Card, Badge, PageHeader, StatCard, EmptyState, Modal } from "../ui";

function formatCOP(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

function ClienteDetalle({ cliente, onClose }) {
  const { state } = useApp();
  const [compras, setCompras] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getComprasByCliente(cliente.id, state.token),
      Promise.resolve([]),
    ]).then(([c, p]) => {
      setCompras(c);
      setPagos(p.filter(pago => c.some(compra => compra.id === pago.compra_id)));
    }).finally(() => setLoading(false));
  }, [cliente.id]);

  const totalDeuda = compras.reduce((sum, c) => {
    const paid = pagos.filter(p => p.compra_id === c.id).reduce((s, p) => s + Number(p.monto), 0);
    return sum + Math.max(0, Number(c.valor_total) - paid);
  }, 0);

  return (
    <Modal open onClose={onClose} title={`Cliente: ${cliente.nombre}`} size="lg">
      {loading ? (
        <div className="flex justify-center py-10 text-teal-400">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Info personal */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Correo</p>
              <p className="text-sm text-white">{cliente.correo}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Teléfono</p>
              <p className="text-sm text-white">{cliente.telefono || "—"}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Saldo pendiente</p>
              <p className="text-sm font-bold text-amber-400">{formatCOP(totalDeuda)}</p>
            </div>
          </div>

          {/* Compras */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">
              Compras ({compras.length})
            </h4>
            {compras.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Sin compras registradas</p>
            ) : (
              <div className="space-y-3">
                {compras.map(c => {
                  const pagosList = pagos.filter(p => p.compra_id === c.id);
                  const pagado = pagosList.reduce((s, p) => s + Number(p.monto), 0);
                  const saldo = Math.max(0, Number(c.valor_total) - pagado);
                  const prog = Math.min(100, (pagado / Number(c.valor_total)) * 100);
                  return (
                    <div key={c.id} className="bg-slate-800 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white text-sm font-semibold">Lote #{c.lote_id}</span>
                        <Badge variant={saldo <= 0 ? "success" : "warning"}>
                          {saldo <= 0 ? "Saldado" : "En cuotas"}
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{prog.toFixed(0)}% — {pagosList.length}/{c.cuotas} cuotas</span>
                        <span>Saldo: <strong className="text-amber-400">{formatCOP(saldo)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Últimos pagos */}
          {pagos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">
                Últimos pagos
              </h4>
              <div className="divide-y divide-slate-700 bg-slate-800 rounded-xl overflow-hidden">
                {[...pagos].reverse().slice(0, 5).map(p => (
                  <div key={p.id} className="flex justify-between items-center px-4 py-3">
                    <div>
                      <p className="text-sm text-white">{new Date(p.fecha).toLocaleDateString("es-CO")}</p>
                      <p className="text-xs text-slate-500">{p.referencia || "Sin referencia"}</p>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm">{formatCOP(p.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function GestionClientes() {
  const { state } = useApp();
  const [clientes, setClientes] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    api.getClientes(state.token)
      .then(setClientes)
      .finally(() => setFetching(false));
  }, []);

  const filtrados = clientes.filter(c =>
    !busqueda ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Clientes"
        subtitle="Gestión y seguimiento de todos los clientes registrados"
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Clientes totales" value={clientes.length} icon="◍" color="purple" />
        <StatCard label="Con lotes activos" value={clientes.filter(c => c.compras_count > 0).length} icon="◈" color="teal" />
        <StatCard label="Registrados hoy" value={clientes.filter(c => {
          const hoy = new Date().toDateString();
          return new Date(c.created_at).toDateString() === hoy;
        }).length} icon="●" color="blue" />
      </div>

      <div className="mb-5">
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full max-w-sm px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-teal-500"
        />
      </div>

      {fetching ? (
        <div className="flex justify-center py-20 text-teal-400">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon="◍"
          title="No hay clientes"
          description="Los clientes aparecerán aquí cuando se registren"
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                {["Cliente", "Correo", "Teléfono", "Lotes", "Registro", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtrados.map(cliente => (
                <tr key={cliente.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {cliente.nombre[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{cliente.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{cliente.correo}</td>
                  <td className="px-5 py-4 text-slate-400">{cliente.telefono || "—"}</td>
                  <td className="px-5 py-4">
                    <Badge variant={cliente.compras_count > 0 ? "success" : "default"}>
                      {cliente.compras_count || 0} lote{cliente.compras_count !== 1 ? "s" : ""}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(cliente.created_at).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelected(cliente)}
                      className="text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors"
                    >
                      Ver detalle →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selected && (
        <ClienteDetalle cliente={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
