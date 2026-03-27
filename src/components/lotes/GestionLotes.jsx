import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../utils/api";
import { Button, Input, Select, Card, Badge, Modal, EmptyState, PageHeader, StatCard } from "../ui";

const ESTADOS = ["Disponible", "Reservado", "Vendido"];

const ETAPAS_MAP = [
  { id: 1, nombre: "Lanzamiento" },
  { id: 2, nombre: "Preventa" },
  { id: 3, nombre: "Construccion" },
  { id: 4, nombre: "Entrega" },
];

const ETAPAS_NOMBRES = ETAPAS_MAP.map(e => e.nombre);

const getEtapaNombre = (id) => {
  const etapa = ETAPAS_MAP.find(e => e.id === id);
  return etapa ? etapa.nombre : "—";
};

const estadoBadge = (e) => {
  if (e === "Disponible") return "success";
  if (e === "Reservado") return "warning";
  if (e === "Vendido") return "danger";
  return "default";
};

const etapaColor = (e) => {
  const map = { Lanzamiento: "info", Preventa: "purple", Construccion: "warning", Entrega: "success" };
  return map[e] || "default";
};

function LoteForm({ initial, onSave, onClose, loading }) {
  const [form, setForm] = useState(initial || {
    area_m2: "", ubicacion: "", valor: "",
    etapa_id: 2, estado: "Disponible"
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.area_m2 || isNaN(form.area_m2) || form.area_m2 < 100 || form.area_m2 > 200)
      e.area_m2 = "Área inválida (100-200 m²)";
    if (!form.ubicacion.trim()) e.ubicacion = "Ubicación requerida";
    if (!form.valor || isNaN(form.valor) || form.valor <= 0) e.valor = "Valor inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...form,
        area_m2: parseInt(form.area_m2),
        valor: parseFloat(form.valor),
        etapa_id: Number(form.etapa_id),
      });
    }
  };

  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Área (m²)" type="number" min="100" max="200" placeholder="ej. 150" error={errors.area_m2} {...f("area_m2")} />
        <Input label="Valor ($)" type="number" min="0" placeholder="ej. 50000000" error={errors.valor} {...f("valor")} />
      </div>
      <Input label="Ubicación / Dirección" placeholder="ej. Manzana 3, Lote 12" error={errors.ubicacion} {...f("ubicacion")} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Etapa del proyecto"
          value={form.etapa_id}
          onChange={e => setForm({ ...form, etapa_id: Number(e.target.value) })}>
          {ETAPAS_MAP.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </Select>
        <Select label="Estado" {...f("estado")}>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </Select>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>{initial ? "Guardar cambios" : "Crear Lote"}</Button>
      </div>
    </form>
  );
}

export function GestionLotes() {
  const { state, dispatch, notify } = useApp();
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroEtapa, setFiltroEtapa] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    api.getLotes(state.token).then(data => {
      dispatch({ type: "SET_LOTES", payload: data });
      setFetching(false);
    }).catch(() => setFetching(false));
  }, []);

  const handleCreate = async (form) => {
    setLoading(true);
    try {
      const lote = await api.createLote(form, state.token);
      dispatch({ type: "ADD_LOTE", payload: lote });
      setModal(null);
      notify("Lote creado exitosamente", "success");
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (form) => {
    setLoading(true);
    try {
      const lote = await api.updateLote(modal.id, form, state.token);
      dispatch({ type: "UPDATE_LOTE", payload: lote });
      setModal(null);
      notify("Lote actualizado", "success");
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este lote?")) return;
    try {
      await api.deleteLote(id, state.token);
      dispatch({ type: "DELETE_LOTE", payload: id });
      notify("Lote eliminado", "success");
    } catch (err) { notify(err.message, "error"); }
  };

  const handleEstado = async (lote, nuevoEstado) => {
    try {
      const updated = await api.updateEstadoLote(lote.id, nuevoEstado, state.token);
      dispatch({ type: "UPDATE_LOTE", payload: updated });
      notify(`Estado actualizado a ${nuevoEstado}`, "success");
    } catch (err) { notify(err.message, "error"); }
  };

  const lotes = state.lotes.filter(l => {
    const matchEstado = filtroEstado === "Todos" || l.estado === filtroEstado;
    const etapaNombre = getEtapaNombre(l.etapa_id);
    const matchEtapa = filtroEtapa === "Todos" || etapaNombre === filtroEtapa;
    const matchBusqueda = !busqueda || l.ubicacion.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchEtapa && matchBusqueda;
  });

  const stats = {
    total: state.lotes.length,
    disponibles: state.lotes.filter(l => l.estado === "Disponible").length,
    reservados: state.lotes.filter(l => l.estado === "Reservado").length,
    vendidos: state.lotes.filter(l => l.estado === "Vendido").length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <PageHeader
        title="Gestión de Lotes"
        subtitle="Administra el inventario de lotes del proyecto"
        action={<Button onClick={() => setModal("create")}>＋ Nuevo Lote</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total lotes" value={stats.total} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
        } color="blue" />
        <StatCard label="Disponibles" value={stats.disponibles} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } color="teal" />
        <StatCard label="Reservados" value={stats.reservados} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } color="amber" />
        <StatCard label="Vendidos" value={stats.vendidos} icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
        } color="red" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por ubicación..."
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-56"
        />
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200">
          {["Todos", ...ESTADOS].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroEstado === e ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-gray-100"}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200">
          {["Todos", ...ETAPAS_NOMBRES].map(e => (
            <button key={e} onClick={() => setFiltroEtapa(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroEtapa === e ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-gray-100"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {fetching ? (
        <div className="flex justify-center py-20 text-emerald-500"><div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>
      ) : lotes.length === 0 ? (
        <EmptyState icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
        } title="No hay lotes" description="Crea el primer lote para comenzar"
          action={<Button onClick={() => setModal("create")}>Crear lote</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lotes.map(lote => (
            <Card key={lote.id} className="p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Lote #{lote.id}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{lote.ubicacion}</p>
                </div>
                <Badge variant={estadoBadge(lote.estado)}>{lote.estado}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-500 mb-0.5">Área</p>
                  <p className="text-slate-900 font-semibold text-sm">{lote.area_m2} m²</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-500 mb-0.5">Valor</p>
                  <p className="text-emerald-600 font-semibold text-sm">${Number(lote.valor).toLocaleString("es-CO")}</p>
                </div>
              </div>
              <div className="mb-4">
                <Badge variant={etapaColor(getEtapaNombre(lote.etapa_id))}>{getEtapaNombre(lote.etapa_id)}</Badge>
              </div>
              {/* Cambio de estado rápido */}
              <div className="flex gap-1 mb-3">
                {ESTADOS.filter(e => e !== lote.estado).map(e => (
                  <button key={e} onClick={() => handleEstado(lote, e)}
                    className="flex-1 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 text-slate-600 transition-colors font-medium">
                    → {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal(lote)}>Editar</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(lote.id)}>✕</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Create */}
      <Modal open={modal === "create"} onClose={() => setModal(null)} title="Nuevo Lote">
        <LoteForm onSave={handleCreate} onClose={() => setModal(null)} loading={loading} />
      </Modal>

      {/* Modal Edit */}
      <Modal open={modal && modal !== "create"} onClose={() => setModal(null)} title={`Editar Lote #${modal?.id}`}>
        {modal && modal !== "create" && (
          <LoteForm initial={modal} onSave={handleUpdate} onClose={() => setModal(null)} loading={loading} />
        )}
      </Modal>
    </div>
  );
}

// ─── Vista Catálogo Tipologías ─────────────────────────────────────────────────
const TIPOLOGIAS = [
  { tipo: "Tipo C", precio: 422760000, area: 36, hab: 1, banos: 1, parqueaderos: 0, desc: "Apartamento compacto ideal para solteros o parejas." },
  { tipo: "Tipo E", precio: 739066800, area: 72.3, hab: 2, banos: 2, parqueaderos: 0, desc: "Diseño amplio para familias pequeñas con alta luminosidad." },
  { tipo: "Tipo F", precio: 766831000, area: 75.5, hab: 2, banos: 2, parqueaderos: 0, desc: "El más espacioso con distribución optimizada." },
  { tipo: "Tipo G", precio: 610820000, area: 56.5, hab: 1, banos: 2, parqueaderos: 0, desc: "Balance perfecto entre espacio y precio." },
];

export function CatalogoTipologias() {
  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <PageHeader title="Tipologías de Inmuebles" subtitle="Modelos habitacionales disponibles en el proyecto" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TIPOLOGIAS.map((t) => (
          <Card key={t.tipo} className="p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full mb-2">{t.tipo}</span>
                <h3 className="text-xl font-bold text-slate-900">${Number(t.precio).toLocaleString("es-CO")}</h3>
                <p className="text-gray-500 text-xs mt-1">{t.desc}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: "⬡", label: "Área", value: `${t.area} m²` },
                { icon: "🛏", label: "Hab.", value: t.hab },
                { icon: "🚿", label: "Baños", value: t.banos },
                { icon: "🚗", label: "Parq.", value: t.parqueaderos },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-slate-900 font-bold text-sm mt-1">{item.value}</p>
                  <p className="text-gray-500 text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Catálogo de Lotes para Clientes ─────────────────────────────────────────────────
export function CatalogoLotes() {
  const { state, dispatch, notify } = useApp();
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [comprando, setComprando] = useState(false);

  const lotesDisponibles = state.lotes.filter(l => l.estado === "Disponible");

  const handleComprar = async () => {
    if (!loteSeleccionado) return;
    setComprando(true);
    try {
      await api.buyLote(
        { usuario_id: Number(state.user.id), lote_id: [loteSeleccionado.id] },
        state.token
      );
      dispatch({ type: "UPDATE_LOTE", payload: { ...loteSeleccionado, estado: "Reservado" } });
      notify("¡Lote reservado con éxito! Completa tu pago en Mis Pagos.", "success");
      setLoteSeleccionado(null);
    } catch (err) {
      notify(err.message || "Error al procesar la reserva", "error");
    } finally {
      setComprando(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <PageHeader
        title="Catálogo de Lotes"
        subtitle={`${lotesDisponibles.length} lotes disponibles`}
      />
      {lotesDisponibles.length === 0 ? (
        <EmptyState icon={
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
        } title="Sin lotes disponibles" description="Por el momento no hay lotes disponibles" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lotesDisponibles.map(lote => (
            <Card key={lote.id} className="overflow-hidden hover:shadow-md transition-all">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Lote #{lote.id}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{lote.ubicacion}</p>
                  </div>
                  <Badge variant="success">Disponible</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500 mb-0.5">Área</p>
                    <p className="text-slate-900 font-semibold text-sm">{lote.area_m2} m²</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500 mb-0.5">Valor</p>
                    <p className="text-emerald-600 font-semibold text-sm">${Number(lote.valor).toLocaleString("es-CO")}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <Badge variant={etapaColor(getEtapaNombre(lote.etapa_id))}>{getEtapaNombre(lote.etapa_id)}</Badge>
                </div>
                <Button className="w-full" onClick={() => setLoteSeleccionado(lote)}>
                  Reservar Lote
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      <Modal open={!!loteSeleccionado} onClose={() => setLoteSeleccionado(null)} title={`Confirmar Reserva — Lote #${loteSeleccionado?.id}`}>
        {loteSeleccionado && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Área</p>
                <p className="text-slate-900 font-semibold">{loteSeleccionado.area_m2} m²</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Valor</p>
                <p className="text-emerald-600 font-semibold">${Number(loteSeleccionado.valor).toLocaleString("es-CO")}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Ubicación</p>
                <p className="text-slate-900 font-semibold text-sm">{loteSeleccionado.ubicacion}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Etapa</p>
                <p className="text-slate-900 font-semibold">{getEtapaNombre(loteSeleccionado.etapa_id)}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ⚠️ Este lote quedará reservado por 24 horas. Debes completar el pago en ese tiempo o la reserva se cancelará automáticamente.
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setLoteSeleccionado(null)}>Cancelar</Button>
              <Button loading={comprando} onClick={handleComprar}>Confirmar Reserva</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
