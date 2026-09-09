/* ============================================================
   Catalog Settings — behaviour
   ------------------------------------------------------------
   HTML:  catalog-settings.html (a measured catalog)
          catalog-settings-dies.html (a single-unit catalog)
   CSS:   inventory.css → .unit-config-row, .seg, .builder-row
   JS:    this file

   Both settings pages are the same screen pointed at a different
   catalog, so they share this file and differ only in the config
   block in their <head>:

     window.CATALOG_SETTINGS = { config, backHref }

   ============================================================ */
/* ============================================================
   Catalog Settings
   ------------------------------------------------------------
   Two levels of setting live here. Single-Unit Items belongs to
   the catalog: it is an identity claim about what a row on the
   catalog page IS. Everything in the builder belongs to a unit
   type: how one kind of stock is held.

   Prototype-only: the mock data, and the fact that Catalog
   Properties and Item Naming are static chips.
   Would become Angular: the unit type row as an @for, the builder
   as a component with a draft model, and Save Changes as a form
   submit.
   ============================================================ */
const INV = window.INVENTORY;
const SOURCE = window.CATALOG_SETTINGS || {};
const backHref = SOURCE.backHref || 'catalog.html';

/* A working copy. Nothing is committed until Save Changes, and
   the builder edits a draft of a draft so Cancel is clean. */
let cfg = JSON.parse(JSON.stringify(SOURCE.config || INV.loadConfig()));

const templates = {
  row:     document.getElementById('unitTypeRowTemplate'),
  confirm: document.getElementById('unitTypeConfirmTemplate'),
  field:   document.getElementById('builderFieldTemplate')
};

const listEl   = document.getElementById('unitTypes');
const saveBtn  = document.getElementById('saveBtn');
const addTypeBtn = document.getElementById('addUnitType');

const dirty = () => { saveBtn.disabled = false; };

/* ── Catalog name ──────────────────────────────────────────
   Edited here, so the back link, the breadcrumb and the browser
   title follow the field as it is typed — a back link offering
   the old name would point at a catalog that no longer answers
   to it. -------------------------------------------------- */
const titleEl = document.getElementById('catalogTitle');

function renderCatalogName() {
  const name = cfg.catalog.trim() || 'this catalog';
  document.getElementById('backLinkName').textContent = name;
  document.getElementById('crumbCatalog').lastChild.textContent = ' ' + name;
  document.title = `${name} — Catalog Settings`;
}

/* Both settings pages carry the same back destination in three
   places — the back link, the breadcrumb and Cancel. */
document.querySelectorAll('[data-back]').forEach(link => { link.href = backHref; });

titleEl.value = cfg.catalog;
titleEl.addEventListener('input', () => {
  cfg.catalog = titleEl.value;
  renderCatalogName();
  dirty();
});

/* ── Single-Unit Items ─────────────────────────────────────── */
const singleRow = document.getElementById('singleUnitRow');
const singleBox = document.getElementById('singleUnitBox');

function renderSingleUnit() {
  const stuck = cfg.unitTypes.length > 1 && !cfg.singleUnit;

  singleBox.checked  = cfg.singleUnit;
  singleBox.disabled = stuck;
  singleRow.classList.toggle('is-stuck', stuck);
  singleRow.title = stuck
    ? 'A catalog with single unit items can only have one unit type.' : '';

  addTypeBtn.disabled = cfg.singleUnit;
  addTypeBtn.title = cfg.singleUnit
    ? 'A single-unit catalog holds exactly one unit type' : '';
}

singleBox.addEventListener('change', () => {
  cfg.singleUnit = singleBox.checked;
  /* Turning it on strips the type's quantity and forces its
     allocation to a user; turning it off gives the quantity back.
     One normalizer decides both. */
  INV.normalizeConfig(cfg);
  render();
  dirty();
});

/* ── Unit type rows ────────────────────────────────────────
   Read-only summaries. Editing and deleting are the hover
   actions at the trailing edge. --------------------------- */
let confirmingId = null;

function measureOf(type) {
  return cfg.singleUnit
    ? 'Single-unit'
    : `${INV.dimension(type.qty.dimension).label} (${type.qty.uom})`;
}

function shapeOf(type) {
  if (cfg.singleUnit) return 'One unit per item — location and allocation only';
  const word = (uom) => INV.UNIT_LABELS[uom] || uom;
  const qty = `QTY ${INV.dimension(type.qty.dimension).label} (${word(type.qty.uom)})`;
  if (!type.fields.length) return qty;
  return qty + ' & ' + type.fields
    .map(f => `${INV.dimension(f.dimension).label} (${word(f.uom)})`).join(' & ');
}

/* A worked example. A field with a default shows its own value, so
   the example is the number a new unit will actually start with. */
const SAMPLE = { length: '64', width: '54', height: '11', count: '35' };

function exampleOf(type) {
  if (cfg.singleUnit) return 'i.e. 1 record at one location';
  const qty = `i.e. ${type.qty.default ?? SAMPLE[type.qty.dimension]} ${type.qty.uom}`;
  if (!type.fields.length) return qty;
  return `${qty} (${type.fields
    .map(f => `${f.default ?? SAMPLE[f.dimension]} ${f.uom}`).join(' × ')})`;
}

function consequenceOf(type) {
  const n = INV.DEFAULT_UNITS.filter(u => u.unitTypeId === type.id).length;
  if (!n) return 'No stock is recorded in this type.';
  return n === 1
    ? 'The 1 unit recorded in this type will be deleted too.'
    : `The ${n} units recorded in this type will be deleted too.`;
}

function render() {
  renderSingleUnit();
  listEl.replaceChildren();

  /* A catalog needs at least one way to hold stock; a single-unit
     catalog needs exactly one, so its only type cannot go either. */
  const last = cfg.unitTypes.length === 1;

  cfg.unitTypes.forEach(type => {
    if (type.id === confirmingId) {
      const row = templates.confirm.content.firstElementChild.cloneNode(true);
      row.querySelector('[data-cell="name"]').textContent = type.name;
      row.querySelector('[data-cell="consequence"]').textContent = consequenceOf(type);
      row.querySelector('[data-confirm-delete]').dataset.confirmDelete = type.id;
      listEl.appendChild(row);
      return;
    }

    const row = templates.row.content.firstElementChild.cloneNode(true);
    row.dataset.row = type.id;
    row.querySelector('[data-cell="name"]').textContent    = type.name;
    row.querySelector('[data-cell="measure"]').textContent = measureOf(type);
    row.querySelector('[data-cell="shape"]').textContent   = shapeOf(type);
    row.querySelector('[data-cell="example"]').textContent = exampleOf(type);

    row.querySelector('[data-cell="icon"]').classList.add(
      cfg.singleUnit ? 'fa-fingerprint'
        : type.qty.dimension === 'count' ? 'fa-ball-pile' : 'fa-ruler-horizontal');

    const allocation = INV.allocationKind(type);
    row.querySelector('[data-cell="alloc"]').textContent = allocation.column;
    row.querySelector('[data-cell="alloc-icon"]').classList.add(
      allocation.key === 'job' ? 'fa-briefcase' : 'fa-user');

    const edit = row.querySelector('[data-edit]');
    edit.dataset.edit = type.id;
    edit.title = `Edit ${type.name}`;

    const del = row.querySelector('[data-delete]');
    del.dataset.delete = type.id;
    del.disabled = last;
    del.title = last ? 'A catalog needs at least one unit type' : `Delete ${type.name}`;

    listEl.appendChild(row);
  });
}

/* ── Builder ───────────────────────────────────────────────
   `draft` is a copy; nothing lands in cfg until Save Unit Type.
   `editingId` is null when adding, so Done appends. ---------- */
const flyout      = document.getElementById('unitFlyout');
const flyoutTitle = document.getElementById('unitFlyoutTitle');
const presetField = document.getElementById('presetField');
const presetPick  = document.getElementById('presetPick');
const nameInput   = document.getElementById('typeName');
const allocGroup  = document.getElementById('allocGroup');
const allocHelp   = document.getElementById('allocHelp');
const allocWarning = document.getElementById('allocWarning');
const measuredHalf = document.getElementById('measuredHalf');
const qtyDimension = document.getElementById('qtyDimension');
const qtyUom       = document.getElementById('qtyUom');
const qtyDefault   = document.getElementById('qtyDefault');
const fieldRows    = document.getElementById('fieldRows');

let draft = null;
let editingId = null;
/* What the type allocated to when the panel opened, so the panel
   can say what changing it costs. */
let allocateWas = null;

/* A dimension can be used once per unit type. A Width beside a
   Width is two columns of the same measurement with nothing to
   tell them apart, and the second one is always a mistake — so it
   is not offered rather than allowed and regretted.

   `chosen` is always offered, or a select could not show its own
   current value. */
function dimensionsInUse(except) {
  const used = draft.fields.map(f => f.dimension);
  if (!cfg.singleUnit) used.push(draft.qty.dimension);
  return used.filter(key => key !== except);
}

function fillDimensions(select, chosen) {
  const taken = dimensionsInUse(chosen);
  select.replaceChildren();
  INV.DIMENSION_KEYS.filter(key => !taken.includes(key)).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = INV.DIMENSIONS[key].label;
    option.selected = key === chosen;
    select.appendChild(option);
  });
}

/* A dimension's UOM list is its own: a Count is only ever counted
   in each, and its select says so rather than offering inches to
   a headcount. */
function fillUoms(select, dimension, chosen) {
  const list = INV.uomsFor(dimension);
  select.replaceChildren();
  list.forEach(uom => {
    const option = document.createElement('option');
    option.value = uom;
    option.textContent = uom === 'ea' ? 'each (ea)' : `${INV.UNIT_LABELS[uom]} (${uom})`;
    option.selected = uom === chosen;
    select.appendChild(option);
  });
  select.disabled = list.length === 1;
}

const addFieldBtn = document.getElementById('addField');

function renderFields() {
  fieldRows.replaceChildren();
  draft.fields.forEach((field, index) => {
    const row = templates.field.content.firstElementChild.cloneNode(true);
    const dimension = row.querySelector('[data-field-dimension]');
    const uom       = row.querySelector('[data-field-uom]');
    const dflt      = row.querySelector('[data-field-default]');

    dimension.dataset.index = index;
    uom.dataset.index = index;
    dflt.dataset.index = index;

    fillDimensions(dimension, field.dimension);
    fillUoms(uom, field.dimension, field.uom);
    dflt.value = field.default ?? '';

    row.querySelector('[data-remove-field]').dataset.removeField = index;
    fieldRows.appendChild(row);
  });

  /* Four dimensions, each usable once — so a type can carry the
     quantity and three fields, and then there is nothing left to
     add. */
  const exhausted = dimensionsInUse(null).length >= INV.DIMENSION_KEYS.length;
  addFieldBtn.disabled = exhausted;
  addFieldBtn.title = exhausted
    ? 'Every dimension is already used by this unit type' : '';
}

/* A job number is not a person's name under another heading, so
   changing what a unit type allocates to cannot reinterpret the
   values it already holds — it releases them. The panel says how
   many before it happens; nothing is released until Save. */
function allocatedUnits() {
  if (!editingId) return [];
  return INV.DEFAULT_UNITS.filter(u => u.unitTypeId === editingId && u.allocation);
}

function renderAllocWarning() {
  const changing = allocateWas && draft.allocateTo !== allocateWas;
  const affected = changing ? allocatedUnits().length : 0;

  allocWarning.hidden = affected === 0;
  allocWarning.textContent = affected === 0 ? '' :
    `Changing this releases ${affected} allocated ${affected === 1 ? 'unit' : 'units'}. ` +
    `A job number is not a person's name, so the values cannot carry over.`;
}

function renderBuilder() {
  const allocation = INV.allocationKind(draft);

  presetField.hidden = !!editingId;
  allocGroup.hidden = cfg.singleUnit;
  measuredHalf.hidden = cfg.singleUnit;

  nameInput.value = draft.name;
  allocHelp.textContent = allocation.help;

  allocGroup.querySelectorAll('[data-alloc]').forEach(btn => {
    const on = btn.dataset.alloc === draft.allocateTo;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-checked', on);
  });

  renderAllocWarning();

  if (!cfg.singleUnit) {
    fillDimensions(qtyDimension, draft.qty.dimension);
    fillUoms(qtyUom, draft.qty.dimension, draft.qty.uom);
    qtyDefault.value = draft.qty.default ?? '';
    renderFields();
  }
}

function blankType() {
  return {
    id: 'ut-' + Date.now().toString(36),
    name: '',
    allocateTo: 'job',
    qty: { dimension: 'count', uom: 'ea', default: null },
    fields: []
  };
}

function openBuilder(id) {
  editingId = id;
  draft = id
    ? JSON.parse(JSON.stringify(cfg.unitTypes.find(t => t.id === id)))
    : blankType();

  if (cfg.singleUnit) draft.allocateTo = 'user';
  else if (draft.allocateTo !== 'user') draft.allocateTo = 'job';
  draft.qty = draft.qty || { dimension: 'count', uom: 'ea', default: null };
  draft.fields = draft.fields || [];
  allocateWas = id ? draft.allocateTo : null;

  if (!id) {
    presetPick.replaceChildren();
    const scratch = document.createElement('option');
    scratch.value = '';
    scratch.textContent = 'Build from scratch';
    presetPick.appendChild(scratch);
    INV.loadPresets().forEach((preset, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = preset.name;
      presetPick.appendChild(option);
    });
  }

  flyoutTitle.textContent = id ? 'Edit Unit Type' : 'Add Unit Type';
  renderBuilder();
  flyout.classList.add('open');
  nameInput.focus();
}

function closeBuilder() {
  flyout.classList.remove('open');
  draft = null;
  editingId = null;
  allocateWas = null;
}

/* Only digits and a single decimal point reach a default. */
function decimals(value) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length
    ? `${whole.slice(0, 5)}.${rest.join('').slice(0, 2)}`
    : whole.slice(0, 5);
}

nameInput.addEventListener('input', () => { draft.name = nameInput.value; });

qtyDefault.addEventListener('input', () => {
  qtyDefault.value = decimals(qtyDefault.value);
  draft.qty.default = qtyDefault.value;
});

qtyDimension.addEventListener('change', () => {
  draft.qty.dimension = qtyDimension.value;
  draft.qty.uom = INV.normalizeUom(qtyDimension.value, draft.qty.uom);
  fillUoms(qtyUom, draft.qty.dimension, draft.qty.uom);
  /* Taking a dimension for the quantity takes it off every field. */
  renderFields();
});

qtyUom.addEventListener('change', () => { draft.qty.uom = qtyUom.value; });

fieldRows.addEventListener('input', (e) => {
  const input = e.target.closest('[data-field-default]');
  if (!input) return;
  input.value = decimals(input.value);
  draft.fields[Number(input.dataset.index)].default = input.value;
});

fieldRows.addEventListener('change', (e) => {
  const dimension = e.target.closest('[data-field-dimension]');
  if (dimension) {
    const field = draft.fields[Number(dimension.dataset.index)];
    field.dimension = dimension.value;
    field.uom = INV.normalizeUom(field.dimension, field.uom);
    /* Every dimension select is redrawn: this one is now taken. */
    renderFields();
    fillDimensions(qtyDimension, draft.qty.dimension);
    return;
  }
  const uom = e.target.closest('[data-field-uom]');
  if (uom) draft.fields[Number(uom.dataset.index)].uom = uom.value;
});

fieldRows.addEventListener('click', (e) => {
  const remove = e.target.closest('[data-remove-field]');
  if (!remove) return;
  draft.fields.splice(Number(remove.dataset.removeField), 1);
  /* The dimension it held is free again. */
  renderFields();
  fillDimensions(qtyDimension, draft.qty.dimension);
});

/* A new field starts on the dimension the type does not already
   carry, so a Width beside a Length takes no edit at all. */
addFieldBtn.addEventListener('click', () => {
  const next = INV.DIMENSION_KEYS.find(key => !dimensionsInUse(null).includes(key));
  if (!next) return;
  draft.fields.push({
    id: 'f-' + Date.now().toString(36) + draft.fields.length,
    dimension: next, uom: INV.DIMENSIONS[next].defaultUom, default: null
  });
  renderFields();
  fillDimensions(qtyDimension, draft.qty.dimension);
  fieldRows.querySelector('.builder-row:last-of-type select')?.focus();
});

allocGroup.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-alloc]');
  if (!btn || cfg.singleUnit || btn.dataset.alloc === draft.allocateTo) return;
  draft.allocateTo = btn.dataset.alloc;
  renderBuilder();
});

/* Starting from a preset replaces the shape, keeping the id —
   this is still the unit type being added, not the preset. */
presetPick.addEventListener('change', () => {
  const preset = INV.loadPresets()[Number(presetPick.value)];
  if (!preset) return;
  const id = draft.id;
  draft = JSON.parse(JSON.stringify(preset));
  draft.id = id;
  draft.qty = draft.qty || { dimension: 'count', uom: 'ea', default: null };
  draft.fields = draft.fields || [];
  if (cfg.singleUnit) draft.allocateTo = 'user';
  renderBuilder();
});

/* A default typed as text is cleaned on the way out. A dimension
   of zero is no default at all. */
function cleanDefault(raw, dimension) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  if (dimension !== 'count' && n === 0) return null;
  return n;
}

document.getElementById('unitFlyoutDone').addEventListener('click', () => {
  if (!draft) return;
  if (!draft.name.trim()) draft.name = cfg.singleUnit ? 'Records' : 'Units';

  if (cfg.singleUnit) {
    draft.allocateTo = 'user';
    draft.qty = null;
    draft.fields = [];
  } else {
    draft.qty.default = cleanDefault(draft.qty.default, draft.qty.dimension);
    draft.fields.forEach(f => { f.default = cleanDefault(f.default, f.dimension); });
  }

  /* Released here rather than on the toggle, so Cancel leaves the
     allocations alone like every other draft change. */
  if (allocateWas && draft.allocateTo !== allocateWas) {
    allocatedUnits().forEach(unit => {
      unit.allocation = null;
      INV.logEvent(unit, 'Allocation removed — unit type changed what it allocates to');
    });
  }

  if (editingId) {
    cfg.unitTypes[cfg.unitTypes.findIndex(t => t.id === editingId)] = draft;
  } else {
    cfg.unitTypes.push(draft);
  }

  /* Every unit type saved is filed as a preset. Building one is
     the expensive step; the next catalog that needs the same shape
     should not repeat it. A preset carries the shape and never the
     catalog's Single-Unit claim. */
  INV.savePreset(draft);

  closeBuilder();
  render();
  dirty();
});

flyout.addEventListener('click', (e) => {
  if (e.target === flyout || e.target.closest('[data-close]')) closeBuilder();
});

/* ── List actions ──────────────────────────────────────────── */
listEl.addEventListener('click', (e) => {
  const edit = e.target.closest('[data-edit]');
  if (edit) { confirmingId = null; render(); openBuilder(edit.dataset.edit); return; }

  const del = e.target.closest('[data-delete]');
  if (del && !del.disabled) { confirmingId = del.dataset.delete; render(); return; }

  if (e.target.closest('[data-cancel-delete]')) { confirmingId = null; render(); return; }

  const confirm = e.target.closest('[data-confirm-delete]');
  if (confirm) {
    cfg.unitTypes = cfg.unitTypes.filter(t => t.id !== confirm.dataset.confirmDelete);
    confirmingId = null;
    render();
    dirty();
    return;
  }

  /* Clicking the row is a shortcut to Edit; the buttons above are
     the keyboard path. */
  const row = e.target.closest('[data-row]');
  if (row) openBuilder(row.dataset.row);
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (flyout.classList.contains('open')) { closeBuilder(); return; }
  if (confirmingId) { confirmingId = null; render(); }
});

addTypeBtn.addEventListener('click', () => openBuilder(null));

/* Chips are static in this prototype; removing one only removes
   the chip. */
document.addEventListener('click', (e) => {
  const x = e.target.closest('.chip-x');
  if (!x) return;
  x.closest('.chip').remove();
  dirty();
});

saveBtn.addEventListener('click', () => {
  /* A single-unit catalog's config is its own object; the measured
     one goes back through the shared config. */
  if (SOURCE.config) Object.assign(SOURCE.config, JSON.parse(JSON.stringify(cfg)));
  else INV.saveConfig(JSON.parse(JSON.stringify(cfg)));
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saved';
  setTimeout(() => { saveBtn.textContent = 'Save Changes'; }, 1600);
});

renderCatalogName();
render();
