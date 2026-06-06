const BASE_URL = 'https://paginas-web-cr.com/Api/hotelApi';

async function request(endpoint, method = 'GET', body = null) {

    const options = { method };

    if (body) {
        options.headers = {
            'Content-Type': 'application/json'
        };

        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
    }

    return data;
}

export const api = {
    get: (endpoint) => request(endpoint, 'GET'),

    post: (endpoint, body) =>
        request(endpoint, 'POST', body),

    put: (endpoint, body) =>
        request(endpoint, 'PUT', body),

    delete: (endpoint, body) =>
        request(endpoint, 'DELETE', body)
};