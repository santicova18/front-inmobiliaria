import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../utils/api";
import { Button, Input, Select, Textarea, Card, Badge, Modal, EmptyState, PageHeader } from "../ui";

const TIPOS_PQRS = ["Petición", "Queja", "Reclamo", "Sugerencia"];
const ESTADOS_PQRS = ["Pendiente", "En revisión", "Resuelto", "Cerrado"];

const estadoPQRSBadge = (e) => {
  if (e === "Pendiente") return "warning";
  if (e === "En revisión") return "info";
  if (e === "Resuelto") return "success";
  if (e === "Cerrado") return "default";
  return "default";
};

const tipoBadge = (t) => {
  if (t === "Petición") return "info";
  if (t === "Queja") return "danger";
  if (t === "Reclamo") return "warning";
  if (t === "Sugerencia") return "purple";
  return "default";
};

// ─── Formulario cliente para enviar PQRS ─────────────────────────────────────
export function FormularioPQRS() {
  const { state, dispatch, notify } = useApp();
  const [form, setForm] = useState({ tipo: "Petición", asunto: "", descripcion: "" });
  const [loading, setLoading] = useState(false);
  const [enviadas, setEnviadas] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.getPQRSByCliente(state.user.id, state.token)
      .then(setEnviadas)
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asunto.trim() || !form.descripcion.trim()) {
      notify("Completa todos los campos", "error");
      return;
    }
    setLoading(true);
    try {
      const pqrs = await api.createPQRS({ ...form, cliente_id: state.user.id }, state.token);
      dispatch({ type: "ADD_PQRS", payload: pqrs });
      setEnviadas(prev => [...prev, pqrs]);
      setForm({ tipo: "Petición", asunto: "", descripcion: "" });
      notify("Tu solicitud fue enviada exitosamente", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="PQRS" subtitle="Peticiones, Quejas, Reclamos y Sugerencias" />
      <div className="grid grid-cols-5 gap-6">
        {/* Formulario */}
        <Card className="col-span-2 p-6 h-fit">
          <h3 className="text-sm font-semibold text-slate-200 mb-5">Nueva Solicitud</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Tipo de solicitud" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS_PQRS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Asunto" placeholder="Resumen breve de tu solicitud"
              value={form.asunto} onChange={e => setForm({ ...form, asunto: e.target.value })} required />
            <Textarea label="Descripción" placeholder="Describe detalladamente tu solicitud..."
              rows={5} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} required />
            <Button type="submit" loading={loading} className="w-full">Enviar Solicitud</Button>
          </form>
        </Card>

        {/* Mis solicitudes */}
        <div className="col-span-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Mis Solicitudes</h3>
          {fetching ? (
            <div className="flex justify-center py-10 text-teal-400"><div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>
          ) : enviadas.length === 0 ? (
            <EmptyState icon="◎" title="Sin solicitudes" description="Aún no has enviado ninguna PQRS" />
          ) : (
            <div className="space-y-3">
              {[...enviadas].reverse().map(pqrs => (
                <Card key={pqrs.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2 items-center">
                      <Badge variant={tipoBadge(pqrs.tipo)}>{pqrs.tipo}</Badge>
                      <Badge variant={estadoPQRSBadge(pqrs.estado)}>{pqrs.estado}</Badge>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(pqrs.fecha).toLocaleDateString("es-CO")}</span>
                  </div>
                  <h4 className="text-white text-sm font-semibold mb-1">{pqrs.asunto}</h4>
                  <p className="text-slate-400 text-xs line-clamp-2">{pqrs.descripcion}</p>
                  {pqrs.respuesta && (
                    <div className="mt-3 p-3 bg-teal-900/20 border border-teal-700/30 rounded-lg">
                      <p className="text-xs text-teal-400 font-semibold mb-1">Respuesta del equipo:</p>
                      <p className="text-slate-300 text-xs">{pqrs.respuesta}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Admin para PQRS ────────────────────────────────────────────────
export function AdminPQRS() {
  const { state, dispatch, notify } = useApp();
  const [pqrsList, setPqrsList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  useEffect(() => {
    api.getPQRS(state.token).then(setPqrsList).finally(() => setFetching(false));
  }, []);

  const handleResponder = async (e) => {
    e.preventDefault();
    if (!respuesta.trim()) { notify("Escribe una respuesta", "error"); return; }
    setLoading(true);
    try {
      const updated = await api.updatePQRS(selected.id, { respuesta, estado: nuevoEstado || selected.estado }, state.token);
      dispatch({ type: "UPDATE_PQRS", payload: updated });
      setPqrsList(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSelected(null);
      notify("Respuesta enviada exitosamente", "success");
    } catch (err) { notify(err.message, "error"); }
    finally { setLoading(false); }
  };

  const stats = {
    total: pqrsList.length,
    pendientes: pqrsList.filter(p => p.estado === "Pendiente").length,
    revision: pqrsList.filter(p => p.estado === "En revisión").length,
    resueltos: pqrsList.filter(p => p.estado === "Resuelto").length,
  };

  const filtradas = pqrsList.filter(p => {
    const matchE = filtroEstado === "Todos" || p.estado === filtroEstado;
    const matchT = filtroTipo === "Todos" || p.tipo === filtroTipo;
    return matchE && matchT;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Dashboard PQRS" subtitle="Gestiona todas las solicitudes de los clientes" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">Total</p>
        </div>
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.pendientes}</p>
          <p className="text-xs text-slate-400 mt-1">Pendientes</p>
        </div>
        <div className="bg-sky-900/20 border border-sky-700/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-sky-400">{stats.revision}</p>
          <p className="text-xs text-slate-400 mt-1">En Revisión</p>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.resueltos}</p>
          <p className="text-xs text-slate-400 mt-1">Resueltos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
          {["Todos", ...ESTADOS_PQRS].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroEstado === e ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
          {["Todos", ...TIPOS_PQRS].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filtroTipo === t ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {fetching ? (
        <div className="flex justify-center py-20 text-teal-400"><div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>
      ) : filtradas.length === 0 ? (
        <EmptyState icon="◎" title="Sin solicitudes" description="No hay PQRS con los filtros actuales" />
      ) : (
        <div className="space-y-3">
          {filtradas.map(pqrs => (
            <Card key={pqrs.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={tipoBadge(pqrs.tipo)}>{pqrs.tipo}</Badge>
                    <Badge variant={estadoPQRSBadge(pqrs.estado)}>{pqrs.estado}</Badge>
                    <span className="text-xs text-slate-500 ml-1">— {pqrs.cliente_nombre || "Cliente"}</span>
                    <span className="text-xs text-slate-600 ml-auto">{new Date(pqrs.fecha).toLocaleDateString("es-CO")}</span>
                  </div>
                  <h4 className="text-white font-semibold text-sm">{pqrs.asunto}</h4>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">{pqrs.descripcion}</p>
                  {pqrs.respuesta && (
                    <div className="mt-2 p-2 bg-teal-900/20 border border-teal-700/30 rounded-lg">
                      <p className="text-xs text-slate-300">{pqrs.respuesta}</p>
                    </div>
                  )}
                </div>
                <Button size="sm" variant={pqrs.respuesta ? "outline" : "primary"}
                  onClick={() => { setSelected(pqrs); setNuevoEstado(pqrs.estado); setRespuesta(pqrs.respuesta || ""); }}>
                  {pqrs.respuesta ? "Ver / Editar" : "Responder"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal respuesta */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`PQRS #${selected?.id} — ${selected?.tipo}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800 rounded-xl">
              <p className="text-sm font-semibold text-white mb-1">{selected.asunto}</p>
              <p className="text-slate-400 text-sm">{selected.descripcion}</p>
              <p className="text-xs text-slate-500 mt-2">Por: {selected.cliente_nombre} — {new Date(selected.fecha).toLocaleString("es-CO")}</p>
            </div>
            <form onSubmit={handleResponder} className="space-y-4">
              <Select label="Actualizar estado" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
                {ESTADOS_PQRS.map(e => <option key={e} value={e}>{e}</option>)}
              </Select>
              <Textarea label="Respuesta" placeholder="Escribe una respuesta para el cliente..." rows={4}
                value={respuesta} onChange={e => setRespuesta(e.target.value)} required />
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" type="button" onClick={() => setSelected(null)}>Cancelar</Button>
                <Button type="submit" loading={loading}>Enviar Respuesta</Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
