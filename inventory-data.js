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
     `allocatable` marks a unit type that can be committed to a
     job. Rolls can; swatches and miscuts cannot, so they carry no
     job number and no allocated/available figures anywhere.
     ------------------------------------------------------------ */
  const DEFAULT_CONFIG = {
    catalog: 'Bookcloth',
    unitTypes: [
      { id: 'ut-rolls',    name: 'Rolls',    measurementType: 'roll',  widthUnit: 'in', lengthUnit: 'yd', allocatable: true },
      { id: 'ut-swatches', name: 'Swatches', measurementType: 'piece', allocatable: false },
      { id: 'ut-miscuts',  name: 'Miscuts',  measurementType: 'sheet', dimensionUnit: 'yd', allocatable: false }
    ]
  };

  /* ── Default item units (Majilite Baby Ostrich — Cobalt Blue) ─
     Rolls total 48 yd, which is the In-House figure the items
     table shows for this item on the Rolls tab. --------------- */
  const DEFAULT_UNITS = [
    /* job: null means unallocated — the row offers an Allocate button. */
    { id: 'u1', unitTypeId: 'ut-rolls',    location: 'WARE-3-1-A3', job: '487712', width: 54, length: 30 },
    { id: 'u2', unitTypeId: 'ut-rolls',    location: 'WARE-3-1-B1', job: null,     width: 54, length: 18 },
    { id: 'u3', unitTypeId: 'ut-swatches', location: 'SWATCH-WALL', count: 24 },
    { id: 'u4', unitTypeId: 'ut-miscuts',  location: 'WARE-3-2-C4', width: 1.5,  height: 2,    count: 3 },
    { id: 'u5', unitTypeId: 'ut-miscuts',  location: 'WARE-3-2-C4', width: 0.75, height: 1.25, count: 6 }
  ];

  /* ── Catalog items ───────────────────────────────────────────
     Stock is held per unit type. Note there is no `available`
     anywhere — it is always derived as inHouse − allocated, so no
     stored number can contradict the other two.
     ------------------------------------------------------------ */
  const ITEMS = [
    { swatch: 1, name: 'Majilite-Majilite-Attache-Copper', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { inHouse: 12 },
      'ut-miscuts': { inHouse: 4 } } },
    { swatch: 231, name: 'Majilite-Majilite-Attache-Silver', qty: {
      'ut-rolls': { onOrder: 80, inHouse: 70, allocated: 80 },
      'ut-swatches': { inHouse: 8 },
      'ut-miscuts': { inHouse: 11 } } },
    { swatch: 54, name: 'Majilite-Majilite-Attache-Gold', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { inHouse: 6 },
      'ut-miscuts': { inHouse: 0 } } },
    { swatch: 4, name: 'Majilite-Majilite-Finesse-Black', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { inHouse: 18 },
      'ut-miscuts': { inHouse: 7 } } },
    { swatch: 80, name: 'Majilite-Majilite-Attache-White', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { inHouse: 9 },
      'ut-miscuts': { inHouse: 2 } } },
    { swatch: 31, name: 'Majilite-Majilite-Attache-Blue', qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { inHouse: 14 },
      'ut-miscuts': { inHouse: 5 } } },
    /* This is the item the item page details — its figures are
       summed from DEFAULT_UNITS below, never typed in. */
    { swatch: 17, name: 'Majilite-Majilite-Baby Ostrich-Cobalt Blue', detailed: true, qty: {
      'ut-rolls': { onOrder: 0, inHouse: null, allocated: 12 },
      'ut-swatches': { inHouse: null },
      'ut-miscuts': { inHouse: null } } }
  ];

  /* ── Storage ────────────────────────────────────────────────── */
  const KEY = 'iqu.config.bookcloth';
  let memory = null;

  function loadConfig() {
    if (memory) return memory;
    try {
      const raw = global.localStorage && global.localStorage.getItem(KEY);
      if (raw) { memory = JSON.parse(raw); return memory; }
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

  function allocatableTypes(cfg) {
    return cfg.unitTypes.filter(t => t.allocatable);
  }

  /* Total stock held in one unit type, in that type's own measure. */
  function totalFor(unitType, units) {
    if (!unitType) return 0;
    const spec = MEASUREMENT_TYPES[unitType.measurementType];
    return units
      .filter(u => u.unitTypeId === unitType.id)
      .reduce((sum, u) => sum + spec.quantityOf(u), 0);
  }

  /* Stock committed to a job — the units carrying a job number. */
  function allocatedFor(unitType, units) {
    if (!unitType || !unitType.allocatable) return 0;
    const spec = MEASUREMENT_TYPES[unitType.measurementType];
    return units
      .filter(u => u.unitTypeId === unitType.id && u.job)
      .reduce((sum, u) => sum + spec.quantityOf(u), 0);
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
     item page can never drift apart.

     Non-allocatable types are children of the parent item — swatches
     and miscuts are cut from a roll, not purchased — so they have no
     On Order, no Allocated and no Available. In-House is all there is. */
  function itemQty(item, unitType) {
    const q = (item.qty && item.qty[unitType.id]) || {};
    const inHouse = q.inHouse === null || q.inHouse === undefined
      ? (item.detailed ? totalFor(unitType, DEFAULT_UNITS) : 0)
      : q.inHouse;
    if (!unitType.allocatable) {
      return { onOrder: null, inHouse, allocated: null, available: null };
    }
    /* For the detailed item, Allocated is the sum of the units that
       carry a job number — so allocating a roll moves the figure. */
    const allocated = item.detailed
      ? allocatedFor(unitType, DEFAULT_UNITS)
      : (q.allocated || 0);
    return { onOrder: q.onOrder || 0, inHouse, allocated, available: inHouse - allocated };
  }

  global.INVENTORY = {
    MEASUREMENT_TYPES, UNIT_OPTIONS, UNIT_LABELS,
    DEFAULT_CONFIG, DEFAULT_UNITS, ITEMS,
    loadConfig, saveConfig, resetConfig,
    unitTypeById, allocatableTypes, totalFor, allocatedFor,
    quantityUnitLabel, itemQty, isValidJob, fmt
  };

})(window);
