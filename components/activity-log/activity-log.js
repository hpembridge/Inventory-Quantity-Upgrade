/* ============================================================
   Activity Log — behaviour only
   ------------------------------------------------------------
   HTML:  <!-- Activity Log --> block in each page that uses it,
          plus <template id="timelineRowTemplate">
   CSS:   inventory.css → "Activity log" section
   JS:    this file — open/close, and filling the timeline rows

   This file builds no markup. It clones the page's template once
   per event and fills two text nodes. In Angular the block below
   becomes a component and this loop becomes an @for.
   ============================================================ */
(function (global) {

  let panel, body, list, caption, empty, rowTemplate;

  function cache() {
    if (panel) return true;
    panel = document.getElementById('activityLog');
    if (!panel) return false;
    body        = panel.querySelector('[data-log-body]');
    list        = panel.querySelector('[data-log-list]');
    caption     = panel.querySelector('[data-log-caption]');
    empty       = panel.querySelector('[data-log-empty]');
    rowTemplate = document.getElementById('timelineRowTemplate');

    panel.addEventListener('click', (e) => {
      if (e.target === panel || e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) close();
    });
    return true;
  }

  /* Oldest first, so the log reads as the story of the record rather
     than as a stack of the most recent thing. The first and last rows
     take a modifier class so the connector thread starts and stops at
     the events rather than running off the panel. */
  function open(opts) {
    if (!cache()) return;

    const entries = opts.entries || [];
    caption.textContent = opts.caption || '';
    caption.hidden = !opts.caption;

    list.replaceChildren();
    entries.forEach((entry, i) => {
      const row = rowTemplate.content.firstElementChild.cloneNode(true);
      if (i === 0) row.classList.add('timeline-row-first');

      const connector = row.querySelector('.timeline-connector');
      if (i === 0) connector.classList.add('timeline-connector-first');
      if (i === entries.length - 1) connector.classList.add('timeline-connector-last');

      row.querySelector('[data-log-date]').textContent  = entry.at;
      row.querySelector('[data-log-event]').textContent = entry.text;
      list.appendChild(row);
    });

    list.hidden  = entries.length === 0;
    empty.hidden = entries.length > 0;

    panel.classList.add('open');
    panel.querySelector('[data-close]').focus();
  }

  function close() {
    if (panel) panel.classList.remove('open');
  }

  global.ActivityLog = { open, close };

})(window);
