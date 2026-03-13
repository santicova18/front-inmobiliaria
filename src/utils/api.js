const BASE_URL =
    import.meta.env.VITE_API_URL || "http://proyecto-inmobiliario-production.up.railway.app";

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
    forgotPassword: (body) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
    resetPassword: (body) => request("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),

    // Lotes
    getLotes: (token) => request("/lotes", {}, token),
    getLote: (id, token) => request(`/lotes/${id}`, {}, token),
    createLote: (body, token) => request("/lotes", { method: "POST", body: JSON.stringify(body) }, token),
    updateLote: (id, body, token) => request(`/lotes/${id}`, { method: "PUT", body: JSON.stringify(body) }, token),
    deleteLote: (id, token) => request(`/lotes/${id}`, { method: "DELETE" }, token),
    updateEstadoLote: (id, estado, token) => request(`/lotes/${id}/estado`, { method: "PATCH", body: JSON.stringify({ estado }) }, token),

    // Compras
    getCompras: (token) => request("/compras", {}, token),
    getComprasByCliente: (clienteId, token) => request(`/compras/cliente/${clienteId}`, {}, token),
    createCompra: (body, token) => request("/compras", { method: "POST", body: JSON.stringify(body) }, token),

    // Pagos
    getPagos: (token) => request("/pagos", {}, token),
    getPagosByCompra: (compraId, token) => request(`/pagos/compra/${compraId}`, {}, token),
    registrarPago: (body, token) => request("/pagos", { method: "POST", body: JSON.stringify(body) }, token),

    // PQRS
    getPQRS: (token) => request("/pqrs", {}, token),
    getPQRSByCliente: (clienteId, token) => request(`/pqrs/cliente/${clienteId}`, {}, token),
    createPQRS: (body, token) => request("/pqrs", { method: "POST", body: JSON.stringify(body) }, token),
    updatePQRS: (id, body, token) => request(`/pqrs/${id}`, { method: "PUT", body: JSON.stringify(body) }, token),

    // Usuarios (admin)
    getClientes: (token) => request("/usuarios/clientes", {}, token),
};