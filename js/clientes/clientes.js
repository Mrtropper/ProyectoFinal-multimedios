// ─── clientes.js ───────────────────────────────────────────────────────────
import { api }                        from '../api.js';
import { toast, setError, clearError, spinner, markActiveNav } from '../app.js';

const ENDPOINT = '/cliente/cliente.php';

const form       = document.getElementById('form-cliente');
const idInput    = document.getElementById('cli-id');
const nombreInput= document.getElementById('cli-nombre');
const apellidoInput= document.getElementById('cli-apellido');
const cedulaInput= document.getElementById('cli-cedula');
const telInput   = document.getElementById('cli-telefono');
const emailInput = document.getElementById('cli-email');
const btnGuardar = document.getElementById('btn-guardar');
const btnNuevo   = document.getElementById('btn-nuevo');
const tableWrap  = document.getElementById('tabla-wrap');

let editando = false;

function validar() {
    let ok = true;
    [nombreInput, apellidoInput, cedulaInput, emailInput].forEach(i => clearError(i));
    if (!nombreInput.value.trim())   { setError(nombreInput,   'Nombre obligatorio.'); ok=false; }
    if (!apellidoInput.value.trim()) { setError(apellidoInput, 'Apellido obligatorio.'); ok=false; }
    if (!cedulaInput.value.trim())   { setError(cedulaInput,   'Cédula obligatoria.'); ok=false; }
    if (emailInput.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
        setError(emailInput, 'Correo inválido.'); ok=false;
    }
    return ok;
}

function renderTabla(lista) {
    if (!lista.length) {
        tableWrap.innerHTML = '<p style="padding:1rem;color:#6b7c93;">Sin clientes registrados.</p>';
        return;
    }
    tableWrap.innerHTML = `
        <table>
            <thead><tr>
                <th>#</th><th>Nombre</th><th>Apellido</th><th>Cédula</th>
                <th>Teléfono</th><th>Email</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
            ${lista.map(c => `
                <tr>
                    <td>${c.id ?? c.idCliente ?? ''}</td>
                    <td>${c.nombre ?? ''}</td>
                    <td>${c.apellido ?? ''}</td>
                    <td>${c.cedula ?? c.identificacion ?? ''}</td>
                    <td>${c.telefono ?? ''}</td>
                    <td>${c.email ?? ''}</td>
                    <td><span class="badge ${c.estado==1||c.activo ? 'badge-active':'badge-inactive'}">${c.estado==1||c.activo?'Activo':'Inactivo'}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-accent btn-sm" onclick="editarCliente(${JSON.stringify(c).replace(/"/g,'&quot;')})">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="desactivarCliente(${c.id ?? c.idCliente})">Desactivar</button>
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

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validar()) return;
    const payload = {
        nombre: nombreInput.value.trim(),
        apellidos: apellidoInput.value.trim(),
        correo: emailInput.value.trim(),
        telefono: telInput.value.trim(),
        identificacion: cedulaInput.value.trim(),
        usuario: 'Mario'
    };
    try {
        if (editando) { await api.put( ENDPOINT,{ id: idInput.value, ...payload } ); toast('Cliente actualizado.'); }
        else          { await api.post(ENDPOINT, payload);                      toast('Cliente registrado.'); }
        resetForm(); cargar();
    } catch(e) { toast(e.message, 'error'); }
});

window.editarCliente = function(c) {
    editando = true;
    idInput.value       = c.id ?? c.idCliente ?? '';
    nombreInput.value   = c.nombre ?? '';
    apellidoInput.value = c.apellido ?? '';
    cedulaInput.value   = c.cedula ?? c.identificacion ?? '';
    telInput.value      = c.telefono ?? '';
    emailInput.value    = c.email ?? '';
    btnGuardar.textContent = 'Actualizar';
    document.getElementById('form-panel').scrollIntoView({ behavior: 'smooth' });
};

window.desactivarCliente = async function(id) {
    if (!confirm('¿Desactivar este cliente?')) return;
    try { await api.delete(ENDPOINT, { id } ); toast('Cliente desactivado.', 'info'); cargar(); }
    catch(e) { toast(e.message, 'error'); }
};

function resetForm() {
    editando = false; form.reset(); idInput.value = '';
    btnGuardar.textContent = 'Guardar';
    [nombreInput, apellidoInput, cedulaInput, emailInput].forEach(i => clearError(i));
}

btnNuevo.addEventListener('click', resetForm);
markActiveNav();
cargar();
