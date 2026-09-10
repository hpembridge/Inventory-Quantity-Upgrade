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

/* ── Catalog properties ──────────────────────────────────────
   Add Catalog Property opens its aside: what kind of value the
   property holds, what it is called, and whether an item can be
   saved without it. A saved property is appended to the chip row.
   In Angular the chip row becomes an @for over the catalog's
   properties and the aside becomes a form component. ---------- */
const propertyChips   = document.getElementById('propertyChips');
const propertyFlyout  = document.getElementById('propertyFlyout');
const propertyKind    = document.getElementById('propertyKind');
const propertyKindHelp = document.getElementById('propertyKindHelp');
const propertyName    = document.getElementById('propertyName');
const propertyRequired = document.getElementById('propertyRequired');
const propertyChipTemplate = document.getElementById('propertyChipTemplate');

/* The icon and the one-line explanation that go with each kind. */
const PROPERTY_KIND_INFO = {
  boolean:     { icon: 'fa-toggle-on', help: 'True or false — a switch on the item.' },
  select:      { icon: 'fa-diamond',   help: 'A pick from a list. The list is set up after the property is added.' },
  measurement: { icon: 'fa-ruler-horizontal', help: 'A dimension with a unit of measure.' },
  number:      { icon: 'fa-hashtag',   help: 'A number, typed on the item.' },
  text:        { icon: 'fa-font',      help: 'Free text, typed on the item.' }
};

function renderPropertyKind() {
  propertyKindHelp.textContent = PROPERTY_KIND_INFO[propertyKind.value].help;
}

function openPropertyEditor() {
  propertyKind.value = 'boolean';
  propertyName.value = '';
  propertyRequired.checked = false;
  renderPropertyKind();
  propertyFlyout.classList.add('open');
  propertyName.focus();
}

function closePropertyEditor() {
  propertyFlyout.classList.remove('open');
}

function addPropertyChip(name, kind, required) {
  const chip = propertyChipTemplate.content.firstElementChild.cloneNode(true);
  chip.querySelector('[data-chip-icon]').classList.add(PROPERTY_KIND_INFO[kind].icon);
  chip.querySelector('[data-chip-label]').textContent = name;
  chip.querySelector('[data-chip-required]').hidden = !required;
  propertyChips.appendChild(chip);
}

document.getElementById('addProperty').addEventListener('click', openPropertyEditor);
propertyKind.addEventListener('change', renderPropertyKind);

propertyFlyout.addEventListener('click', (e) => {
  if (e.target === propertyFlyout || e.target.closest('[data-close-property]')) closePropertyEditor();
});

document.getElementById('propertyDone').addEventListener('click', () => {
  const name = propertyName.value.trim();
  if (!name) { propertyName.focus(); return; }
  addPropertyChip(name, propertyKind.value, propertyRequired.checked);
  closePropertyEditor();
  dirty();
});

/* Removing a chip is a prototype nicety — the static chips above
   carry the same button. */
propertyChips.addEventListener('click', (e) => {
  const x = e.target.closest('.chip-x');
  if (!x) return;
  x.closest('.chip').remove();
  dirty();
});

/* ── Single-Unit Items ───────────────────────────────────────
   The switch at the right of the Units label. Turning it on keeps
   the catalog's first unit type and drops the rest — a unique record
   cannot be two different objects — and that one type keeps only a
   name and an allocation. */
const singleBox  = document.getElementById('singleUnitBox');
const unitsHelp  = document.getElementById('unitsHelp');

const UNITS_HELP = unitsHelp.textContent;
const SINGLE_HELP =
  'Every item in this catalog is one unique object at one location. Its unit type ' +
  'takes a name and what a record is committed to — there is no quantity to count ' +
  'and nothing that varies between units.';

function renderSingleUnit() {
  singleBox.checked = cfg.singleUnit;
  unitsHelp.textContent = cfg.singleUnit ? SINGLE_HELP : UNITS_HELP;

  /* One unit type is the whole point of a single-unit catalog, so
     there is nothing to add to. */
  addTypeBtn.disabled = cfg.singleUnit;
  addTypeBtn.title = cfg.singleUnit
    ? 'A single-unit catalog holds exactly one unit type' : '';
}

singleBox.addEventListener('change', () => {
  /* Turning it on keeps the first unit type and drops the rest: a
     unique record cannot be two different objects. That loses work,
     so it goes through the dialog rather than happening on the
     click. Turning it off costs nothing and just happens. */
  if (singleBox.checked && cfg.unitTypes.length > 1) { askSingleUnit(); return; }
  cfg.singleUnit = singleBox.checked;
  INV.normalizeConfig(cfg);
  render();
  dirty();
});

/* ── Unit type rows ────────────────────────────────────────
   Read-only summaries. Editing and deleting are the hover
   actions at the trailing edge. --------------------------- */

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
const allocNone    = document.getElementById('allocNone');
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
    `The two kinds of allocation hold different values, so they cannot carry over.`;
}

function renderBuilder() {
  const allocation = INV.allocationKind(draft);

  presetField.hidden = !!editingId;
  allocGroup.hidden = false;
  /* A unique record has no quantity to count and nothing that varies
     between its units, so the measured half is not offered. */
  measuredHalf.hidden = cfg.singleUnit;
  /* None is a single-unit answer only. */
  allocNone.hidden = !cfg.singleUnit;

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

  if (cfg.singleUnit) {
    if (!['user', 'job', 'none'].includes(draft.allocateTo)) draft.allocateTo = 'user';
  } else if (draft.allocateTo !== 'user') draft.allocateTo = 'job';
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
  if (!btn || btn.dataset.alloc === draft.allocateTo) return;
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
  if (cfg.singleUnit && !['user', 'job', 'none'].includes(draft.allocateTo)) {
    draft.allocateTo = 'user';
  }
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
  if (edit) { openBuilder(edit.dataset.edit); return; }

  const del = e.target.closest('[data-delete]');
  if (del && !del.disabled) { openConfirm(del.dataset.delete); return; }

  /* Clicking the row is a shortcut to Edit; the buttons above are
     the keyboard path. */
  const row = e.target.closest('[data-row]');
  if (row) openBuilder(row.dataset.row);
});

/* ── Destructive confirmation ───────────────────────────────
   One dialog for both things on this page that lose work:
   deleting a unit type, and turning Single-Unit Items on while
   the catalog still has more than one. The caller supplies the
   words and what to do on confirm.
   Angular: a signal for the pending action and the dev team's own
   confirm component. */
const confirmModal = document.getElementById('confirmModal');
let confirmAction = null;

function askConfirm({ title, body, action, confirmLabel }) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmBody').textContent  = body;
  document.getElementById('confirmDelete').textContent = confirmLabel;
  confirmAction = action;
  confirmModal.classList.add('open');
}

function openConfirm(typeId) {
  const type = cfg.unitTypes.find(t => t.id === typeId);
  if (!type) return;
  askConfirm({
    title: `Delete ${type.name}?`,
    body: `${consequenceOf(type)} This cannot be undone.`,
    confirmLabel: 'Delete Unit Type',
    action: () => { cfg.unitTypes = cfg.unitTypes.filter(t => t.id !== type.id); }
  });
}

/* Turning the switch on throws away every unit type but the first,
   so it asks first and names what is going. */
function askSingleUnit() {
  const kept = cfg.unitTypes[0];
  const losing = cfg.unitTypes.slice(1);
  askConfirm({
    title: 'Switch to single-unit items?',
    body: `${losing.map(t => t.name).join(', ')} ` +
      `${losing.length === 1 ? 'will be deleted, along with the stock' : 'will be deleted, along with all stock'} ` +
      `recorded in ${losing.length === 1 ? 'it' : 'them'}. ${kept.name} is kept, and loses its ` +
      `quantity and any additional fields. This cannot be undone.`,
    confirmLabel: 'Switch to Single-Unit',
    action: () => { cfg.singleUnit = true; }
  });
}

function closeConfirm() {
  confirmModal.classList.remove('open');
  confirmAction = null;
  /* The switch is a live control: if the dialog it opened was
     dismissed, put it back the way the catalog actually is. */
  singleBox.checked = cfg.singleUnit;
}

confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal || e.target.closest('[data-close-modal]')) closeConfirm();
});

document.getElementById('confirmDelete').addEventListener('click', () => {
  const action = confirmAction;
  closeConfirm();
  if (!action) return;
  action();
  INV.normalizeConfig(cfg);
  render();
  dirty();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (flyout.classList.contains('open')) { closeBuilder(); return; }
  if (propertyFlyout.classList.contains('open')) { closePropertyEditor(); return; }
  if (confirmModal.classList.contains('open')) closeConfirm();
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
