/* ============================================================
   Item Editor — behaviour only
   ------------------------------------------------------------
   HTML:  <!-- Item Editor --> block in each page that uses it,
          plus the four <template id="field*Template"> blocks
   CSS:   inventory.css → .field / .field-group / .generated-name
   JS:    this file — open/close, cloning one field per property,
          and writing the draft back on save

   Adding an item and editing one are the same panel: adding is
   editing a blank. This file builds no markup — it clones a field
   template per property and fills the label, name and value. In
   Angular the block becomes a component and the loop becomes an
   @for over the catalog's properties.

   Usage:
     ItemEditor.open({ item, cfg, onSave })                  // edit
     ItemEditor.open({ cfg, onSave })                        // add
     ItemEditor.open({ cfg, items, properties, namingTemplate, onSave })
   ============================================================ */
(function (global) {

  const INV = window.INVENTORY;

  let panel, body, titleEl, doneEl, nameEl, nameSourceEl, fieldHost;
  let templates = {};
  let draft = null;
  let ctx   = null;

  function cache() {
    if (panel) return true;
    panel = document.getElementById('itemEditor');
    if (!panel) return false;

    body         = panel.querySelector('[data-editor-body]');
    titleEl      = panel.querySelector('[data-editor-title]');
    doneEl       = panel.querySelector('[data-editor-done]');
    nameEl       = panel.querySelector('[data-editor-name]');
    nameSourceEl = panel.querySelector('[data-editor-name-source]');
    fieldHost    = panel.querySelector('[data-editor-fields]');

    templates = {
      text:    document.getElementById('fieldTextTemplate'),
      number:  document.getElementById('fieldNumberTemplate'),
      select:  document.getElementById('fieldSelectTemplate'),
      boolean: document.getElementById('fieldBooleanTemplate')
    };
    templates.location = templates.text;

    panel.addEventListener('click', (e) => {
      if (e.target === panel || e.target.closest('[data-close]')) close();
      if (e.target.closest('[data-editor-done]')) commit();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) close();
    });

    body.addEventListener('input', onInput);
    body.addEventListener('change', onChange);
    return true;
  }

  /* One field per property, of the property's own kind — a toggle is a
     switch, a vendor is a select — so the panel is the catalog's shape
     rather than a generic form. */
  function buildField(p) {
    const node = templates[p.kind].content.firstElementChild.cloneNode(true);
    const value = draft[p.id];

    node.querySelector('[data-field-label]').textContent = p.label;

    if (p.kind === 'boolean') {
      const input = node.querySelector('input');
      input.dataset.prop = p.id;
      input.checked = !!value;
      node.querySelector('[data-field-state]').textContent = value ? 'Yes' : 'No';
      return node;
    }

    const input = node.querySelector('[data-field-input]');
    input.dataset.prop = p.id;

    if (p.kind === 'select') {
      (p.options || []).forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        input.appendChild(opt);
      });
      input.value = value || '';
      return node;
    }

    input.value = (value === null || value === undefined) ? '' : value;
    return node;
  }

  function render() {
    const { properties, template } = ctx;

    nameSourceEl.textContent = template
      .map(id => INV.propertyById(id, properties).label)
      .join(' · ');
    nameEl.textContent = INV.itemName({ props: draft }, template);

    fieldHost.replaceChildren(...properties.map(buildField));
  }

  function refreshName() {
    nameEl.textContent = INV.itemName({ props: draft }, ctx.template);
  }

  /* ── Editing ──────────────────────────────────────────────── */
  function onInput(e) {
    const id = e.target.dataset.prop;
    if (!id) return;
    const p = INV.propertyById(id, ctx.properties);
    if (p.kind === 'boolean') return;

    if (p.kind === 'number') {
      const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
      if (cleaned !== e.target.value) {
        const at = e.target.selectionStart - (e.target.value.length - cleaned.length);
        e.target.value = cleaned;
        e.target.setSelectionRange(at, at);
      }
    }
    draft[id] = e.target.value;
    refreshName();
  }

  function onChange(e) {
    const id = e.target.dataset.prop;
    if (!id) return;
    const p = INV.propertyById(id, ctx.properties);

    if (p.kind === 'boolean') {
      draft[id] = e.target.checked;
      /* Only this field's own label is rewritten, so nothing else in
         the panel loses what is half-typed into it. */
      e.target.closest('.field').querySelector('[data-field-state]')
        .textContent = e.target.checked ? 'Yes' : 'No';
      return;
    }
    if (p.kind === 'select') { draft[id] = e.target.value; refreshName(); }
  }

  /* ── Open, close, commit ──────────────────────────────────── */
  function open(opts) {
    if (!cache()) return;

    const cfg        = opts.cfg;
    const properties = opts.properties || INV.CATALOG_PROPERTIES;
    const template   = opts.namingTemplate || INV.NAMING_TEMPLATE;
    const items      = opts.items || INV.ITEMS;
    const adding     = !opts.item;
    const item       = opts.item || INV.newItem(cfg, items, properties);

    ctx = { item, cfg, items, properties, template, onSave: opts.onSave, adding };
    draft = Object.assign({}, item.props || {});

    titleEl.textContent = adding ? 'Add Item' : 'Edit Item Details';
    doneEl.textContent  = adding ? 'Add Item' : 'Save Item';

    render();
    panel.classList.add('open');
    fieldHost.querySelector('[data-prop]')?.focus();
  }

  function close() {
    if (!panel) return;
    panel.classList.remove('open');
    draft = null;
    ctx = null;
  }

  function commit() {
    if (!ctx) return;
    const { item, cfg, items, properties, template, adding } = ctx;

    /* A number is stored as a number and a blank as a blank, so the
       tables are never handed a string that only looks like a figure. */
    properties.forEach(p => {
      const raw = draft[p.id];
      if (p.kind === 'boolean') { draft[p.id] = !!raw; return; }
      if (p.kind === 'number') {
        const n = String(raw ?? '').trim();
        draft[p.id] = n === '' ? '' : Number(n);
        return;
      }
      draft[p.id] = String(raw ?? '').trim();
    });

    item.props = draft;
    item.name  = INV.itemName(item, template);
    if (draft['p-swatch'] !== '' && draft['p-swatch'] !== undefined) {
      item.swatch = draft['p-swatch'];
    }

    /* A new single-unit item still needs the record it IS, even though
       nothing here edits it — the table it lands in does. */
    if (cfg.singleUnit && !item.single) item.single = { location: null, allocations: [] };
    if (adding) INV.addItem(item, items);

    /* Closing clears ctx, so what the caller wants back is held first. */
    const onSave = ctx.onSave;
    close();

    if (global.toast) {
      global.toast(adding ? `${item.name || 'Item'} added.` : 'Item details saved.', 'success');
    }
    if (onSave) onSave(item, adding);
  }

  global.ItemEditor = { open, close };

})(window);
