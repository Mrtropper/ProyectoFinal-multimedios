// ─── habitaciones.js ───────────────────────────────────────────────────────
import { api }                        from '../api.js';
import { toast, setError, clearError, spinner, markActiveNav } from '../app.js';

const ENDPOINT    = '/habitacion/';
const SEDE_EP     = '/sede/';

const form        = document.getElementById('form-hab');
const idInput     = document.getElementById('hab-id');
const numInput    = document.getElementById('hab-numero');
const tipoInput   = document.getElementById('hab-tipo');
const precioInput = document.getElementById('hab-precio');
const capacInput  = document.getElementById('hab-capacidad');
const sedeSelect  = document.getElementById('hab-sede');
const btnGuardar  = document.getElementById('btn-guardar');
const btnNuevo    = document.getElementById('btn-nuevo');
const tableWrap   = document.getElementById('tabla-wrap');

let editando = false;

function validar() {
    let ok = true;
    [numInput, precioInput, capacInput].forEach(i => clearError(i));
    if (!numInput.value.trim())                { setError(numInput,    'Número obligatorio.'); ok=false; }
    if (!precioInput.value || +precioInput.value<=0) { setError(precioInput, 'Precio inválido.'); ok=false; }
    if (!capacInput.value  || +capacInput.value<=0)  { setError(capacInput,  'Capacidad inválida.'); ok=false; }
    if (!sedeSelect.value)                     { toast('Seleccioná una sede.', 'error'); ok=false; }
    return ok;
}

function renderTabla(lista) {
    if (!lista.length) {
        tableWrap.innerHTML = '<p style="padding:1rem;color:#6b7c93;">Sin habitaciones registradas.</p>';
        return;
    }
    tableWrap.innerHTML = `
        <table>
            <thead><tr>
                <th>#</th><th>Número</th><th>Tipo</th><th>Precio</th><th>Capacidad</th><th>Sede</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
            ${lista.map(h => `
                <tr>
                    <td>${h.id ?? h.idHabitacion ?? ''}</td>
                    <td>${h.numero ?? h.numeroHabitacion ?? ''}</td>
                    <td>${h.tipo ?? ''}</td>
                    <td>₡${parseFloat(h.precio ?? 0).toLocaleString('es-CR')}</td>
                    <td>${h.capacidad ?? ''}</td>
                    <td>${h.sede ?? h.nombreSede ?? h.idSede ?? ''}</td>
                    <td><span class="badge ${h.estado==1||h.activo ? 'badge-active':'badge-inactive'}">${h.estado==1||h.activo?'Activo':'Inactivo'}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-accent btn-sm" onclick="editarHab(${JSON.stringify(h).replace(/"/g,'&quot;')})">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="desactivarHab(${h.id ?? h.idHabitacion})">Desactivar</button>
                        </div>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}

async function cargar() {
    tableWrap.innerHTML = '';
    tableWrap.appendChild(spinner());
    try {
        const data = await api.get(ENDPOINT);
        renderTabla(Array.isArray(data) ? data : (data.results ?? data.data ?? []));
    } catch(e) { tableWrap.innerHTML = `<p style="color:var(--danger);padding:1rem;">Error: ${e.message}</p>`; }
}

async function cargarSedes() {
    try {
        const data = await api.get(SEDE_EP);
        const lista = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
        sedeSelect.innerHTML = '<option value="">— Sede —</option>' +
            lista.map(s => `<option value="${s.id ?? s.idSede}">${s.nombre}</option>`).join('');
    } catch { sedeSelect.innerHTML = '<option value="">Error cargando sedes</option>'; }
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validar()) return;
    const payload = {
        numero: numInput.value.trim(),
        tipo: tipoInput.value,
        precio: parseFloat(precioInput.value),
        capacidad: parseInt(capacInput.value),
        idSede: sedeSelect.value,
    };
    try {
        if (editando) { await api.put(ENDPOINT + idInput.value + '/', payload); toast('Habitación actualizada.'); }
        else          { await api.post(ENDPOINT, payload);                      toast('Habitación creada.'); }
        resetForm(); cargar();
    } catch(e) { toast(e.message, 'error'); }
});

window.editarHab = function(h) {
    editando = true;
    idInput.value     = h.id ?? h.idHabitacion ?? '';
    numInput.value    = h.numero ?? h.numeroHabitacion ?? '';
    tipoInput.value   = h.tipo ?? 'simple';
    precioInput.value = h.precio ?? '';
    capacInput.value  = h.capacidad ?? '';
    sedeSelect.value  = h.idSede ?? h.sede ?? '';
    btnGuardar.textContent = 'Actualizar';
    document.getElementById('form-panel').scrollIntoView({ behavior: 'smooth' });
};

window.desactivarHab = async function(id) {
    if (!confirm('¿Desactivar esta habitación?')) return;
    try { await api.delete(ENDPOINT + id + '/'); toast('Habitación desactivada.', 'info'); cargar(); }
    catch(e) { toast(e.message, 'error'); }
};

function resetForm() {
    editando = false; form.reset(); idInput.value = '';
    btnGuardar.textContent = 'Guardar';
    [numInput, precioInput, capacInput].forEach(i => clearError(i));
}

btnNuevo.addEventListener('click', resetForm);
markActiveNav();
cargarSedes();
cargar();
