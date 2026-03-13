import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../utils/api";
import { Button, Input, Select, Card, Badge, Modal, EmptyState, PageHeader, StatCard } from "../ui";

const ESTADOS = ["Disponible", "Reservado", "Vendido"];
const ETAPAS = ["Lanzamiento", "Preventa", "Construcción", "Entrega"];

const estadoBadge = (e) => {
  if (e === "Disponible") return "success";
  if (e === "Reservado") return "warning";
  if (e === "Vendido") return "danger";
  return "default";
};

const etapaColor = (e) => {
  const map = { Lanzamiento: "info", Preventa: "purple", Construcción: "warning", Entrega: "success" };
  return map[e] || "default";
};

function LoteForm({ initial, onSave, onClose, loading }) {
  const [form, setForm] = useState(initial || { area: "", ubicacion: "", valor: "", etapa: "Preventa", estado: "Disponible", descripcion: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.area || isNaN(form.area) || form.area <= 0) e.area = "Área inválida";
    if (!form.ubicacion.trim()) e.ubicacion = "Ubicación requerida";
    if (!form.valor || isNaN(form.valor) || form.valor <= 0) e.valor = "Valor inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Área (m²)" type="number" min="100" max="200" placeholder="ej. 150" error={errors.area} {...f("area")} />
        <Input label="Valor ($)" type="number" min="0" placeholder="ej. 50000000" error={errors.valor} {...f("valor")} />
      </div>
      <Input label="Ubicación / Dirección" placeholder="ej. Manzana 3, Lote 12" error={errors.ubicacion} {...f("ubicacion")} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Etapa del proyecto" {...f("etapa")}>
          {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
        </Select>
        <Select label="Estado" {...f("estado")}>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </Select>
      </div>
      <Input label="Descripción (opcional)" placeholder="Notas adicionales del lote" {...f("descripcion")} />
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={loading}>{initial ? "Guardar cambios" : "Crear Lote"}</Button>
      </div>
    </form>
  );
}

export function GestionLotes() {
  const { state, dispatch, notify } = useApp();
  const [modal, setModal] = useState(null); // null | 'create' | {lote}
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
    const matchEtapa = filtroEtapa === "Todos" || l.etapa === filtroEtapa;
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
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Gestión de Lotes"
        subtitle="Administra el inventario de lotes del proyecto"
        action={<Button onClick={() => setModal("create")}>＋ Nuevo Lote</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total lotes" value={stats.total} icon="◈" color="blue" />
        <StatCard label="Disponibles" value={stats.disponibles} icon="●" color="teal" />
        <StatCard label="Reservados" value={stats.reservados} icon="◐" color="amber" />
        <StatCard label="Vendidos" value={stats.vendidos} icon="◉" color="red" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por ubicación..."
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-teal-500 w-56"
        />
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
          {["Todos", ...ESTADOS].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroEstado === e ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
          {["Todos", ...ETAPAS].map(e => (
            <button key={e} onClick={() => setFiltroEtapa(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroEtapa === e ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {fetching ? (
        <div className="flex justify-center py-20 text-teal-400"><div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>
      ) : lotes.length === 0 ? (
        <EmptyState icon="◈" title="No hay lotes" description="Crea el primer lote para comenzar"
          action={<Button onClick={() => setModal("create")}>Crear lote</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lotes.map(lote => (
            <Card key={lote.id} className="p-5 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white text-sm">Lote #{lote.id}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{lote.ubicacion}</p>
                </div>
                <Badge variant={estadoBadge(lote.estado)}>{lote.estado}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-900 rounded-lg p-2.5">
                  <p className="text-xs text-slate-500 mb-0.5">Área</p>
                  <p className="text-white font-semibold text-sm">{lote.area} m²</p>
                </div>
                <div className="bg-slate-900 rounded-lg p-2.5">
                  <p className="text-xs text-slate-500 mb-0.5">Valor</p>
                  <p className="text-teal-400 font-semibold text-sm">${Number(lote.valor).toLocaleString("es-CO")}</p>
                </div>
              </div>
              <div className="mb-4">
                <Badge variant={etapaColor(lote.etapa)}>{lote.etapa}</Badge>
              </div>
              {/* Cambio de estado rápido */}
              <div className="flex gap-1 mb-3">
                {ESTADOS.filter(e => e !== lote.estado).map(e => (
                  <button key={e} onClick={() => handleEstado(lote, e)}
                    className="flex-1 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors font-medium">
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
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Tipologías de Inmuebles" subtitle="Modelos habitacionales disponibles en el proyecto" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TIPOLOGIAS.map((t) => (
          <Card key={t.tipo} className="p-6 hover:border-teal-700/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full mb-2">{t.tipo}</span>
                <h3 className="text-xl font-bold text-white">${Number(t.precio).toLocaleString("es-CO")}</h3>
                <p className="text-slate-400 text-xs mt-1">{t.desc}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: "⬡", label: "Área", value: `${t.area} m²` },
                { icon: "🛏", label: "Hab.", value: t.hab },
                { icon: "🚿", label: "Baños", value: t.banos },
                { icon: "🚗", label: "Parq.", value: t.parqueaderos },
              ].map(item => (
                <div key={item.label} className="bg-slate-900 rounded-xl p-3 text-center">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-white font-bold text-sm mt-1">{item.value}</p>
                  <p className="text-slate-500 text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
