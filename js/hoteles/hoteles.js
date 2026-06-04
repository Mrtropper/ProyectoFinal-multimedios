// ─── hoteles.js ────────────────────────────────────────────────────────────
import { api }                        from '../api.js';
import { toast, setError, clearError, spinner, markActiveNav } from '../app.js';

const ENDPOINT = '/hotel/';

// ── referencias al DOM ──────────────────────────────────────────────────────
const form      = document.getElementById('form-hotel');
const idInput   = document.getElementById('hotel-id');
const nombreInput = document.getElementById('hotel-nombre');
const dirInput  = document.getElementById('hotel-direccion');
const telInput  = document.getElementById('hotel-telefono');
const emailInput= document.getElementById('hotel-email');
const btnGuardar= document.getElementById('btn-guardar');
const btnNuevo  = document.getElementById('btn-nuevo');
const tableBody = document.getElementById('tabla-hoteles');

let editando = false;

// ── helpers de validación ───────────────────────────────────────────────────
function validarForm() {
    let ok = true;
    [nombreInput, dirInput, telInput, emailInput].forEach(i => clearError(i));

    if (!nombreInput.value.trim()) { setError(nombreInput, 'El nombre es obligatorio.'); ok = false; }
    if (!dirInput.value.trim())    { setError(dirInput,    'La dirección es obligatoria.'); ok = false; }
    if (!telInput.value.trim())    { setError(telInput,    'El teléfono es obligatorio.'); ok = false; }
    if (emailInput.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
        setError(emailInput, 'Correo inválido.'); ok = false;
    }
    return ok;
}

// ── renderizar tabla ────────────────────────────────────────────────────────
function renderTabla(hoteles) {
    if (!hoteles || hoteles.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#6b7c93;">No hay hoteles registrados.</td></tr>';
        return;
    }
    tableBody.innerHTML = hoteles.map(h => `
        <tr>
            <td>${h.id ?? h.idHotel ?? ''}</td>
            <td>${h.nombre ?? ''}</td>
            <td>${h.direccion ?? ''}</td>
            <td>${h.telefono ?? ''}</td>
            <td>${h.email ?? ''}</td>
            <td>
                <span class="badge ${h.estado == 1 || h.activo ? 'badge-active' : 'badge-inactive'}">
                    ${h.estado == 1 || h.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-accent btn-sm" onclick="editarHotel(${JSON.stringify(h).replace(/"/g,'&quot;')})">Editar</button>
                    <button class="btn btn-danger btn-sm"  onclick="desactivarHotel(${h.id ?? h.idHotel})">Desactivar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ── cargar hoteles ──────────────────────────────────────────────────────────
async function cargarHoteles() {
    const wrap = document.getElementById('tabla-wrap');
    wrap.innerHTML = '';
    wrap.appendChild(spinner());
    try {
        const data = await api.get(ENDPOINT);
        const lista = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
        wrap.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th><th>Nombre</th><th>Dirección</th>
                        <th>Teléfono</th><th>Email</th><th>Estado</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-hoteles"></tbody>
            </table>`;
        renderTabla(lista);
    } catch (e) {
        wrap.innerHTML = `<p style="color:var(--danger);padding:1rem;">Error al cargar: ${e.message}</p>`;
    }
}

// ── guardar (crear / actualizar) ────────────────────────────────────────────
form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validarForm()) return;

    const payload = {
        nombre:    nombreInput.value.trim(),
        direccion: dirInput.value.trim(),
        telefono:  telInput.value.trim(),
        email:     emailInput.value.trim(),
    };

    try {
        if (editando) {
            await api.put(ENDPOINT + idInput.value + '/', payload);
            toast('Hotel actualizado correctamente.');
        } else {
            await api.post(ENDPOINT, payload);
            toast('Hotel creado correctamente.');
        }
        resetForm();
        cargarHoteles();
    } catch (e) {
        toast(e.message, 'error');
    }
});

// ── editar ──────────────────────────────────────────────────────────────────
window.editarHotel = function(h) {
    editando = true;
    idInput.value      = h.id ?? h.idHotel ?? '';
    nombreInput.value  = h.nombre ?? '';
    dirInput.value     = h.direccion ?? '';
    telInput.value     = h.telefono ?? '';
    emailInput.value   = h.email ?? '';
    btnGuardar.textContent = 'Actualizar';
    document.getElementById('form-panel').scrollIntoView({ behavior: 'smooth' });
};

// ── desactivar ──────────────────────────────────────────────────────────────
window.desactivarHotel = async function(id) {
    if (!confirm('¿Desactivar este hotel?')) return;
    try {
        await api.delete(ENDPOINT + id + '/');
        toast('Hotel desactivado.', 'info');
        cargarHoteles();
    } catch(e) { toast(e.message, 'error'); }
};

// ── limpiar form ─────────────────────────────────────────────────────────────
function resetForm() {
    editando = false;
    form.reset();
    idInput.value = '';
    btnGuardar.textContent = 'Guardar';
    [nombreInput, dirInput, telInput, emailInput].forEach(i => clearError(i));
}

btnNuevo.addEventListener('click', resetForm);

// ── init ─────────────────────────────────────────────────────────────────────
markActiveNav();
cargarHoteles();
