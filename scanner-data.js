/* ============================================================
   Handheld scanner — mock content
   ------------------------------------------------------------
   Sample records only. Not a data layer, not an API client.
   Ids, locations and unit types match inventory-data.js so the
   same unit reads the same on the desktop pages and the handheld.

   For handoff: the SHAPES are the proposal — what a scan has to
   resolve to, and what the handheld needs back from the server
   for each of the two kinds of barcode.
   ============================================================ */
(function (global) {

  /* A scan resolves to exactly one record. The barcode itself says
     nothing about which kind it is — the server answers with a
     `kind`, and the app routes on that. */

  /* ── Units ───────────────────────────────────────────────────
     allocateTo comes from the unit TYPE, not the unit: every unit
     of one type allocates the same way. singleUnit types have no
     counted quantity, so the handheld hides Adjust Quantity for
     them rather than showing a control that cannot do anything. */
  const UNITS = [
    { id: 'u1', barcode: 'CM-U-000001',
      itemName: 'Majilite-Majilite-Attache-Copper',
      catalog: 'Bookcloth', library: 'Materials',
      unitType: 'Rolls', allocateTo: 'job', singleUnit: false,
      qty: 30, uom: 'yd',
      fields: [ { label: 'Width', value: 54, uom: 'in' } ],
      location: 'WARE-3-1-A3',
      allocation: { kind: 'job', value: '487712' },
      history: [
        { at: '7/28/26', text: 'Received — 84 yd, no location' },
        { at: '7/28/26', text: 'Put away to WARE-3-1-A3' },
        { at: '8/14/26', text: 'Quantity 84 → 48 yd — 36 used' },
        { at: '8/22/26', text: 'Allocated to job 487712' },
        { at: '9/2/26',  text: 'Quantity 48 → 30 yd — 18 used' }
      ] },

    { id: 'u2', barcode: 'CM-U-000002',
      itemName: 'Majilite-Majilite-Attache-Copper',
      catalog: 'Bookcloth', library: 'Materials',
      unitType: 'Rolls', allocateTo: 'job', singleUnit: false,
      qty: 18, uom: 'yd',
      fields: [ { label: 'Width', value: 54, uom: 'in' } ],
      location: 'WARE-3-1-B1',
      allocation: null,
      history: [
        { at: '8/03/26', text: 'Received — 18 yd, no location' },
        { at: '8/03/26', text: 'Put away to WARE-3-1-B1' }
      ] },

    { id: 'u5', barcode: 'CM-U-000005',
      itemName: 'Majilite-Majilite-Attache-Silver',
      catalog: 'Bookcloth', library: 'Materials',
      unitType: 'Miscuts', allocateTo: 'job', singleUnit: false,
      qty: 6, uom: 'ea',
      fields: [ { label: 'Width', value: 0.75, uom: 'yd' },
                { label: 'Height', value: 1.25, uom: 'yd' } ],
      location: 'WARE-3-2-C4',
      allocation: null,
      history: [
        { at: '8/19/26', text: 'Created from job 487712 offcut — 6 ea' },
        { at: '8/19/26', text: 'Put away to WARE-3-2-C4' }
      ] },

    /* A single-unit record: the item IS the unit. No counted
       quantity, so no Adjust Quantity action. */
    { id: 'die-4471', barcode: 'CM-D-004471',
      itemName: 'Die 4471 — Omni Hotels foil block',
      catalog: 'Dies', library: 'Bindery Supplies',
      unitType: 'Dies', allocateTo: 'user', singleUnit: true,
      qty: null, uom: null,
      fields: [ { label: 'Material', value: 'Magnesium', uom: null },
                { label: 'Process', value: 'Foil Stamp', uom: null },
                { label: 'Size', value: '3.5 x 1.75 in', uom: null } ],
      location: 'DIE-RACK-1-A',
      allocation: { kind: 'user', value: 'On press — Kluge 4' },
      history: [
        { at: '6/11/26', text: 'Added to DIE-RACK-1-A' },
        { at: '8/19/26', text: 'Allocation removed' },
        { at: '9/4/26',  text: 'Allocated to On press — Kluge 4' }
      ] }
  ];

  /* ── Locations ───────────────────────────────────────────────
     A location knows what it holds; the units are the point of
     scanning one. */
  const LOCATIONS = [
    { id: 'WARE-3-1-A3', barcode: 'CM-L-WARE-3-1-A3',
      name: 'WARE-3-1-A3', kind: 'Warehouse shelf',
      path: 'Warehouse 3 › Aisle 1 › Bay A › Level 3',
      unitIds: ['u1'],
      history: [
        { at: '7/28/26', text: 'Roll of Attache Copper put away — 84 yd' },
        { at: '9/2/26',  text: 'Roll of Attache Copper — quantity 48 → 30 yd' }
      ] },

    { id: 'WARE-3-2-C4', barcode: 'CM-L-WARE-3-2-C4',
      name: 'WARE-3-2-C4', kind: 'Warehouse shelf',
      path: 'Warehouse 3 › Aisle 2 › Bay C › Level 4',
      unitIds: ['u5'],
      history: [
        { at: '8/19/26', text: 'Miscuts of Attache Silver put away — 6 ea' }
      ] },

    { id: 'WARE-3-1-B1', barcode: 'CM-L-WARE-3-1-B1',
      name: 'WARE-3-1-B1', kind: 'Warehouse shelf',
      path: 'Warehouse 3 › Aisle 1 › Bay B › Level 1',
      unitIds: ['u2'],
      history: [
        { at: '8/03/26', text: 'Roll of Attache Copper put away — 18 yd' }
      ] },

    { id: 'DIE-RACK-1-A', barcode: 'CM-L-DIE-RACK-1-A',
      name: 'DIE-RACK-1-A', kind: 'Die rack',
      path: 'Bindery › Die rack 1 › Slot A',
      unitIds: ['die-4471'],
      history: [
        { at: '6/11/26', text: 'Die 4471 added' }
      ] },

    /* An empty location — the state most likely to be scanned by
       someone about to put something away. */
    { id: 'WARE-3-1-A4', barcode: 'CM-L-WARE-3-1-A4',
      name: 'WARE-3-1-A4', kind: 'Warehouse shelf',
      path: 'Warehouse 3 › Aisle 1 › Bay A › Level 4',
      unitIds: [],
      history: [] }
  ];

  /* ── Allocation targets ──────────────────────────────────────
     A job barcode and a user badge scan into the same field; the
     unit type decides which kind is accepted. */
  const JOBS = [
    { barcode: 'CM-J-487712', value: '487712', label: 'Omni Nashville — banquet menus' },
    { barcode: 'CM-J-491204', value: '491204', label: 'Boyd Gaming — in-room dining' }
  ];

  const USERS = [
    { barcode: 'CM-P-LHAGEN', value: 'L. Hagen',  label: 'Bindery' },
    { barcode: 'CM-P-MDIAZ',  value: 'M. Diaz',   label: 'Sample room' },
    { barcode: 'CM-P-TOKAFOR',value: 'T. Okafor', label: 'Press' }
  ];

  /* ── Lookup ──────────────────────────────────────────────────
     One entry point, because on the floor the operator does not
     know which kind of label they just pulled the trigger on. */
  function resolve(code) {
    const c = String(code || '').trim().toUpperCase();
    if (!c) return null;

    const unit = UNITS.find(u => u.barcode === c || u.id.toUpperCase() === c);
    if (unit) return { kind: 'unit', record: unit };

    const loc = LOCATIONS.find(l => l.barcode === c || l.id.toUpperCase() === c);
    if (loc) return { kind: 'location', record: loc };

    const job = JOBS.find(j => j.barcode === c || j.value === c);
    if (job) return { kind: 'job', record: job };

    const user = USERS.find(u => u.barcode === c);
    if (user) return { kind: 'user', record: user };

    return null;
  }

  function unitById(id)     { return UNITS.find(u => u.id === id) || null; }
  function locationById(id) { return LOCATIONS.find(l => l.id === id) || null; }

  /* What a random trigger-pull lands on. Real scanning reads a
     label; this stands in for that on a desktop. */
  function randomBarcode(kind) {
    const pool = kind === 'location' ? LOCATIONS
               : kind === 'unit'     ? UNITS
               : UNITS.concat(LOCATIONS);
    return pool[Math.floor(Math.random() * pool.length)].barcode;
  }

  global.ScannerData = {
    UNITS, LOCATIONS, JOBS, USERS,
    resolve, unitById, locationById, randomBarcode
  };

})(window);
