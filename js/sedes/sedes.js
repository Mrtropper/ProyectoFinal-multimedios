// ─── sedes.js ──────────────────────────────────────────────────────────────
import { api }                        from '../api.js';
import { toast, setError, clearError, spinner, markActiveNav } from '../app.js';

const ENDPOINT       = '/sede/';
const HOTEL_ENDPOINT = '/hotel/';

const form         = document.getElementById('form-sede');
const idInput      = document.getElementById('sede-id');
const nombreInput  = document.getElementById('sede-nombre');
const dirInput     = document.getElementById('sede-direccion');
const telInput     = document.getElementById('sede-telefono');
const hotelSelect  = document.getElementById('sede-hotel');
const btnGuardar   = document.getElementById('btn-guardar');
const btnNuevo     = document.getElementById('btn-nuevo');
const tableWrap    = document.getElementById('tabla-wrap');

let editando = false;

function validar() {
    let ok = true;
    [nombreInput, dirInput, telInput].forEach(i => clearError(i));
    if (!nombreInput.value.trim()) { setError(nombreInput, 'Nombre obligatorio.'); ok = false; }
    if (!dirInput.value.trim())    { setError(dirInput,    'Dirección obligatoria.'); ok = false; }
    if (!hotelSelect.value)        { toast('Seleccioná un hotel.', 'error'); ok = false; }
    return ok;
}

function renderTabla(sedes) {
    if (!sedes.length) {
        tableWrap.innerHTML = '<p style="padding:1rem;color:#6b7c93;">Sin sedes registradas.</p>';
        return;
    }
    tableWrap.innerHTML = `
        <table>
            <thead><tr>
                <th>#</th><th>Nombre</th><th>Dirección</th><th>Teléfono</th><th>Hotel</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
            ${sedes.map(s => `
                <tr>
                    <td>${s.id ?? s.idSede ?? ''}</td>
                    <td>${s.nombre ?? ''}</td>
                    <td>${s.direccion ?? ''}</td>
                    <td>${s.telefono ?? ''}</td>
                    <td>${s.hotel ?? s.nombreHotel ?? s.idHotel ?? ''}</td>
                    <td><span class="badge ${s.estado==1||s.activo ? 'badge-active':'badge-inactive'}">${s.estado==1||s.activo ? 'Activo':'Inactivo'}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-accent btn-sm" onclick="editarSede(${JSON.stringify(s).replace(/"/g,'&quot;')})">Editar</button>
                            <button class="btn btn-danger btn-sm"  onclick="desactivarSede(${s.id ?? s.idSede})">Desactivar</button>
                        </div>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}

async function cargarSedes() {
    tableWrap.innerHTML = '';
    tableWrap.appendChild(spinner());
    try {
        const data = await api.get(ENDPOINT);
        const lista = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
        renderTabla(lista);
    } catch(e) { tableWrap.innerHTML = `<p style="color:var(--danger);padding:1rem;">Error: ${e.message}</p>`; }
}

async function cargarHoteles() {
    try {
        const data = await api.get(HOTEL_ENDPOINT);
        const lista = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
        hotelSelect.innerHTML = '<option value="">— Seleccionar hotel —</option>' +
            lista.map(h => `<option value="${h.id ?? h.idHotel}">${h.nombre}</option>`).join('');
    } catch(e) { hotelSelect.innerHTML = '<option value="">Error al cargar hoteles</option>'; }
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validar()) return;
    const payload = {
        nombre: nombreInput.value.trim(),
        direccion: dirInput.value.trim(),
        telefono: telInput.value.trim(),
        idHotel: hotelSelect.value,
    };
    try {
        if (editando) {
            await api.put(ENDPOINT + idInput.value + '/', payload);
            toast('Sede actualizada.');
        } else {
            await api.post(ENDPOINT, payload);
            toast('Sede creada.');
        }
        resetForm();
        cargarSedes();
    } catch(e) { toast(e.message, 'error'); }
});

window.editarSede = function(s) {
    editando = true;
    idInput.value     = s.id ?? s.idSede ?? '';
    nombreInput.value = s.nombre ?? '';
    dirInput.value    = s.direccion ?? '';
    telInput.value    = s.telefono ?? '';
    hotelSelect.value = s.idHotel ?? s.hotel ?? '';
    btnGuardar.textContent = 'Actualizar';
    document.getElementById('form-panel').scrollIntoView({ behavior: 'smooth' });
};

window.desactivarSede = async function(id) {
    if (!confirm('¿Desactivar esta sede?')) return;
    try { await api.delete(ENDPOINT + id + '/'); toast('Sede desactivada.', 'info'); cargarSedes(); }
    catch(e) { toast(e.message, 'error'); }
};

function resetForm() {
    editando = false;
    form.reset();
    idInput.value = '';
    btnGuardar.textContent = 'Guardar';
    [nombreInput, dirInput, telInput].forEach(i => clearError(i));
}

btnNuevo.addEventListener('click', resetForm);

markActiveNav();
cargarHoteles();
cargarSedes();
