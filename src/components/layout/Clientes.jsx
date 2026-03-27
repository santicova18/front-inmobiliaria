import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../utils/api";
import { Card, Badge, PageHeader, StatCard, EmptyState, Modal, Button } from "../ui";

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
    <Modal open onClose={onClose} title={`Usuario: ${cliente.nombre}`} size="lg">
      {loading ? (
        <div className="flex justify-center py-10 text-emerald-500">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Info personal */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-sm text-slate-900">{cliente.email}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <Badge variant={cliente.activo ? "success" : "danger"}>
                {cliente.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Verificado</p>
              <Badge variant={cliente.is_verified ? "success" : "warning"}>
                {cliente.is_verified ? "Verificado" : "Pendiente"}
              </Badge>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Saldo pendiente</p>
              <p className="text-sm font-bold text-amber-600">{formatCOP(totalDeuda)}</p>
            </div>
          </div>

          {/* Compras */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Compras ({compras.length})
            </h4>
            {compras.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Sin compras registradas</p>
            ) : (
              <div className="space-y-3">
                {compras.map(c => {
                  const pagosList = pagos.filter(p => p.compra_id === c.id);
                  const pagado = pagosList.reduce((s, p) => s + Number(p.monto), 0);
                  const saldo = Math.max(0, Number(c.valor_total) - pagado);
                  const prog = Math.min(100, (pagado / Number(c.valor_total)) * 100);
                  return (
                    <div key={c.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-900 text-sm font-semibold">Lote #{c.lote_id}</span>
                        <Badge variant={saldo <= 0 ? "success" : "warning"}>
                          {saldo <= 0 ? "Saldado" : "En cuotas"}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{prog.toFixed(0)}% — {pagosList.length}/{c.cuotas} cuotas</span>
                        <span>Saldo: <strong className="text-amber-600">{formatCOP(saldo)}</strong></span>
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
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Últimos pagos
              </h4>
              <div className="divide-y divide-gray-100 bg-gray-50 rounded-xl overflow-hidden">
                {[...pagos].reverse().slice(0, 5).map(p => (
                  <div key={p.id} className="flex justify-between items-center px-4 py-3">
                    <div>
                      <p className="text-sm text-slate-900">{new Date(p.fecha).toLocaleDateString("es-CO")}</p>
                      <p className="text-xs text-gray-500">{p.referencia || "Sin referencia"}</p>
                    </div>
                    <span className="text-emerald-600 font-bold text-sm">{formatCOP(p.monto)}</span>
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
  const { state, notify } = useApp();
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
    c.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleDesactivar = async (usuarioId) => {
    if (!confirm("¿Desactivar este usuario? No podrá iniciar sesión.")) return;
    try {
      await api.deactivateUsuario(usuarioId, state.token);
      setClientes(prev => prev.map(c =>
        c.id === usuarioId ? { ...c, activo: false } : c
      ));
      notify("Usuario desactivado", "success");
    } catch (err) {
      notify(err.message || "Error al desactivar", "error");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <PageHeader
        title="Usuarios"
        subtitle="Gestión y seguimiento de todos los usuarios registrados"
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total usuarios" value={clientes.length} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
        } color="purple" />
        <StatCard label="Cuentas activas" value={clientes.filter(c => c.activo).length} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } color="teal" />
        <StatCard label="Verificados" value={clientes.filter(c => c.is_verified).length} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
        } color="blue" />
      </div>

      <div className="mb-5">
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full max-w-sm px-4 py-2 bg-white border border-gray-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {fetching ? (
        <div className="flex justify-center py-20 text-emerald-500">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          }
          title="No hay usuarios"
          description="Los usuarios aparecerán aquí cuando se registren"
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Usuario", "Email", "Estado cuenta", "Verificado", "Registro", "Acciones"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(cliente => (
                <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {cliente.nombre[0]?.toUpperCase()}
                      </div>
                      <span className="text-slate-900 font-medium">{cliente.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{cliente.email}</td>
                  <td className="px-5 py-4">
                    <Badge variant={cliente.activo ? "success" : "danger"}>
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={cliente.is_verified ? "success" : "warning"}>
                      {cliente.is_verified ? "Verificado" : "Pendiente"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(cliente.fecha_registro).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(cliente)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                      >
                        Ver detalle
                      </button>
                      {cliente.activo ? (
                        <button
                          onClick={() => handleDesactivar(cliente.id)}
                          className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Sin acceso</span>
                      )}
                    </div>
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
