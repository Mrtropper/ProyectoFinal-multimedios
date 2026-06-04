// ─── api.js — módulo base para todas las peticiones HTTP ───────────────────
const BASE_URL = 'https://paginas-web-cr.com/Api/hotelApi';

/**
 * Realiza una petición fetch y retorna la respuesta JSON.
 * Lanza un Error con el mensaje del servidor si el status no es ok.
 */
async function request(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    // Algunos DELETE devuelven 204 sin body
    if (response.status === 204) return { ok: true };

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const msg = data.message || data.detail || `Error ${response.status}`;
        throw new Error(msg);
    }
    return data;
}

export const api = {
    get:    (endpoint)        => request(endpoint, 'GET'),
    post:   (endpoint, body)  => request(endpoint, 'POST',   body),
    put:    (endpoint, body)  => request(endpoint, 'PUT',    body),
    delete: (endpoint)        => request(endpoint, 'DELETE'),
};
