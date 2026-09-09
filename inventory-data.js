/* ============================================================
   Mock data
   ------------------------------------------------------------
   This is NOT a data layer, an API client or a state manager. It
   is the prototype's sample content — catalogs, unit types, items,
   units, libraries — plus a handful of pure functions that derive
   figures from it (itemQty, catalogQty, stockState).

   None of it is intended for the real tool. It exists so the pages
   have something to render and so the same numbers appear on every
   page. Everything is in memory and reloads from the seed on every
   page load; nothing is persisted.

   For handoff:
     - The DATA is the shapes here: a catalog, a unit type, a unit,
       an item, a library. Those shapes ARE the proposal.
     - The FUNCTIONS are arithmetic the real tool will do on the
       server. itemQty / catalogQty / stockState are the four
       figures and when they turn amber or red.
     - The load and save functions are named for the pages that call
       them; they read and write these arrays in memory, nothing more.
   ============================================================ */
(function (global) {

  /* ── Dimensions ──────────────────────────────────────────────
     A controlled list, deliberately short. Free text here would
     make two catalogs incomparable — "Width" in one and "width"
     in another are two columns that should have been one.
     ------------------------------------------------------------ */
  const LINEAR = ['in', 'ft', 'yd', 'mm', 'cm', 'm'];

  const DIMENSIONS = {
    length: { key: 'length', label: 'Length', uoms: LINEAR, defaultUom: 'yd' },
    width:  { key: 'width',  label: 'Width',  uoms: LINEAR, defaultUom: 'in' },
    height: { key: 'height', label: 'Height', uoms: LINEAR, defaultUom: 'in' },
    count:  { key: 'count',  label: 'Count',  uoms: ['ea'], defaultUom: 'ea' }
  };

  const DIMENSION_KEYS = Object.keys(DIMENSIONS);

  const UNIT_LABELS = {
    in: 'inches', ft: 'feet', yd: 'yards',
    mm: 'millimeters', cm: 'centimeters', m: 'meters', ea: 'each'
  };

  function dimension(key) { return DIMENSIONS[key] || DIMENSIONS.count; }
  function uomsFor(key)   { return dimension(key).uoms; }

  /* A UOM only belongs to a dimension if that dimension offers it —
     switching a field from Width to Count has to take 'in' away. */
  function normalizeUom(dimKey, uom) {
    const d = dimension(dimKey);
    return d.uoms.includes(uom) ? uom : d.defaultUom;
  }

  function fmt(n) {
    if (n === null || n === undefined || n === '') return '—';
    return Number(n) % 1 === 0 ? String(Number(n)) : String(Number(n).toFixed(2));
  }

  /* ── Default catalog config (Bookcloth) ──────────────────────
     Three unit types, all built from the same two parts: a quantity
     dimension, and the fields that vary between units of one item.
     ------------------------------------------------------------ */
  /* singleUnit: every item in this catalog IS one physical object — a
     die, a press plate. It is an identity claim about what a row on the
     catalog page is, not a claim about how one kind of stock is held,
     which is why it belongs to the catalog and not to a unit type. An
     item cannot be one die and also hold 48 yards of itself, so a
     single-unit catalog has exactly one unit type, no item page, and
     its rollup on the catalog.

     It used to be a unit type setting. The prototype's own seed data
     disproved that: "Sample Boards" was a single-unit type inside
     Bookcloth, and claimed the cloth had no item page while the cloth
     plainly had one. What that type actually needed was a quantity
     counted in each with a default of 1 — no new concept at all, which
     is why the unit type flag is gone rather than moved.

     allocateTo: what stock of this unit type is committed to — a job or
     a user, one or the other for the whole type. It belongs to the unit
     type rather than to the unit: rolls go out on jobs, sample boards go
     out to people, and both can live in the same catalog. Per-unit it
     would put a question on every row that only ever has one answer, and
     let two rows in the same table mean different things by the same
     column.

     A single-unit type is always 'user'. A unique record is a thing
     somebody has — a die on a press, a board off the wall — and the
     question a table of them has to answer is who has it. A job number
     cannot answer that, so the choice is not offered. */
  const DEFAULT_CONFIG = {
    catalog: 'Bookcloth',
    singleUnit: false,
    unitTypes: [
      /* A roll: stock is the length wound on it, and the width is the
         thing that varies from roll to roll of the same cloth. */
      { id: 'ut-rolls', name: 'Rolls', allocateTo: 'job',
        qty: { dimension: 'length', uom: 'yd', default: null },
        fields: [ { id: 'f-rw', dimension: 'width', uom: 'in', default: 54 } ] },

      /* A swatch: nothing varies, so there is nothing but a count. */
      { id: 'ut-swatches', name: 'Swatches', allocateTo: 'user',
        qty: { dimension: 'count', uom: 'ea', default: null },
        fields: [] },

      /* A miscut: counted in pieces, but each stack is its own size. */
      { id: 'ut-miscuts', name: 'Miscuts', allocateTo: 'job',
        qty: { dimension: 'count', uom: 'ea', default: null },
        fields: [ { id: 'f-mw', dimension: 'width',  uom: 'yd', default: null },
                  { id: 'f-mh', dimension: 'height', uom: 'yd', default: null } ] },

      /* A mounted sample board: exactly one per cloth, on a wall or in
         someone's hands. It needs no special shape — a count of each
         with a default of 1. In-house 1, allocated 1 when it is off the
         wall, available 0. Stock that is never consumed needs no
         special shape: it is a count that does not go down. */
      { id: 'ut-boards', name: 'Sample Boards', allocateTo: 'user',
        qty: { dimension: 'count', uom: 'ea', default: 1 }, fields: [] }
    ]
  };

  /* ── Global unit type presets ────────────────────────────────
     A unit type is built on the catalog that needs it, but nobody
     wants to rebuild "Rolls" in every cloth catalog. Saving one
     files it as a preset the next catalog can start from. A preset
     is a shape, not a link — adopting it copies, so editing the
     copy never reaches back into the catalog it came from.
     ------------------------------------------------------------ */
  const SEED_PRESETS = [
    { name: 'Rolls',    allocateTo: 'job',
      qty: { dimension: 'length', uom: 'yd', default: null },
      fields: [ { id: 'p-rw', dimension: 'width', uom: 'in', default: null } ] },
    { name: 'Sheets',   allocateTo: 'job',
      qty: { dimension: 'count', uom: 'ea', default: null },
      fields: [ { id: 'p-sw', dimension: 'width',  uom: 'in', default: null },
                { id: 'p-sh', dimension: 'height', uom: 'in', default: null } ] },
    { name: 'Pieces',   allocateTo: 'job',
      qty: { dimension: 'count', uom: 'ea', default: null }, fields: [] },
    { name: 'Assets',   allocateTo: 'user',
      qty: { dimension: 'count', uom: 'ea', default: null }, fields: [] },
    { name: 'Unique Assets', allocateTo: 'user',
      qty: { dimension: 'count', uom: 'ea', default: 1 }, fields: [] }
  ];

  let presetMemory = null;

  function loadPresets() {
    if (presetMemory) return presetMemory;
    presetMemory = JSON.parse(JSON.stringify(SEED_PRESETS));
    return presetMemory;
  }

  /* Saving a unit type files its shape by name — a second save of
     the same name updates the preset rather than stacking a
     near-duplicate beside it. */
  function savePreset(unitType) {
    const list = loadPresets();
    const shape = {
      name: unitType.name,
      allocateTo: unitType.allocateTo === 'user' ? 'user' : 'job',
      qty: unitType.qty ? JSON.parse(JSON.stringify(unitType.qty)) : null,
      fields: JSON.parse(JSON.stringify(unitType.fields || []))
    };
    const i = list.findIndex(p => p.name.toLowerCase() === shape.name.toLowerCase());
    if (i >= 0) list[i] = shape; else list.push(shape);
    return list;
  }

  /* ── Default item units (Majilite Baby Ostrich — Cobalt Blue) ─
     Rolls total 48 yd in-house, which is the figure the items table
     shows for this item on the Rolls tab.

     allocation: null, or { kind, value }. The kind is the unit type's
     — `unitType.allocateTo` — not the unit's, so every row in one
     table means the same thing by the Allocated to column.
     ------------------------------------------------------------ */
  const DEFAULT_UNITS = [
    { id: 'u1', unitTypeId: 'ut-rolls', location: 'WARE-3-1-A3',
      allocation: { kind: 'job', value: '487712' }, qty: 30, values: { 'f-rw': 54 },
      history: [
        { at: '8/16/26', text: '84 yds ordered' },
        { at: '8/26/26', text: 'Scanned to WARE-3-1-A3' },
        { at: '8/26/26', text: 'Allocated to job 487712' },
        { at: '9/1/26',  text: 'QTY 54 yds entered' },
        { at: '9/10/26', text: 'QTY 30 yds entered' }
      ] },
    { id: 'u2', unitTypeId: 'ut-rolls', location: 'WARE-3-1-B1',
      allocation: null, qty: 18, values: { 'f-rw': 54 },
      history: [
        { at: '8/16/26', text: '84 yds ordered' },
        { at: '8/26/26', text: 'Scanned to WARE-3-1-B1' },
        { at: '9/16/26', text: 'QTY 18 yds entered' }
      ] },
    { id: 'u3', unitTypeId: 'ut-swatches', location: 'SWATCH-WALL',
      allocation: null, qty: 24, values: {},
      history: [ { at: '7/2/26', text: 'Scanned to SWATCH-WALL' },
                 { at: '7/2/26', text: 'QTY 24 ea entered' } ] },
    { id: 'u4', unitTypeId: 'ut-miscuts', location: 'WARE-3-2-C4',
      allocation: { kind: 'job', value: '491204' }, qty: 3,
      values: { 'f-mw': 1.5, 'f-mh': 2 },
      history: [ { at: '8/30/26', text: 'Scanned to WARE-3-2-C4' },
                 { at: '8/30/26', text: 'QTY 3 ea entered' },
                 { at: '9/3/26',  text: 'Allocated to job 491204' } ] },
    { id: 'u5', unitTypeId: 'ut-miscuts', location: 'WARE-3-2-C4',
      allocation: null, qty: 6, values: { 'f-mw': 0.75, 'f-mh': 1.25 },
      history: [ { at: '8/30/26', text: 'Scanned to WARE-3-2-C4' },
                 { at: '8/30/26', text: 'QTY 6 ea entered' } ] },
    /* One mounted board, currently off the wall with a designer. An
       ordinary counted unit — this is what used to need its own stock
       form. */
    { id: 'u6', unitTypeId: 'ut-boards', location: 'SAMPLE-WALL-B3',
      allocation: { kind: 'user', value: 'L. Hagen' }, qty: 1, values: {},
      history: [ { at: '6/14/26', text: 'Scanned to SAMPLE-WALL-B3' },
                 { at: '6/14/26', text: 'QTY 1 ea entered' },
                 { at: '9/2/26',  text: 'Allocated to L. Hagen' } ] }
  ];

  /* ── Catalog properties ──────────────────────────────────────
     What an item of this catalog records about itself, as opposed to
     what its units record. A property varies between ITEMS — one cloth
     is Cobalt Blue and another is Copper — where an added field on a
     unit type varies between the units of ONE item.

     They are declared here rather than written into the item page's
     markup so that the chips, the aside that edits them and the name
     the item is generated under all read the same list. A chip that
     said something the editor could not change would be a bug waiting
     to happen.
     ------------------------------------------------------------ */
  const PROPERTY_KINDS = {
    text:     { key: 'text' },
    select:   { key: 'select' },
    number:   { key: 'number' },
    boolean:  { key: 'boolean' },
    location: { key: 'location' }
  };

  const CATALOG_PROPERTIES = [
    { id: 'p-vendor', label: 'Vendor', icon: 'fa-user', kind: 'select',
      options: ['Majilite', 'Ecological Fibers', 'Winter & Company', 'Arrestox', 'Rainbow'] },
    { id: 'p-location', label: 'Default Location', icon: 'fa-location-arrow', kind: 'location' },
    { id: 'p-line',   label: 'Product Line', icon: 'fa-sitemap',     kind: 'text' },
    { id: 'p-family', label: 'Family',       icon: 'fa-layer-group', kind: 'text' },
    { id: 'p-color',  label: 'Color',        icon: 'fa-palette',     kind: 'text' },
    { id: 'p-decor',  label: 'Decoration',   icon: 'fa-diamond',     kind: 'text' },
    { id: 'p-cruise', label: 'Cruise Line',  icon: 'fa-toggle-on',   kind: 'boolean' },
    { id: 'p-house',  label: 'House / Stocking', icon: 'fa-toggle-on', kind: 'boolean' },
    { id: 'p-swatch', label: 'Swatch Number', icon: 'fa-hashtag',    kind: 'number' }
  ];

  /* A catalog's properties are its own. Bookcloth's are the default
     because it is the catalog most of these pages are about; a page for
     another catalog passes its own list in. */
  function propertyById(id, props) {
    return (props || CATALOG_PROPERTIES).find(p => p.id === id) || null;
  }

  /* The template item names are built from, in order. Catalog Settings
     edits this; the item page reads it, so renaming a property's value
     renames the item on save rather than leaving the two disagreeing. */
  const NAMING_TEMPLATE = ['p-vendor', 'p-line', 'p-family', 'p-color'];

  function itemName(item, template) {
    const parts = (template || NAMING_TEMPLATE)
      .map(id => (item.props || {})[id])
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    return parts.join('-') || 'Untitled item';
  }

  /* ── Catalog items ───────────────────────────────────────────
     Stock is held per unit type. There is no `available` anywhere —
     it is always derived as inHouse − allocated, so no stored number
     can contradict the other two.
     ------------------------------------------------------------ */
  const ITEMS = [
    { swatch: 1, name: 'Majilite-Majilite-Attache-Copper', single: { location: 'SAMPLE-WALL-A1', allocations: [] }, qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { onOrder: 0, inHouse: 12, allocated: 4 },
      'ut-miscuts': { onOrder: 0, inHouse: 4, allocated: 1 },
      'ut-boards': { onOrder: 0, inHouse: 1, allocated: 0 } } },
    { swatch: 231, name: 'Majilite-Majilite-Attache-Silver', single: { location: 'SAMPLE-WALL-A2', allocations: [{ kind: 'user', value: 'L. Hagen' }] }, qty: {
      'ut-rolls': { onOrder: 80, inHouse: 70, allocated: 80 },
      'ut-swatches': { onOrder: 0, inHouse: 8, allocated: 2 },
      'ut-miscuts': { onOrder: 0, inHouse: 11, allocated: 3 },
      'ut-boards': { onOrder: 0, inHouse: 1, allocated: 0 } } },
    /* Deliberately low on rolls, so the warning state has an example. */
    { swatch: 54, name: 'Majilite-Majilite-Attache-Gold', single: { location: 'SAMPLE-WALL-A3', allocations: [] }, qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 60 },
      'ut-swatches': { onOrder: 0, inHouse: 6, allocated: 2 },
      'ut-miscuts': { onOrder: 0, inHouse: 0, allocated: 0 },
      'ut-boards': { onOrder: 0, inHouse: 1, allocated: 0 } } },
    { swatch: 4, name: 'Majilite-Majilite-Finesse-Black', single: { location: null, allocations: [] }, qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { onOrder: 0, inHouse: 18, allocated: 6 },
      'ut-miscuts': { onOrder: 0, inHouse: 7, allocated: 2 },
      'ut-boards': { onOrder: 0, inHouse: 1, allocated: 0 } } },
    { swatch: 80, name: 'Majilite-Majilite-Attache-White', single: { location: 'SAMPLE-WALL-B1', allocations: [{ kind: 'user', value: 'T. Okafor' }, { kind: 'user', value: 'M. Diaz' }] }, qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { onOrder: 0, inHouse: 9, allocated: 3 },
      'ut-miscuts': { onOrder: 0, inHouse: 2, allocated: 0 },
      'ut-boards': { onOrder: 0, inHouse: 1, allocated: 0 } } },
    { swatch: 31, name: 'Majilite-Majilite-Attache-Blue', single: { location: 'SAMPLE-WALL-B2', allocations: [] }, qty: {
      'ut-rolls': { onOrder: 10, inHouse: 70, allocated: 30 },
      'ut-swatches': { onOrder: 0, inHouse: 14, allocated: 4 },
      'ut-miscuts': { onOrder: 0, inHouse: 5, allocated: 1 },
      'ut-boards': { onOrder: 0, inHouse: 1, allocated: 0 } } },
    /* This is the item the item page details — its figures are
       summed from DEFAULT_UNITS, never typed in. */
    { swatch: 17, name: 'Majilite-Majilite-Baby Ostrich-Cobalt Blue', detailed: true,
      props: {
        'p-vendor': 'Majilite', 'p-location': 'WARE-3-1', 'p-line': 'Majilite',
        'p-family': 'Baby Ostrich', 'p-color': 'Cobalt Blue', 'p-decor': '',
        'p-cruise': false, 'p-house': true, 'p-swatch': 17
      },
      single: { location: 'SAMPLE-WALL-B3', allocations: [] }, qty: {
      'ut-rolls': { onOrder: 0, inHouse: null, allocated: 12 },
      'ut-swatches': { onOrder: 0, inHouse: null, allocated: 0 },
      'ut-miscuts': { onOrder: 0, inHouse: null, allocated: 0 },
      'ut-boards': { onOrder: 0, inHouse: null, allocated: 0 } } }
  ];

  /* ── Seed properties ─────────────────────────────────────────
     The seed items were written when an item was a name and a row of
     figures, before properties existed. Only the detailed one was given
     them by hand, which meant editing any other item found no values to
     edit and saved a blank — the generated name would come back as
     "Untitled item".

     Their names were built from the naming template in the first place,
     so the values are already in them: split the name back along the
     template and fill in what is missing. Anything the template does
     not cover starts empty, as a new item's would.
     ------------------------------------------------------------ */
  /* ── A second catalog: Dies ──────────────────────────────────
     Single-unit, so the item IS the record. It exists because the
     single-unit path is otherwise unreachable now that nothing is
     persisted — building one by hand in Catalog Settings would be lost
     on the first navigation, which would make a whole half of the model
     impossible to look at.

     It lives on its own page, `catalog-dies.html`, rather than being a
     mode of the Bookcloth one. A die has no vendor or colour; it has a
     number, a material and a process, so the two catalogs do not share
     properties, a naming template or a table shape — and a single page
     switching between them would be two pages wearing one filename.
     ------------------------------------------------------------ */
  const DIE_PROPERTIES = [
    { id: 'd-number',   label: 'Die Number', icon: 'fa-hashtag', kind: 'text' },
    { id: 'd-material', label: 'Material',   icon: 'fa-layer-group', kind: 'select',
      options: ['Brass', 'Magnesium', 'Copper'] },
    { id: 'd-process',  label: 'Process',    icon: 'fa-stamp', kind: 'select',
      options: ['Foil Stamp', 'Deboss', 'Emboss', 'Cut & Crease'] },
    { id: 'd-client',   label: 'Client',     icon: 'fa-user', kind: 'text' },
    { id: 'd-size',     label: 'Size',       icon: 'fa-ruler-horizontal', kind: 'text' },
    { id: 'd-vault',    label: 'Customer Owned', icon: 'fa-toggle-on', kind: 'boolean' }
  ];

  const DIE_CONFIG = {
    catalog: 'Dies',
    singleUnit: true,
    unitTypes: [ { id: 'ut-dies', name: 'Dies', allocateTo: 'user', qty: null, fields: [] } ]
  };

  /* A die on a press is allocated; one in the rack is available; one
     with no location has been cut but not yet put away. */
  const DIE_ITEMS = [
    { swatch: 1042, props: { 'd-number': 'D-1042', 'd-material': 'Brass', 'd-process': 'Emboss',
        'd-client': 'Omni', 'd-size': '2in', 'd-vault': true },
            history: [ { at: '3/4/24',  text: 'Die received from Ohio Die' },
                 { at: '3/4/24',  text: 'Scanned to DIE-RACK-1-A' },
                 { at: '8/12/26', text: 'Allocated to On press — Kluge 4' },
                 { at: '8/19/26', text: 'Allocation removed' } ],
      single: { location: 'DIE-RACK-1-A', allocations: [] } },
    { swatch: 1043, props: { 'd-number': 'D-1043', 'd-material': 'Magnesium', 'd-process': 'Foil Stamp',
        'd-client': 'Omni', 'd-size': '6in', 'd-vault': false },
            history: [ { at: '3/4/24',  text: 'Die received from Ohio Die' },
                 { at: '3/4/24',  text: 'Scanned to DIE-RACK-1-A' },
                 { at: '9/2/26',  text: 'Allocated to On press — Kluge 4' } ],
      single: { location: 'DIE-RACK-1-A', allocations: [{ kind: 'user', value: 'On press — Kluge 4' }] } },
    { swatch: 1088, props: { 'd-number': 'D-1088', 'd-material': 'Brass', 'd-process': 'Deboss',
        'd-client': 'Boyd Gaming', 'd-size': '3in', 'd-vault': false },
            history: [ { at: '11/9/24', text: 'Die received from Ohio Die' },
                 { at: '11/9/24', text: 'Scanned to DIE-RACK-1-B' } ],
      single: { location: 'DIE-RACK-1-B', allocations: [] } },
    { swatch: 1090, props: { 'd-number': 'D-1090', 'd-material': 'Copper', 'd-process': 'Emboss',
        'd-client': 'Boyd Gaming', 'd-size': '1.5in', 'd-vault': false },
            history: [ { at: '11/9/24', text: 'Die received from Ohio Die' },
                 { at: '1/16/25', text: 'Scanned to DIE-VAULT' } ],
      single: { location: 'DIE-VAULT', allocations: [] } },
    /* Two people believe they have this one. The catalog reads as
       oversold, which is the point of recording it. */
    { swatch: 1104, props: { 'd-number': 'D-1104', 'd-material': 'Brass', 'd-process': 'Foil Stamp',
        'd-client': 'True Food Kitchen', 'd-size': '4in', 'd-vault': false },
            history: [ { at: '2/2/25',  text: 'Die received from Ohio Die' },
                 { at: '2/2/25',  text: 'Scanned to DIE-RACK-2-C' },
                 { at: '8/28/26', text: 'Allocated to K. Bell' },
                 { at: '9/4/26',  text: 'Allocated to M. Diaz' } ],
      single: { location: 'DIE-RACK-2-C',
                allocations: [{ kind: 'user', value: 'K. Bell' }, { kind: 'user', value: 'M. Diaz' }] } },
    { swatch: 1131, props: { 'd-number': 'D-1131', 'd-material': 'Magnesium', 'd-process': 'Cut & Crease',
        'd-client': 'Village Inn', 'd-size': '8.5 × 11in', 'd-vault': false },
            history: [ { at: '9/8/26',  text: 'Die ordered from Ohio Die' } ],
      single: { location: null, allocations: [] } }
  ];

  (function seedProperties() {
    ITEMS.forEach(item => {
      if (item.props) return;
      const parts = String(item.name || '').split('-');
      const props = {};
      CATALOG_PROPERTIES.forEach(p => { props[p.id] = p.kind === 'boolean' ? false : ''; });
      NAMING_TEMPLATE.forEach((id, i) => { props[id] = parts[i] || ''; });
      props['p-swatch'] = item.swatch;
      props['p-house'] = true;
      item.props = props;
    });
  })();

  /* ── Adding an item ──────────────────────────────────────────
     A new item is a blank of the catalog's own shape: a value slot for
     every property, a figure slot for every unit type, and — in a
     single-unit catalog — the record the item itself is.

     Its swatch number is handed out rather than typed. It is the item's
     handle, it has to be unique, and asking someone to know the next
     free one is asking them to do the system's job.
     ------------------------------------------------------------ */
  function nextSwatch(items) {
    return items.reduce((n, it) => Math.max(n, Number(it.swatch) || 0), 0) + 1;
  }

  function newItem(cfg, items, properties) {
    const props = {};
    (properties || CATALOG_PROPERTIES).forEach(p => {
      props[p.id] = p.kind === 'boolean' ? false : '';
    });

    const qty = {};
    (cfg.unitTypes || []).forEach(t => { qty[t.id] = { onOrder: 0, inHouse: 0, allocated: 0 }; });

    const item = { swatch: nextSwatch(items || ITEMS), name: '', props, qty };
    if (cfg.singleUnit) item.single = { location: null, allocations: [] };
    return item;
  }

  function addItem(item, items) {
    (items || ITEMS).push(item);
    return item;
  }

  /* ── Libraries ───────────────────────────────────────────────
     A library is a collection of catalogs, for the whole company;
     what differs per person is which ones they keep in their view.

     A library does not constrain how its catalogs are configured.
     The unit type builder offers the same four dimensions everywhere,
     so a library of laptops is not stopped from making a Length unit
     type; it simply never would.
     ------------------------------------------------------------ */
  const LIBRARIES = [
    { id: 'lib-materials', name: 'Materials', catalogs: [
      { name: 'Bookcloth', items: 793 }, { name: 'Endsheet', items: 412 }, { name: 'Board', items: 168 } ] },
    { id: 'lib-it', name: 'IT Library', catalogs: [
      { name: 'Laptops', items: 84 }, { name: 'Monitors', items: 121 }, { name: 'Peripherals', items: 342 } ] },
    { id: 'lib-bindery', name: 'Bindery Supplies', catalogs: [
      { name: 'Adhesives', items: 56 }, { name: 'Head & Tail Bands', items: 210 }, { name: 'Dies', items: 178 } ] },
    { id: 'lib-shipping', name: 'Shipping & Packaging', catalogs: [
      { name: 'Cartons', items: 96 }, { name: 'Void Fill', items: 24 } ] },
    { id: 'lib-sample', name: 'Sample Room', catalogs: [
      { name: 'Swatch Books', items: 431 }, { name: 'Dummies', items: 88 } ] },
    { id: 'lib-foil', name: 'Foils & Films', catalogs: [
      { name: 'Hot Foil', items: 143 }, { name: 'Lamination', items: 67 } ] }
  ];

  /* Renaming a library edits LIBRARIES in place, which is all a
     prototype needs — see the storage note at the foot of this file. */
  function saveLibraries() { return LIBRARIES; }

  function libraryById(id) { return LIBRARIES.find(l => l.id === id) || null; }
  function libraryOfCatalog(name) {
    return LIBRARIES.find(l => l.catalogs.some(c => c.name === name)) || null;
  }

  /* ── Per-person library view ─────────────────────────────────── */
  const DEFAULT_VIEW = ['lib-materials', 'lib-it'];
  let viewMemory = null;

  function loadLibraryView() {
    if (!viewMemory) viewMemory = DEFAULT_VIEW.slice();
    return viewMemory;
  }

  function saveLibraryView(ids) {
    viewMemory = ids;
    return ids;
  }

  /* ── State ────────────────────────────────────────────────────
     In memory, for the life of the page. Nothing is written to
     localStorage — see the note at the foot of this file.
     ------------------------------------------------------------ */
  let memory = null;

  function loadConfig() {
    if (!memory) memory = normalizeConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    return memory;
  }

  /* Anything read back gets its dimensions and UOMs checked against
     the controlled list, so a hand-edited or stale value can never
     put a dimension on screen that the builder cannot offer. */
  function normalizeConfig(cfg) {
    cfg.singleUnit = !!cfg.singleUnit;
    /* A single-unit catalog holds exactly one unit type. More than one
       would be the item claiming to be two different objects. */
    if (cfg.singleUnit && (cfg.unitTypes || []).length > 1) {
      cfg.unitTypes = cfg.unitTypes.slice(0, 1);
    }

    (cfg.unitTypes || []).forEach(t => {
      /* The catalog's claim, mirrored onto the type so every surface can
         ask the object in front of it rather than reaching for the
         config. The catalog is the only writer. */
      t.singleUnit = cfg.singleUnit;
      t.allocateTo = (cfg.singleUnit || t.allocateTo === 'user') ? 'user' : 'job';
      t.fields = Array.isArray(t.fields) ? t.fields : [];

      /* A single-unit record has no quantity: one record is one thing. */
      if (t.singleUnit) { t.qty = null; t.fields = []; return; }

      t.qty = t.qty || { dimension: 'count', uom: 'ea', default: null };
      if (!DIMENSION_KEYS.includes(t.qty.dimension)) t.qty.dimension = 'count';
      t.qty.uom = normalizeUom(t.qty.dimension, t.qty.uom);
      t.fields.forEach(f => {
        if (!DIMENSION_KEYS.includes(f.dimension)) f.dimension = 'width';
        f.uom = normalizeUom(f.dimension, f.uom);
      });
    });
    return cfg;
  }

  function saveConfig(cfg) {
    memory = cfg;
    return cfg;
  }

  function resetConfig() {
    memory = null;
    return loadConfig();
  }

  /* ── Derived helpers ────────────────────────────────────────── */

  function unitTypeById(cfg, id) {
    return (cfg.unitTypes || []).find(t => t.id === id) || null;
  }

  /* The label that follows every figure for this type — 'yd' for a
     length-counted roll, 'ea' for anything counted in pieces, and 'ea'
     for a single-unit type, where one record is one thing. */
  function quantityUnitLabel(t) {
    if (!t) return '';
    return t.singleUnit ? 'ea' : (t.qty && t.qty.uom) || 'ea';
  }

  /* What one unit contributes. A single-unit record is worth 1 while
     it exists — there is nothing about it to deplete. */
  function qtyOf(u, t) {
    if (t && t.singleUnit) return 1;
    const v = u.qty;
    return (v === null || v === undefined || v === '') ? 0 : Number(v);
  }

  /* ── What counts as on hand ───────────────────────────────────
     A unit with no location has not been put away: recorded, but not
     findable. That is On Order. Giving it a location is what brings
     it into stock.
     ------------------------------------------------------------ */
  function isPlaced(u) {
    return !!(u.location && String(u.location).trim());
  }

  /* Allocation is one of two shapes, decided by the unit type:

       multi        one allocation, to a job OR a user, never both.
       single-unit  a list of users; each one allocated adds 1, so a
                    record two people have claimed reads as oversold
                    rather than quietly available.
     ------------------------------------------------------------ */
  function allocationsOf(u) {
    if (Array.isArray(u.allocations)) return u.allocations;
    return u.allocation ? [u.allocation] : [];
  }

  function isAllocated(u) { return allocationsOf(u).length > 0; }

  function allocatedQty(u, t) {
    if (!isPlaced(u)) return 0;
    if (t && t.singleUnit) return allocationsOf(u).length;
    return isAllocated(u) ? qtyOf(u, t) : 0;
  }

  /* How an allocation reads where there is no column header to say
     what kind it is — the catalog page's single-unit table. A job is
     prefixed so a six-digit number is never mistaken for a badge. */
  function allocationLabel(holder, kind) {
    const list = allocationsOf(holder);
    if (!list.length) return '';
    return list.map(a => (a.kind || kind) === 'job' ? `Job ${a.value}` : a.value).join(', ');
  }

  /* What the Allocated to column is called, and what an empty one
     means, in the catalog's own terms. */
  const ALLOCATION_KINDS = {
    job:  { key: 'job',  label: 'Job', column: 'Job Number',
            help: 'Stock is committed to a job. A six-digit job number releases or claims a unit.' },
    user: { key: 'user', label: 'User', column: 'Allocated to',
            help: 'Stock goes out to a person. A name releases or claims a unit.' }
  };

  function allocationKind(unitType) {
    if (unitType && unitType.singleUnit) return ALLOCATION_KINDS.user;
    return ALLOCATION_KINDS[(unitType && unitType.allocateTo) || 'job'];
  }

  function sumOf(t, units, keep, value) {
    if (!t) return 0;
    return units.filter(u => u.unitTypeId === t.id && keep(u))
                .reduce((sum, u) => sum + value(u), 0);
  }

  function onOrderFor(t, units) { return sumOf(t, units, u => !isPlaced(u), u => qtyOf(u, t)); }
  function totalFor(t, units)   { return sumOf(t, units, isPlaced,          u => qtyOf(u, t)); }
  function allocatedFor(t, units) {
    return sumOf(t, units, isPlaced, u => allocatedQty(u, t));
  }

  /* ── Stock state ─────────────────────────────────────────────
     Colour on a figure means one thing: this stock needs attention.
     "Low" is a placeholder ratio — in the real tool it should be a
     reorder point set per catalog or per unit type.
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

  /* An item's figures for one unit type. The detailed item's are
     summed from its real units so the table and the item page can
     never drift apart. */
  /* ── A single-unit type's figures ─────────────────────────────
     There are no units within the item: the item IS the unit, worth 1
     while it exists. Every figure is therefore a headcount of items,
     which is why the rollup for this type belongs to the catalog
     rather than to any one item.
     ------------------------------------------------------------ */
  function singleQty(item) {
    const rec = item.single || {};
    const placed = !!(rec.location && String(rec.location).trim());
    const allocated = placed ? (rec.allocations || []).length : 0;
    return {
      onOrder: placed ? 0 : 1,
      inHouse: placed ? 1 : 0,
      allocated,
      available: (placed ? 1 : 0) - allocated
    };
  }

  function catalogQty(items, t) {
    return items.reduce((sum, it) => {
      const q = singleQty(it);
      return { onOrder: sum.onOrder + q.onOrder, inHouse: sum.inHouse + q.inHouse,
               allocated: sum.allocated + q.allocated,
               available: sum.available + q.available };
    }, { onOrder: 0, inHouse: 0, allocated: 0, available: 0 });
  }

  function itemQty(item, t) {
    if (t.singleUnit) return singleQty(item);
    const q = (item.qty && item.qty[t.id]) || {};
    const inHouse = (q.inHouse === null || q.inHouse === undefined)
      ? (item.detailed ? totalFor(t, DEFAULT_UNITS) : 0)
      : q.inHouse;
    const allocated = item.detailed ? allocatedFor(t, DEFAULT_UNITS) : (q.allocated || 0);
    const onOrder   = item.detailed ? onOrderFor(t, DEFAULT_UNITS)   : (q.onOrder || 0);
    return { onOrder, inHouse, allocated, available: inHouse - allocated };
  }

  /* ── History ─────────────────────────────────────────────────
     A unit's quantity is typed over, so the number on screen carries
     no account of how it got there. The log is that account: every
     quantity entered, every allocation made and released, in order.
     ------------------------------------------------------------ */
  function today() {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
  }

  function logEvent(u, text) {
    u.history = u.history || [];
    u.history.push({ at: today(), text });
    return u.history;
  }

  /* ── Nothing is stored ───────────────────────────────────────
     This prototype keeps everything in memory and reloads from the seed
     data on every page load. It used to persist to localStorage, which
     made it feel like it was caching: a hard refresh reloads the files
     but leaves site data alone, so an experiment from an hour ago kept
     coming back and every change to the seed data appeared to do
     nothing.

     Persistence is the real tool's job. What this one is for is trying
     a shape out, and for that, "refresh gets me back to a known state"
     is worth more than "my edits survive".

     Two consequences, both intended: edits are lost on navigation, and
     a unit type saved as a preset is only a preset until the page
     reloads.
     ------------------------------------------------------------ */

  global.INVENTORY = {
    DIMENSIONS, DIMENSION_KEYS, LINEAR, UNIT_LABELS, dimension, uomsFor, normalizeUom,
    DEFAULT_CONFIG, DEFAULT_UNITS, ITEMS,
    PROPERTY_KINDS, CATALOG_PROPERTIES, propertyById, NAMING_TEMPLATE, itemName,
    DIE_PROPERTIES, DIE_CONFIG, DIE_ITEMS,
    newItem, addItem, nextSwatch,
    LIBRARIES, libraryById, libraryOfCatalog, saveLibraries, loadLibraryView, saveLibraryView,
    loadConfig, saveConfig, resetConfig, normalizeConfig,
    loadPresets, savePreset, SEED_PRESETS,
    unitTypeById, qtyOf, totalFor, allocatedFor, onOrderFor, allocatedQty,
    isPlaced, isAllocated, allocationsOf, allocationLabel,
    ALLOCATION_KINDS, allocationKind,
    quantityUnitLabel, itemQty, singleQty, catalogQty, stockState, LOW_STOCK_RATIO, isValidJob, fmt,
    logEvent, today
  };

})(window);
