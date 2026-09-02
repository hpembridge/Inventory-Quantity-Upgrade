/* Toast — window.toast(message, kind)
   kind: 'error' (default) | 'success' | 'info'
   Announced politely so a rejected value is not silent for screen
   reader users; auto-dismisses, and stale duplicates are replaced
   rather than stacked. */
(function (global) {
  const ICONS = {
    error:   'fa-circle-exclamation',
    success: 'fa-circle-check',
    info:    'fa-circle-info'
  };
  const LIFE = 4000;

  let host = null;
  function hostEl() {
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    return host;
  }

  function dismiss(el) {
    if (!el || el.classList.contains('is-leaving')) return;
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove());
    setTimeout(() => el.remove(), 200);
  }

  global.toast = function (message, kind = 'error') {
    const h = hostEl();
    /* The same complaint twice in a row is one complaint. */
    h.querySelectorAll('.toast').forEach(t => {
      if (t.dataset.msg === message) dismiss(t);
    });

    const el = document.createElement('div');
    el.className = `toast is-${kind}`;
    el.dataset.msg = message;
    el.innerHTML = `<i class="fa-solid ${ICONS[kind] || ICONS.info}"></i><span>${message}</span>`;
    el.addEventListener('click', () => dismiss(el));
    h.appendChild(el);
    setTimeout(() => dismiss(el), LIFE);
    return el;
  };
})(window);
