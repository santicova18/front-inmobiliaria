import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../utils/api";
import { Button, Input, Select, Card, Badge, Modal, EmptyState, PageHeader, StatCard } from "../ui";

function formatCOP(n) {
  return "$" + Number(n || 0).toLocaleString("es-CO");
}

// ─── Asignar Compra ───────────────────────────────────────────────────────────
export function RegistrarCompra() {
  const { state, dispatch, notify } = useApp();
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ cliente_id: "", lote_ids: [], cuotas: 12, valor_cuota: "" });
  const [loading, setLoading] = useState(false);
  const [calcAuto, setCalcAuto] = useState(true);

  useEffect(() => {
    api.getClientes(state.token).then(setClientes).catch(() => {});
  }, []);

  const lotesDisponibles = state.lotes.filter(l => l.estado === "Disponible");

  const toggleLote = (id) => {
    setForm(prev => ({
      ...prev,
      lote_ids: prev.lote_ids.includes(id)
        ? prev.lote_ids.filter(x => x !== id)
        : [...prev.lote_ids, id]
    }));
  };

  const valorTotal = form.lote_ids.reduce((sum, id) => {
    const lote = state.lotes.find(l => l.id === id);
    return sum + (lote ? Number(lote.valor) : 0);
  }, 0);

  const valorCuotaCalc = calcAuto && form.cuotas > 0 ? Math.ceil(valorTotal / form.cuotas) : Number(form.valor_cuota);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id || form.lote_ids.length === 0) {
      notify("Selecciona cliente y al menos un lote", "error");
      return;
    }
    setLoading(true);
    try {
      // El backend espera: { usuario_id: int, lote_id: list[int] }
      const compra = await api.createCompra({
        usuario_id: parseInt(form.cliente_id),
        lote_id: form.lote_ids,
      }, state.token);
      dispatch({ type: "ADD_COMPRA", payload: compra });
      notify("Compra registrada y lotes reservados", "success");
      setForm({ cliente_id: "", lote_ids: [], cuotas: 12, valor_cuota: "" });
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Registrar Compra" subtitle="Asigna lotes a un cliente y configura el plan de pagos" />
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">1. Seleccionar Cliente</h3>
            <Select label="Cliente" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
              <option value="">-- Selecciona --</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.correo})</option>)}
            </Select>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">2. Seleccionar Lote(s)</h3>
            {lotesDisponibles.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No hay lotes disponibles</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {lotesDisponibles.map(lote => (
                  <label key={lote.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    form.lote_ids.includes(lote.id) ? "border-teal-600 bg-teal-900/20" : "border-slate-700 hover:border-slate-600"}`}>
                    <input type="checkbox" checked={form.lote_ids.includes(lote.id)} onChange={() => toggleLote(lote.id)} className="accent-teal-500" />
                    <div className="flex-1">
                      <span className="text-white text-sm font-medium">Lote #{lote.id}</span>
                      <span className="text-slate-400 text-xs ml-2">{lote.ubicacion}</span>
                    </div>
                    <span className="text-teal-400 text-sm font-semibold">{formatCOP(lote.valor)}</span>
                  </label>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">3. Plan de Pagos</h3>
            <div className="space-y-4">
              <Input label="Número de cuotas" type="number" min="1" max="120"
                value={form.cuotas} onChange={e => setForm({ ...form, cuotas: e.target.value })} />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={calcAuto} onChange={e => setCalcAuto(e.target.checked)} className="accent-teal-500" />
                  <span className="text-sm text-slate-400">Calcular valor de cuota automáticamente</span>
                </label>
              </div>
              {!calcAuto && (
                <Input label="Valor por cuota ($)" type="number" min="0"
                  value={form.valor_cuota} onChange={e => setForm({ ...form, valor_cuota: e.target.value })} />
              )}
            </div>
          </Card>
        </div>

        {/* Resumen */}
        <div className="col-span-2">
          <Card className="p-5 sticky top-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-5">Resumen de Compra</h3>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Lotes seleccionados</span>
                <span className="text-white font-semibold">{form.lote_ids.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Valor total</span>
                <span className="text-teal-400 font-bold">{formatCOP(valorTotal)}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between text-sm">
                <span className="text-slate-400">Cuotas</span>
                <span className="text-white">{form.cuotas} x {formatCOP(valorCuotaCalc)}</span>
              </div>
            </div>
            <Button className="w-full" loading={loading} onClick={handleSubmit}>Registrar Compra</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Historial de Pagos ───────────────────────────────────────────────────────
export function GestionPagos() {
  const { state, dispatch, notify } = useApp();
  const [compras, setCompras] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [modalPago, setModalPago] = useState(false);
  const [form, setForm] = useState({ monto: "", fecha: new Date().toISOString().split("T")[0], referencia: "", notas: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    Promise.all([api.getCompras(state.token), api.getPagos(state.token)])
      .then(([c, p]) => { setCompras(c); setPagos(p); })
      .finally(() => setFetching(false));
  }, []);

  const pagosDeCompra = (compraId) => pagos.filter(p => p.compra_id === compraId);

  const saldoPendiente = (compra) => {
    const totalPagado = pagosDeCompra(compra.id).reduce((sum, p) => sum + Number(p.monto), 0);
    return Number(compra.valor_total) - totalPagado;
  };

  const handlePago = async (e) => {
    e.preventDefault();
    if (!selectedCompra) return;
    setLoading(true);
    try {
      const pago = await api.registrarPago({
        ...form,
        compra_id: selectedCompra.id,
        monto: Number(form.monto),
      }, state.token);
      setPagos(prev => [...prev, pago]);
      dispatch({ type: "ADD_PAGO", payload: pago });
      setModalPago(false);
      setForm({ monto: "", fecha: new Date().toISOString().split("T")[0], referencia: "", notas: "" });
      notify("Pago registrado. Comprobante enviado al correo del cliente ✓", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const totalRecaudado = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
  const totalPendiente = compras.reduce((sum, c) => sum + saldoPendiente(c), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Gestión de Pagos" subtitle="Registra cuotas y visualiza historial de pagos" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Recaudado" value={formatCOP(totalRecaudado)} icon="◆" color="teal" />
        <StatCard label="Saldo Pendiente" value={formatCOP(totalPendiente)} icon="◇" color="amber" />
        <StatCard label="Compras activas" value={compras.length} icon="◉" color="blue" />
      </div>

      {fetching ? (
        <div className="flex justify-center py-20 text-teal-400"><div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {compras.map(compra => {
            const pagosList = pagosDeCompra(compra.id);
            const saldo = saldoPendiente(compra);
            const progreso = Math.min(100, ((Number(compra.valor_total) - saldo) / Number(compra.valor_total)) * 100);
            return (
              <Card key={compra.id} className={`p-5 cursor-pointer transition-all ${selectedCompra?.id === compra.id ? "border-teal-600" : "hover:border-slate-600"}`}
                onClick={() => setSelectedCompra(compra)}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white text-sm">Compra #{compra.id}</h3>
                    <p className="text-slate-400 text-xs">{compra.cliente_nombre || "Cliente"}</p>
                  </div>
                  <Badge variant={saldo <= 0 ? "success" : "warning"}>
                    {saldo <= 0 ? "Pagado" : "Al día"}
                  </Badge>
                </div>
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>{progreso.toFixed(0)}% pagado</span>
                    <span>{formatCOP(saldo)} pendiente</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${progreso}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <p className="text-slate-500">Total</p>
                    <p className="text-white font-semibold">{formatCOP(compra.valor_total)}</p>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <p className="text-slate-500">Cuotas</p>
                    <p className="text-white font-semibold">{pagosList.length}/{compra.cuotas}</p>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <p className="text-slate-500">Saldo</p>
                    <p className="text-amber-400 font-semibold">{formatCOP(saldo)}</p>
                  </div>
                </div>
                {/* Últimos pagos */}
                {pagosList.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {pagosList.slice(-3).reverse().map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{new Date(p.fecha).toLocaleDateString("es-CO")}</span>
                        <span className="text-emerald-400 font-semibold">{formatCOP(p.monto)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); setSelectedCompra(compra); setModalPago(true); }}>
                  + Registrar Pago
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {compras.length === 0 && !fetching && (
        <EmptyState icon="◆" title="Sin compras registradas" description="Registra una compra primero para gestionar pagos" />
      )}

      {/* Modal pago */}
      <Modal open={modalPago} onClose={() => setModalPago(false)} title={`Registrar Pago — Compra #${selectedCompra?.id}`}>
        <div className="mb-5 p-4 bg-slate-800 rounded-xl">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Saldo pendiente</span>
            <span className="text-amber-400 font-bold">{selectedCompra ? formatCOP(saldoPendiente(selectedCompra)) : "$0"}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-400">Valor cuota sugerida</span>
            <span className="text-teal-400 font-semibold">{formatCOP(selectedCompra?.valor_cuota)}</span>
          </div>
        </div>
        <form onSubmit={handlePago} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monto pagado ($)" type="number" min="1" required
              value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })}
              placeholder={selectedCompra?.valor_cuota || "0"} />
            <Input label="Fecha del pago" type="date" required
              value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
          </div>
          <Input label="Referencia de pago" placeholder="ej. TRF-2024-001"
            value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} />
          <Input label="Notas (opcional)" placeholder="Observaciones del pago"
            value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
          <div className="bg-sky-900/20 border border-sky-700/30 rounded-xl p-3 text-xs text-sky-400">
            📧 Al guardar, se enviará automáticamente el comprobante al correo del cliente.
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setModalPago(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Registrar Pago</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Vista cliente: Mis Lotes y Pagos ─────────────────────────────────────────
export function MisCuentas() {
  const { state } = useApp();
  const [compras, setCompras] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    // api.getPagos() apunta a /pagos que es solo admin → 404 para clientes
    // api.getMisCompras() apunta a /pagos/mis-compras → correcto para clientes
    api.getMisCompras(state.token)
      .then(c => {
        setCompras(c);
        const pagosList = c.flatMap(compra =>
          (compra.pagos || []).map(p => ({ ...p, compra_id: compra.id }))
        );
        setPagos(pagosList);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const saldo = (compra) => {
    const pagados = pagos.filter(p => p.compra_id === compra.id).reduce((s, p) => s + Number(p.monto), 0);
    return Number(compra.valor_total) - pagados;
  };

  if (fetching) return <div className="flex justify-center py-20 text-teal-400"><div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Mi Estado de Cuenta" subtitle="Consulta tus lotes y seguimiento de pagos" />
      <div className="flex gap-2 mb-6 bg-slate-800 rounded-xl p-1 w-fit border border-slate-700">
        {["Mis Lotes", "Historial de Pagos"].map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === i ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        compras.length === 0 ? (
          <EmptyState icon="◈" title="No tienes lotes" description="Aún no has adquirido ningún lote" />
        ) : (
          <div className="space-y-4">
            {compras.map(compra => {
              const s = saldo(compra);
              const p = Math.min(100, ((Number(compra.valor_total) - s) / Number(compra.valor_total)) * 100);
              return (
                <Card key={compra.id} className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Compra #{compra.id} — Lote #{compra.lote_id}</h3>
                    <Badge variant={s <= 0 ? "success" : "warning"}>{s <= 0 ? "Cancelado" : "En cuotas"}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { label: "Valor Total", value: formatCOP(compra.valor_total), color: "text-white" },
                      { label: "Pagado", value: formatCOP(Number(compra.valor_total) - s), color: "text-emerald-400" },
                      { label: "Saldo", value: formatCOP(s), color: "text-amber-400" },
                      { label: "Cuota", value: formatCOP(compra.valor_cuota), color: "text-teal-400" },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-900 p-3 rounded-xl">
                        <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                        <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full" style={{ width: `${p}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{p.toFixed(1)}% completado</p>
                </Card>
              );
            })}
          </div>
        )
      )}

      {tab === 1 && (
        pagos.length === 0 ? (
          <EmptyState icon="◆" title="Sin pagos registrados" description="Tus pagos aparecerán aquí" />
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr>{["Fecha", "Compra", "Monto", "Referencia", "Estado"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pagos.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-slate-300">{new Date(p.fecha).toLocaleDateString("es-CO")}</td>
                    <td className="px-4 py-3 text-slate-400">#{p.compra_id}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">{formatCOP(p.monto)}</td>
                    <td className="px-4 py-3 text-slate-400">{p.referencia || "—"}</td>
                    <td className="px-4 py-3"><Badge variant="success">Procesado</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}
    </div>
  );
}
