// ─── pagos.js ─────────────────────────────────────────────────────────────
import { api }                        from '../api.js';
import { toast, setError, clearError, spinner, markActiveNav } from '../app.js';

const ENDPOINT = '/pago/';
const RES_EP   = '/reservacion/';

const form      = document.getElementById('form-pago');
const idInput   = document.getElementById('pago-id');
const resSelect = document.getElementById('pago-reservacion');
const montoInput= document.getElementById('pago-monto');
const metodoInput= document.getElementById('pago-metodo');
const fechaInput= document.getElementById('pago-fecha');
const btnGuardar= document.getElementById('btn-guardar');
const btnNuevo  = document.getElementById('btn-nuevo');
const tableWrap = document.getElementById('tabla-wrap');

let editando = false;

function validar() {
    let ok = true;
    [montoInput].forEach(i => clearError(i));
    if (!resSelect.value)              { toast('Seleccioná una reservación.', 'error'); ok=false; }
    if (!montoInput.value || +montoInput.value <= 0) { setError(montoInput, 'Monto inválido.'); ok=false; }
    if (!fechaInput.value)             { toast('La fecha es obligatoria.', 'error'); ok=false; }
    return ok;
}

function renderTabla(lista) {
    if (!lista.length) {
        tableWrap.innerHTML = '<p style="padding:1rem;color:#6b7c93;">Sin pagos registrados.</p>';
        return;
    }
    tableWrap.innerHTML = `
        <table>
            <thead><tr>
                <th>#</th><th>Reservación</th><th>Monto</th><th>Método</th><th>Fecha</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
            ${lista.map(p => `
                <tr>
                    <td>${p.id ?? p.idPago ?? ''}</td>
                    <td>${p.reservacion ?? p.idReservacion ?? ''}</td>
                    <td>₡${parseFloat(p.monto ?? 0).toLocaleString('es-CR')}</td>
                    <td>${p.metodoPago ?? p.metodo ?? ''}</td>
                    <td>${p.fecha ?? p.fechaPago ?? ''}</td>
                    <td><span class="badge ${p.estado==1||p.activo ? 'badge-active':'badge-inactive'}">${p.estado==1||p.activo?'Activo':'Inactivo'}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-accent btn-sm" onclick="editarPago(${JSON.stringify(p).replace(/"/g,'&quot;')})">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="desactivarPago(${p.id ?? p.idPago})">Desactivar</button>
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

async function cargarReservaciones() {
    try {
        const data = await api.get(RES_EP);
        const lista = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
        resSelect.innerHTML = '<option value="">— Reservación —</option>' +
            lista.map(r => `<option value="${r.id ?? r.idReservacion}">Reserv. #${r.id ?? r.idReservacion} — ${r.fechaEntrada ?? r.fechaIn ?? ''}</option>`).join('');
    } catch { resSelect.innerHTML = '<option value="">Error al cargar</option>'; }
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validar()) return;
    const payload = {
        idReservacion: resSelect.value,
        monto:         parseFloat(montoInput.value),
        metodoPago:    metodoInput.value,
        fecha:         fechaInput.value,
    };
    try {
        if (editando) { await api.put(ENDPOINT + idInput.value + '/', payload); toast('Pago actualizado.'); }
        else          { await api.post(ENDPOINT, payload);                      toast('Pago registrado.'); }
        resetForm(); cargar();
    } catch(e) { toast(e.message, 'error'); }
});

window.editarPago = function(p) {
    editando = true;
    idInput.value    = p.id ?? p.idPago ?? '';
    resSelect.value  = p.idReservacion ?? p.reservacion ?? '';
    montoInput.value = p.monto ?? '';
    metodoInput.value= p.metodoPago ?? p.metodo ?? 'efectivo';
    fechaInput.value = p.fecha ?? p.fechaPago ?? '';
    btnGuardar.textContent = 'Actualizar';
    document.getElementById('form-panel').scrollIntoView({ behavior: 'smooth' });
};

window.desactivarPago = async function(id) {
    if (!confirm('¿Desactivar este pago?')) return;
    try { await api.delete(ENDPOINT + id + '/'); toast('Pago desactivado.', 'info'); cargar(); }
    catch(e) { toast(e.message, 'error'); }
};

function resetForm() {
    editando = false; form.reset(); idInput.value = '';
    btnGuardar.textContent = 'Guardar';
    clearError(montoInput);
}

btnNuevo.addEventListener('click', resetForm);
markActiveNav();
cargarReservaciones();
cargar();
