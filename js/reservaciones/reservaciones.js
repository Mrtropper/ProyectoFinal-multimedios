// ─── reservaciones.js ─────────────────────────────────────────────────────
import { api }                        from '../api.js';
import { toast, setError, clearError, spinner, markActiveNav } from '../app.js';

const ENDPOINT   = '/reservacion/reservacion.php';
const CLIENTE_EP = '/cliente/cliente.php';
const HAB_EP     = '/habitacion/habitacion.php';

const form          = document.getElementById('form-res');
const idInput       = document.getElementById('res-id');
const fechaInInput  = document.getElementById('res-fecha-in');
const fechaOutInput = document.getElementById('res-fecha-out');
const clienteSelect = document.getElementById('res-cliente');
const habSelect     = document.getElementById('res-habitacion');
const observInput   = document.getElementById('res-observacion');
const btnGuardar    = document.getElementById('btn-guardar');
const btnNuevo      = document.getElementById('btn-nuevo');
const tableWrap     = document.getElementById('tabla-wrap');

let editando = false;

function validar() {
    let ok = true;
    [fechaInInput, fechaOutInput].forEach(i => clearError(i));
    if (!fechaInInput.value)  { setError(fechaInInput,  'Fecha de entrada obligatoria.'); ok=false; }
    if (!fechaOutInput.value) { setError(fechaOutInput, 'Fecha de salida obligatoria.'); ok=false; }
    if (fechaInInput.value && fechaOutInput.value && fechaInInput.value >= fechaOutInput.value) {
        setError(fechaOutInput, 'La salida debe ser posterior a la entrada.'); ok=false;
    }
    if (!clienteSelect.value)    { toast('Seleccioná un cliente.', 'error'); ok=false; }
    if (!habSelect.value)        { toast('Seleccioná una habitación.', 'error'); ok=false; }
    return ok;
}

function renderTabla(lista) {
    if (!lista.length) {
        tableWrap.innerHTML = '<p style="padding:1rem;color:#6b7c93;">Sin reservaciones registradas.</p>';
        return;
    }
    tableWrap.innerHTML = `
        <table>
            <thead><tr>
                <th>#</th><th>Cliente</th><th>Habitación</th>
                <th>Entrada</th><th>Salida</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
            ${lista.map(r => `
                <tr>
                    <td>${r.id ?? r.idReservacion ?? ''}</td>
                    <td>${r.cliente ?? r.nombreCliente ?? r.idCliente ?? ''}</td>
                    <td>${r.habitacion ?? r.numeroHabitacion ?? r.idHabitacion ?? ''}</td>
                    <td>${r.fechaEntrada ?? r.fechaIn ?? ''}</td>
                    <td>${r.fechaSalida ?? r.fechaOut ?? ''}</td>
                    <td><span class="badge ${r.estado==1||r.activo ? 'badge-active':'badge-inactive'}">${r.estado==1||r.activo?'Activa':'Inactiva'}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-accent btn-sm" onclick="editarRes(${JSON.stringify(r).replace(/"/g,'&quot;')})">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="desactivarRes(${r.id ?? r.idReservacion})">Desactivar</button>
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

async function cargarSelects() {
    try {
        const [clientes, habs] = await Promise.all([api.get(CLIENTE_EP), api.get(HAB_EP)]);
        const lc = Array.isArray(clientes) ? clientes : (clientes.results ?? clientes.data ?? []);
        const lh = Array.isArray(habs)     ? habs     : (habs.results ?? habs.data ?? []);
        clienteSelect.innerHTML = '<option value="">— Cliente —</option>' +
            lc.map(c => `<option value="${c.id ?? c.idCliente}">${c.nombre} ${c.apellido ?? ''}</option>`).join('');
        habSelect.innerHTML = '<option value="">— Habitación —</option>' +
            lh.map(h => `<option value="${h.id ?? h.idHabitacion}">Hab. ${h.numero ?? h.numeroHabitacion} — ${h.tipo ?? ''}</option>`).join('');
    } catch { toast('Error al cargar selects.', 'error'); }
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validar()) return;
    const payload = {
        id_cliente: parseInt(clienteSelect.value),
        id_habitacion: parseInt(habSelect.value),
        fecha_entrada: fechaInInput.value,
        fecha_salida: fechaOutInput.value,
        cantidad_personas: 2,
        estado: 'Pendiente',
        total: 0,
        usuario: 'Mario'
    };
    try {
        if (editando) { await api.put( ENDPOINT,{ id: idInput.value, ...payload }); toast('Reservación actualizada.'); }
        else          { await api.post(ENDPOINT, payload);                      toast('Reservación creada.'); }
        resetForm(); cargar();
    } catch(e) { toast(e.message, 'error'); }
});

window.editarRes = function(r) {
    editando = true;
    idInput.value       = r.id ?? r.idReservacion ?? '';
    fechaInInput.value  = r.fechaEntrada ?? r.fechaIn ?? '';
    fechaOutInput.value = r.fechaSalida  ?? r.fechaOut ?? '';
    clienteSelect.value = r.idCliente ?? '';
    habSelect.value     = r.idHabitacion ?? '';
    observInput.value   = r.observacion ?? '';
    btnGuardar.textContent = 'Actualizar';
    document.getElementById('form-panel').scrollIntoView({ behavior: 'smooth' });
};

window.desactivarRes = async function(id) {
    if (!confirm('¿Desactivar esta reservación?')) return;
    try { await api.delete( ENDPOINT, { id } ); toast('Reservación desactivada.', 'info'); cargar(); }
    catch(e) { toast(e.message, 'error'); }
};

function resetForm() {
    editando = false; form.reset(); idInput.value = '';
    btnGuardar.textContent = 'Guardar';
    [fechaInInput, fechaOutInput].forEach(i => clearError(i));
}

btnNuevo.addEventListener('click', resetForm);
markActiveNav();
cargarSelects();
cargar();
