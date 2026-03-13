import { useCallback } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../utils/api";

// ─── useAuth ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const { state, dispatch, notify } = useApp();

  const login = useCallback(async (correo, password) => {
    try {
      const data = await api.login({ correo, password });
      dispatch({
        type: "SET_USER",
        payload: { user: data.user, token: data.token, role: data.user.rol },
      });
      notify(`Bienvenido, ${data.user.nombre}`, "success");
      return true;
    } catch (err) {
      notify(err.message || "Credenciales incorrectas", "error");
      return false;
    }
  }, [dispatch, notify]);

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, [dispatch]);

  const isAdmin = state.role === "admin";
  const isCliente = state.role === "cliente";
  const isAuthenticated = !!state.user;

  return { login, logout, isAdmin, isCliente, isAuthenticated, user: state.user, token: state.token };
}

// ─── useLotes ─────────────────────────────────────────────────────────────────
export function useLotes() {
  const { state, dispatch, notify } = useApp();

  const fetchLotes = useCallback(async () => {
    try {
      const data = await api.getLotes(state.token);
      dispatch({ type: "SET_LOTES", payload: data });
      return data;
    } catch (err) {
      notify(err.message, "error");
      return [];
    }
  }, [state.token, dispatch, notify]);

  const createLote = useCallback(async (form) => {
    const lote = await api.createLote(form, state.token);
    dispatch({ type: "ADD_LOTE", payload: lote });
    notify("Lote creado", "success");
    return lote;
  }, [state.token, dispatch, notify]);

  const updateLote = useCallback(async (id, form) => {
    const lote = await api.updateLote(id, form, state.token);
    dispatch({ type: "UPDATE_LOTE", payload: lote });
    notify("Lote actualizado", "success");
    return lote;
  }, [state.token, dispatch, notify]);

  const deleteLote = useCallback(async (id) => {
    await api.deleteLote(id, state.token);
    dispatch({ type: "DELETE_LOTE", payload: id });
    notify("Lote eliminado", "success");
  }, [state.token, dispatch, notify]);

  const cambiarEstado = useCallback(async (id, estado) => {
    const lote = await api.updateEstadoLote(id, estado, state.token);
    dispatch({ type: "UPDATE_LOTE", payload: lote });
    notify(`Estado → ${estado}`, "success");
    return lote;
  }, [state.token, dispatch, notify]);

  const disponibles = state.lotes.filter(l => l.estado === "Disponible");
  const reservados  = state.lotes.filter(l => l.estado === "Reservado");
  const vendidos    = state.lotes.filter(l => l.estado === "Vendido");

  return {
    lotes: state.lotes,
    disponibles,
    reservados,
    vendidos,
    fetchLotes,
    createLote,
    updateLote,
    deleteLote,
    cambiarEstado,
  };
}

// ─── usePagos ─────────────────────────────────────────────────────────────────
export function usePagos() {
  const { state, dispatch, notify } = useApp();

  const registrarPago = useCallback(async (pagoData) => {
    try {
      const pago = await api.registrarPago(pagoData, state.token);
      dispatch({ type: "ADD_PAGO", payload: pago });
      notify("Pago registrado. Comprobante enviado al cliente ✓", "success");
      return pago;
    } catch (err) {
      notify(err.message, "error");
      throw err;
    }
  }, [state.token, dispatch, notify]);

  const getSaldoPendiente = useCallback((compraId) => {
    const compra = state.compras.find(c => c.id === compraId);
    if (!compra) return 0;
    const totalPagado = state.pagos
      .filter(p => p.compra_id === compraId)
      .reduce((sum, p) => sum + Number(p.monto), 0);
    return Math.max(0, Number(compra.valor_total) - totalPagado);
  }, [state.compras, state.pagos]);

  const getHistorialPorCompra = useCallback((compraId) => {
    return state.pagos
      .filter(p => p.compra_id === compraId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [state.pagos]);

  const getTotalPagadoPorCompra = useCallback((compraId) => {
    return state.pagos
      .filter(p => p.compra_id === compraId)
      .reduce((sum, p) => sum + Number(p.monto), 0);
  }, [state.pagos]);

  return {
    pagos: state.pagos,
    registrarPago,
    getSaldoPendiente,
    getHistorialPorCompra,
    getTotalPagadoPorCompra,
  };
}

// ─── usePQRS ──────────────────────────────────────────────────────────────────
export function usePQRS() {
  const { state, dispatch, notify } = useApp();

  const enviarPQRS = useCallback(async (form) => {
    const pqrs = await api.createPQRS({ ...form, cliente_id: state.user.id }, state.token);
    dispatch({ type: "ADD_PQRS", payload: pqrs });
    notify("Solicitud enviada exitosamente", "success");
    return pqrs;
  }, [state.token, state.user, dispatch, notify]);

  const responderPQRS = useCallback(async (id, respuesta, nuevoEstado) => {
    const updated = await api.updatePQRS(id, { respuesta, estado: nuevoEstado }, state.token);
    dispatch({ type: "UPDATE_PQRS", payload: updated });
    notify("Respuesta enviada", "success");
    return updated;
  }, [state.token, dispatch, notify]);

  const pendientes = state.pqrs.filter(p => p.estado === "Pendiente");

  return { pqrs: state.pqrs, pendientes, enviarPQRS, responderPQRS };
}
