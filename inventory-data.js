/* ============================================================
   Inventory Quantity Upgrade — shared prototype data layer
   ------------------------------------------------------------
   Holds the catalog's unit-type configuration, the catalog's
   items, and the sample item's units, so Catalog Settings, the
   items table and the item page all read from one source.
   Persisted to localStorage when available; falls back to memory.
   ============================================================ */
(function (global) {

  /* ── Measurement types ───────────────────────────────────────
     A measurement type is the *shape* of a unit: which fields it
     carries and which of them counts as stock. A unit type is a
     named instance of one (e.g. "Miscuts" is a sheet).
     ------------------------------------------------------------ */
  const MEASUREMENT_TYPES = {
    roll: {
      key: 'roll',
      label: 'Roll',
      defaultName: 'Rolls',
      // W is the roll width, H is the length wound on the roll.
      // They take separate units — 54 in wide, 50 yd long.
      fields: ['width', 'length'],
      // Stock is the total length, not a headcount of rolls.
      quantityOf: (u) => u.length || 0,
      quantityUnitKey: 'lengthUnit'
    },
    piece: {
      key: 'piece',
      label: 'Piece',
      defaultName: 'Pieces',
      fields: ['count'],
      quantityOf: (u) => u.count || 0,
      quantityUnitKey: null
    },
    sheet: {
      key: 'sheet',
      label: 'Sheet',
      defaultName: 'Sheets',
      // W × H describes the sheet; the count is the stock.
      fields: ['width', 'height', 'count'],
      quantityOf: (u) => u.count || 0,
      quantityUnitKey: null
    }
  };

  /* Icon per measurement type, so every surface labels a shape the
     same way (settings list, item card header). */
  const MEASUREMENT_ICONS = {
    roll:  'fa-tape',
    piece: 'fa-ball-pile',
    sheet: 'fa-layer-group'
  };

  function measurementIcon(key) { return MEASUREMENT_ICONS[key] || 'fa-cube'; }

  const UNIT_OPTIONS = ['in', 'ft', 'yd', 'mm', 'cm', 'm'];

  const UNIT_LABELS = {
    in: 'inches', ft: 'feet', yd: 'yards',
    mm: 'millimeters', cm: 'centimeters', m: 'meters'
  };

  function fmt(n) {
    if (n === null || n === undefined || n === '') return '—';
    return Number(n) % 1 === 0 ? String(Number(n)) : String(Number(n).toFixed(2));
  }

  /* ── Default catalog config (Bookcloth) ──────────────────────
     Every unit type can be committed to a job, so each one carries a
     job number and reports On Order, Allocated and Available. A unit
     type differs from another only in its measurement type.
     ------------------------------------------------------------ */
  const DEFAULT_CONFIG = {
    catalog: 'Bookcloth',
    unitTypes: [
      /* defaults: the measurements a newly added unit of this type
         starts with. Most rolls of a bookcloth come 54 inches wide, so
         that is worth not retyping. A field with no default starts
         empty; Job Number and Location never have one. */
      { id: 'ut-rolls',    name: 'Rolls',    measurementType: 'roll',  widthUnit: 'in', lengthUnit: 'yd',
        defaults: { width: 54 } },
      { id: 'ut-swatches', name: 'Swatches', measurementType: 'piece' },
      { id: 'ut-miscuts',  name: 'Miscuts',  measurementType: 'sheet', widthUnit: 'yd', heightUnit: 'yd' }
    ]
  };

  /* ── Default item units (Majilite Baby Ostrich — Cobalt Blue) ─
     Rolls total 48 yd, which is the In-House figure the items
     table shows for this item on the Rolls tab. --------------- */
  const DEFAULT_UNITS = [
    /* job: null means unallocated — the row offers an Allocate button. */
    { id: 'u1', unitTypeId: 'ut-rolls',    location: 'WARE-3-1-A3', job: '487712', width: 54, length: 30 },
    { id: 'u2', unitTypeId: 'ut-rolls',    location: 'WARE-3-1-B1', job: null,     width: 54, length: 18 },
    { id: 'u3', unitTypeId: 'ut-swatches', location: 'SWATCH-WALL', job: null,     count: 24 },
    { id: 'u4', unitTypeId: 'ut-miscuts',  location: 'WARE-3-2-C4', job: '487712', width: 1.5,  height: 2,    count: 3 },
    { id: 'u5', unitTypeId: 'ut-miscuts',  location: 'WARE-3-2-C4', job: null,     width: 0.75, height: 1.25, count: 6 }
  ];

  /* ── Catalog items ───────────────────────────────────────────
     Stock is held per unit type. Note there is no `available`
     anywhere — it is always derived as inHouse − allocated, so no
     stored number can contradict the other two.
     ------------------------------------------------------------ */
  const ITEMS = [
    { swatch: 1, name: 'Majilite-Majilite-Attache-Copper', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { onOrder: 0, inHouse: 12, allocated: 4 },
      'ut-miscuts': { onOrder: 0, inHouse: 4, allocated: 1 } } },
    { swatch: 231, name: 'Majilite-Majilite-Attache-Silver', qty: {
      'ut-rolls': { onOrder: 80, inHouse: 70, allocated: 80 },
      'ut-swatches': { onOrder: 0, inHouse: 8, allocated: 2 },
      'ut-miscuts': { onOrder: 0, inHouse: 11, allocated: 3 } } },
    /* Deliberately low on rolls, so the warning state has an example. */
    { swatch: 54, name: 'Majilite-Majilite-Attache-Gold', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 60 },
      'ut-swatches': { onOrder: 0, inHouse: 6, allocated: 2 },
      'ut-miscuts': { onOrder: 0, inHouse: 0, allocated: 0 } } },
    { swatch: 4, name: 'Majilite-Majilite-Finesse-Black', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { onOrder: 0, inHouse: 18, allocated: 6 },
      'ut-miscuts': { onOrder: 0, inHouse: 7, allocated: 2 } } },
    { swatch: 80, name: 'Majilite-Majilite-Attache-White', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { onOrder: 0, inHouse: 9, allocated: 3 },
      'ut-miscuts': { onOrder: 0, inHouse: 2, allocated: 0 } } },
    { swatch: 31, name: 'Majilite-Majilite-Attache-Blue', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { onOrder: 0, inHouse: 14, allocated: 4 },
      'ut-miscuts': { onOrder: 0, inHouse: 5, allocated: 1 } } },
    /* This is the item the item page details — its figures are
       summed from DEFAULT_UNITS below, never typed in. */
    { swatch: 17, name: 'Majilite-Majilite-Baby Ostrich-Cobalt Blue', detailed: true, qty: {
      'ut-rolls': { onOrder: 0, inHouse: null, allocated: 12 },
      'ut-swatches': { onOrder: 0, inHouse: null, allocated: 0 },
      'ut-miscuts': { onOrder: 0, inHouse: null, allocated: 0 } } }
  ];

  /* ── Libraries ───────────────────────────────────────────────
     A library is a collection of catalogs. Every library exists for the
     whole company; what differs per person is which ones they keep in
     their view. Bindery only needs its own, a designer might swap
     between several, and nobody outside IT needs the IT library — but
     anyone can pull one in when they occasionally need it.
     ------------------------------------------------------------ */
  /* stockForms: the ways stock is held in this library. A catalog's
     unit types can only take one of these forms, so a library of
     laptops is never offered "roll". Every library has at least one. */
  const LIBRARIES = [
    { id: 'lib-materials', name: 'Materials', stockForms: ['roll', 'piece', 'sheet'], catalogs: [
      { name: 'Bookcloth', items: 793 }, { name: 'Endsheet', items: 412 }, { name: 'Board', items: 168 } ] },
    { id: 'lib-it', name: 'IT Library', stockForms: ['piece'], catalogs: [
      { name: 'Laptops', items: 84 }, { name: 'Monitors', items: 121 }, { name: 'Peripherals', items: 342 } ] },
    { id: 'lib-bindery', name: 'Bindery Supplies', stockForms: ['roll', 'piece'], catalogs: [
      { name: 'Adhesives', items: 56 }, { name: 'Head & Tail Bands', items: 210 }, { name: 'Ribbon', items: 178 } ] },
    { id: 'lib-shipping', name: 'Shipping & Packaging', stockForms: ['piece', 'sheet'], catalogs: [
      { name: 'Cartons', items: 96 }, { name: 'Void Fill', items: 24 } ] },
    { id: 'lib-sample', name: 'Sample Room', stockForms: ['piece'], catalogs: [
      { name: 'Swatch Books', items: 431 }, { name: 'Dummies', items: 88 } ] },
    { id: 'lib-foil', name: 'Foils & Films', stockForms: ['roll', 'sheet'], catalogs: [
      { name: 'Hot Foil', items: 143 }, { name: 'Lamination', items: 67 } ] }
  ];

  /* ── Library edits ───────────────────────────────────────────
     A library's name and stock forms are settings, not view state, so
     they outlive the page — the catalog settings page reads the forms
     to decide what a unit type may be. Only what can be edited is
     stored; the catalogs stay in the seed data.
     ------------------------------------------------------------ */
  const LIB_KEY = 'iqu.libraries';

  function saveLibraries() {
    try {
      const slim = {};
      LIBRARIES.forEach(l => { slim[l.id] = { name: l.name, stockForms: l.stockForms }; });
      global.localStorage.setItem(LIB_KEY, JSON.stringify(slim));
    } catch (e) { /* file:// or blocked storage — the edit stays in memory */ }
  }

  (function loadLibraries() {
    try {
      const raw = global.localStorage && global.localStorage.getItem(LIB_KEY);
      if (!raw) return;
      const slim = JSON.parse(raw);
      LIBRARIES.forEach(l => {
        const saved = slim[l.id];
        if (!saved) return;
        if (saved.name) l.name = saved.name;
        if (Array.isArray(saved.stockForms) && saved.stockForms.length) l.stockForms = saved.stockForms;
      });
    } catch (e) { /* fall through to the seed data */ }
  })();

  function libraryById(id) { return LIBRARIES.find(l => l.id === id) || null; }

  /* Which library a catalog sits in — the catalog settings page needs
     it to know which stock forms it may offer. */
  function libraryOfCatalog(name) {
    return LIBRARIES.find(l => l.catalogs.some(c => c.name === name)) || null;
  }

  /* The forms a library allows, falling back to all of them so a
     library saved before this setting existed is not left empty. */
  function stockFormsOf(lib) {
    const keys = Object.keys(MEASUREMENT_TYPES);
    const forms = (lib && lib.stockForms || []).filter(k => keys.includes(k));
    return forms.length ? forms : keys;
  }

  /* ── Per-person library view ──────────────────────────────────
     Which libraries this person keeps as tabs, in the order they added
     them. Dismissing one only changes this list — the library itself is
     untouched and anyone can add it back.
     ------------------------------------------------------------ */
  const VIEW_KEY = 'iqu.libraryview';
  const DEFAULT_VIEW = ['lib-materials', 'lib-it'];
  let viewMemory = null;

  function loadLibraryView() {
    if (viewMemory) return viewMemory;
    try {
      const raw = global.localStorage && global.localStorage.getItem(VIEW_KEY);
      if (raw) {
        /* Drop ids for libraries that no longer exist. */
        const ids = JSON.parse(raw).filter(libraryById);
        if (ids.length) { viewMemory = ids; return viewMemory; }
      }
    } catch (e) { /* file:// or blocked storage — fall through */ }
    viewMemory = DEFAULT_VIEW.slice();
    return viewMemory;
  }

  function saveLibraryView(ids) {
    viewMemory = ids;
    try { global.localStorage && global.localStorage.setItem(VIEW_KEY, JSON.stringify(ids)); }
    catch (e) { /* memory-only for this session */ }
    return ids;
  }

  /* ── Storage ────────────────────────────────────────────────── */
  const KEY = 'iqu.config.bookcloth';
  let memory = null;

  /* A sheet type used to carry a single `dimensionUnit`; it now takes a
     width and a height unit separately. Upgrade a config saved before
     that change rather than letting it render blank units. */
  function migrate(cfg) {
    (cfg.unitTypes || []).forEach(t => {
      if (t.measurementType !== 'sheet') return;
      if (t.dimensionUnit) {
        t.widthUnit  = t.widthUnit  || t.dimensionUnit;
        t.heightUnit = t.heightUnit || t.dimensionUnit;
        delete t.dimensionUnit;
      }
      t.widthUnit  = t.widthUnit  || 'yd';
      t.heightUnit = t.heightUnit || 'yd';
    });
    return cfg;
  }

  function loadConfig() {
    if (memory) return memory;
    try {
      const raw = global.localStorage && global.localStorage.getItem(KEY);
      if (raw) { memory = migrate(JSON.parse(raw)); return memory; }
    } catch (e) { /* file:// or blocked storage — fall through */ }
    memory = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    return memory;
  }

  function saveConfig(cfg) {
    memory = cfg;
    try {
      global.localStorage && global.localStorage.setItem(KEY, JSON.stringify(cfg));
    } catch (e) { /* memory-only for this session */ }
    return cfg;
  }

  function resetConfig() {
    memory = null;
    try { global.localStorage && global.localStorage.removeItem(KEY); } catch (e) {}
    return loadConfig();
  }

  /* ── Derived helpers ────────────────────────────────────────── */

  function unitTypeById(cfg, id) {
    return cfg.unitTypes.find(t => t.id === id) || null;
  }

  /* Total stock held in one unit type, in that type's own measure. */
  /* ── What counts as on hand ───────────────────────────────────
     A unit with no location has not been put away yet: the stock is
     recorded but not findable, so it reads as On Order rather than
     In-House. Giving it a location is what brings it into stock.
     ------------------------------------------------------------ */
  function isPlaced(u) {
    return !!(u.location && String(u.location).trim());
  }

  function sumOf(unitType, units, keep) {
    if (!unitType) return 0;
    const spec = MEASUREMENT_TYPES[unitType.measurementType];
    return units
      .filter(u => u.unitTypeId === unitType.id && keep(u))
      .reduce((sum, u) => sum + spec.quantityOf(u), 0);
  }

  /* Stock in hand: the units that have somewhere to be. */
  function totalFor(unitType, units) {
    return sumOf(unitType, units, isPlaced);
  }

  /* Stock recorded but not yet placed — on its way in. */
  function onOrderFor(unitType, units) {
    return sumOf(unitType, units, u => !isPlaced(u));
  }

  /* Stock committed to a job — the units carrying a job number. Only
     what is in hand can be allocated against; an unplaced unit is
     counted once, as On Order, so that Available never goes negative
     over stock that has not arrived. */
  function allocatedFor(unitType, units) {
    return sumOf(unitType, units, u => u.job && isPlaced(u));
  }

  /* ── Stock state ─────────────────────────────────────────────
     Colour on the rollup means one thing: whether this item's stock
     needs attention. Oversold is unambiguous. "Low" is a placeholder
     ratio — in the real tool this should be a reorder point set per
     catalog or per unit type, not a hard-coded fraction.
     ------------------------------------------------------------ */
  const LOW_STOCK_RATIO = 0.2;

  function stockState(q) {
    if (q.available < 0) return 'over';
    if (q.inHouse > 0 && q.available <= q.inHouse * LOW_STOCK_RATIO) return 'low';
    return 'ok';
  }

  /* Job numbers are six digits, no exceptions. */
  const JOB_PATTERN = /^\d{6}$/;
  function isValidJob(v) { return JOB_PATTERN.test(String(v || '').trim()); }

  /* The label that follows a quantity — "yd" for rolls, "ea" for a
     piece or sheet type. */
  function quantityUnitLabel(unitType) {
    if (!unitType) return '';
    const spec = MEASUREMENT_TYPES[unitType.measurementType];
    if (!spec.quantityUnitKey) return 'ea';
    return unitType[spec.quantityUnitKey] || '';
  }

  /* An item's figures for one unit type. The detailed item's
     In-House is summed from its real units so the table and the
     item page can never drift apart. */
  function itemQty(item, unitType) {
    const q = (item.qty && item.qty[unitType.id]) || {};
    const inHouse = q.inHouse === null || q.inHouse === undefined
      ? (item.detailed ? totalFor(unitType, DEFAULT_UNITS) : 0)
      : q.inHouse;
    /* For the detailed item, Allocated is the sum of the units that
       carry a job number — so allocating a roll moves the figure — and
       On Order is the stock recorded without a location yet. */
    const allocated = item.detailed
      ? allocatedFor(unitType, DEFAULT_UNITS)
      : (q.allocated || 0);
    const onOrder = item.detailed
      ? onOrderFor(unitType, DEFAULT_UNITS)
      : (q.onOrder || 0);
    return { onOrder, inHouse, allocated, available: inHouse - allocated };
  }

  global.INVENTORY = {
    MEASUREMENT_TYPES, MEASUREMENT_ICONS, measurementIcon, UNIT_OPTIONS, UNIT_LABELS,
    DEFAULT_CONFIG, DEFAULT_UNITS, ITEMS,
    LIBRARIES, libraryById, libraryOfCatalog, stockFormsOf, saveLibraries, loadLibraryView, saveLibraryView,
    loadConfig, saveConfig, resetConfig,
    unitTypeById, totalFor, allocatedFor, onOrderFor, isPlaced,
    quantityUnitLabel, itemQty, stockState, LOW_STOCK_RATIO, isValidJob, fmt
  };

})(window);
