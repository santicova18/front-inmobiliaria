const BASE_URL =
    import.meta.env.VITE_API_URL || "https://proyecto-inmobiliario-production.up.railway.app";

// Función para decodificar JWT token (sin verificación - solo para obtener datos)
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (e) {
        return null;
    }
}

// Mapeo de datos del backend al formato que espera el frontend
function mapCompraBackendToFrontend(compra) {
    if (!compra) return null;
    return {
        ...compra,
        valor_total: compra.total,
        saldo_pendiente: compra.pendiente,
        // Calcular valores derivados
        cuotas: 12, // Valor por defecto ya que el backend no maneja cuotas
        valor_cuota: compra.total && compra.pendiente ?
            (Number(compra.total) - Number(compra.pendiente)) / 12 : 0,
    };
}

function mapPagoBackendToFrontend(pago) {
    if (!pago) return null;
    return {
        ...pago,
        monto: pago.valor_pagado || pago.monto,
    };
}

async function request(endpoint, options = {}, token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {...headers, ...options.headers },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return data;
}

export const api = {
    // Auth
    login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    verify: (token) => request(`/auth/verify?token=${encodeURIComponent(token)}`, { method: "POST" }),
    forgotPassword: (email) => request(`/auth/forgot-password?email=${encodeURIComponent(email)}`, { method: "POST" }),
    resetPassword: (body) => request("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
    resendVerification: (email) => request(`/auth/resend-verification?email=${encodeURIComponent(email)}`, { method: "POST" }),
    getCurrentUser: (token) => request("/auth/me", {}, token),

    // Lotes
    getLotes: (token) => request("/lotes/list", {}, token),
    getLote: (id, token) => request(`/lotes/${id}`, {}, token),
    createLote: (body, token) => request("/lotes/create", { method: "POST", body: JSON.stringify(body) }, token),
    updateLote: (id, body, token) => request(`/lotes/update/${id}`, { method: "PUT", body: JSON.stringify(body) }, token),
    deleteLote: (id, token) => request(`/lotes/delete/${id}`, { method: "DELETE" }, token),
    buyLote: (body, token) => request("/lotes/buy", { method: "POST", body: JSON.stringify(body) }, token),
    // Actualizar solo el estado del lote
    updateEstadoLote: (id, estado, token) => request(`/lotes/update/${id}`, { method: "PUT", body: JSON.stringify({ estado }) }, token),

    // Usuarios/Clientes
    getClientes: (token) => request("/usuarios/list", {}, token),
    getCliente: (id, token) => request(`/usuarios/${id}`, {}, token),
    createCliente: (body, token) => request("/usuarios/create", { method: "POST", body: JSON.stringify(body) }, token),

    // Compras - El backend no tiene ruta de compras activa
    // Usamos /pagos/mis-compras para clientes y simulamos lista vacía para admin
    getCompras: (token) => request("/pagos/mis-compras", {}, token).then(data => data.map(mapCompraBackendToFrontend)),
    getComprasByCliente: (clienteId, token) => request(`/pagos/mis-compras`, {}, token).then(data => data.map(mapCompraBackendToFrontend)),
    createCompra: (body, token) => request("/lotes/buy", { method: "POST", body: JSON.stringify(body) }, token).then(data => mapCompraBackendToFrontend(data)),

    // Pagos
    getPagos: (token) => request("/pagos", {}, token).then(data => data.map(mapPagoBackendToFrontend)),
    getPagosByCompra: (compraId, token) => request(`/pagos/compra/${compraId}`, {}, token).then(data => data.map(mapPagoBackendToFrontend)),
    getResumenCompra: (compraId, token) => request(`/pagos/resumen/${compraId}`, {}, token),
    getMisCompras: (token) => request("/pagos/mis-compras", {}, token).then(data => data.map(mapCompraBackendToFrontend)),
    registrarPago: (body, token) => request("/pagos/register", { method: "POST", body: JSON.stringify({ compra_id: body.compra_id, valor_pagado: Number(body.monto), comprobante: body.referencia }) }, token),

    // PQRS
    getPQRS: (token) => request("/pqrs", {}, token),
    getPQRSById: (id, token) => request(`/pqrs/${id}`, {}, token),
    getPQRSByCliente: (clienteId, token) => request(`/pqrs/user/${clienteId}`, {}, token),
    createPQRS: (usuarioId, body, token) => request(`/pqrs/create?usuario_id=${usuarioId}`, { method: "POST", body: JSON.stringify(body) }, token),
    updatePQRS: (id, body, token) => request(`/pqrs/update/${id}`, { method: "PUT", body: JSON.stringify(body) }, token),
    updatePQRSStatus: (pqrsId, estado, token) => request(`/pqrs/update-status?pqrs_id=${pqrsId}&estado=${estado}`, { method: "PUT" }, token),

    // Roles
    getRoles: (token) => request("/roles/list", {}, token),
    getRol: (id, token) => request(`/roles/${id}`, {}, token),
    createRol: (body, token) => request("/roles/create", { method: "POST", body: JSON.stringify(body) }, token),

    // Detalle Compra
    getDetalleCompra: (id, token) => request(`/detalle-compra/${id}`, {}, token),
    getDetalleByCompra: (compraId, token) => request(`/detalle-compra/compra/${compraId}`, {}, token),
    createDetalleCompra: (body, token) => request("/detalle-compra/create", { method: "POST", body: JSON.stringify(body) }, token),

    // Usuarios (admin)
    getUsuarios: (token) => request("/usuarios/list", {}, token),
    deactivateUsuario: (usuarioId, token) => request(`/usuarios/deactivate?usuario_id=${usuarioId}`, { method: "PUT" }, token),
};