// ─── app.js — utilidades globales compartidas por todos los módulos ─────────

/** Muestra un toast en pantalla (success | error | info) */
export function toast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

/** Marca un input como inválido y muestra mensaje */
export function setError(input, msg) {
    input.classList.add('error');
    let span = input.nextElementSibling;
    if (!span || !span.classList.contains('field-error')) {
        span = document.createElement('span');
        span.className = 'field-error';
        span.style.cssText = 'color:#c0392b;font-size:.78rem;margin-top:.15rem;';
        input.parentNode.appendChild(span);
    }
    span.textContent = msg;
}

/** Limpia el estado de error de un input */
export function clearError(input) {
    input.classList.remove('error');
    const span = input.nextElementSibling;
    if (span && span.classList.contains('field-error')) span.textContent = '';
}

/** Devuelve un spinner div para mostrar mientras carga */
export function spinner() {
    const d = document.createElement('div');
    d.className = 'spinner';
    return d;
}

/** Marca en el navbar el link de la página actual */
export function markActiveNav() {
    const current = location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(a => {
        const href = a.getAttribute('href').split('/').pop();
        a.classList.toggle('active', href === current);
    });
}
