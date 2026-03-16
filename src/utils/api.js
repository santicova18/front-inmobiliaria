const BASE_URL =
    import.meta.env.VITE_API_URL || "https://proyecto-inmobiliario-production.up.railway.app";

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

    // Lotes
    getLotes: (token) => request("/lotes/list", {}, token),
    getLote: (id, token) => request(`/lotes/${id}`, {}, token),
    createLote: (body, token) => request("/lotes/create", { method: "POST", body: JSON.stringify(body) }, token),
    updateLote: (id, body, token) => request(`/lotes/update/${id}`, { method: "PUT", body: JSON.stringify(body) }, token),
    deleteLote: (id, token) => request(`/lotes/delete/${id}`, { method: "DELETE" }, token),
    buyLote: (body, token) => request("/lotes/buy", { method: "POST", body: JSON.stringify(body) }, token),

    // Compras
    getCompras: (token) => request("/compras", {}, token),
    getComprasByCliente: (clienteId, token) => request(`/compras/cliente/${clienteId}`, {}, token),
    createCompra: (body, token) => request("/compras", { method: "POST", body: JSON.stringify(body) }, token),

    // Pagos
    getPagos: (token) => request("/pagos", {}, token),
    getPagosByCompra: (compraId, token) => request(`/pagos/compra/${compraId}`, {}, token),
    getResumenCompra: (compraId, token) => request(`/pagos/resumen/${compraId}`, {}, token),
    getMisCompras: (token) => request("/pagos/mis-compras", {}, token),
    registrarPago: (body, token) => request("/pagos/register", { method: "POST", body: JSON.stringify(body) }, token),

    // PQRS
    getPQRS: (token) => request("/pqrs", {}, token),
    getPQRSById: (id, token) => request(`/pqrs/${id}`, {}, token),
    getPQRSByCliente: (clienteId, token) => request(`/pqrs/user/${clienteId}`, {}, token),
    createPQRS: (usuarioId, body, token) => request(`/pqrs/create?usuario_id=${usuarioId}`, { method: "POST", body: JSON.stringify(body) }, token),
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
