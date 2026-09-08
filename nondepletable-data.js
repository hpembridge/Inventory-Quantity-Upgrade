/* ============================================================
   Inventory Quantity Upgrade — non-depletable prototype data
   ------------------------------------------------------------
   A non-depletable unit is not consumed, so it has no quantity to
   run down. Each recorded unit is one asset, worth 1 while it
   exists, and the only thing that changes about it is where it is.

   Two ways of holding them, set on the unit type:

     multi   — many of the same item (laptops, mice, monitors).
               The item has its own page; the units live on it and
               the rollup reports the four standard figures.
     single  — every item is unique (dies). There are no units
               within an item: the item itself carries the
               location, so the rollup belongs on the catalog page.

   Reads the shared MEASUREMENT_TYPES for icons and labels; adds
   nothing to it, so the existing pages are untouched.
   ============================================================ */
(function (global) {

  /* ── Locations ───────────────────────────────────────────────
     A location is typed. That type is what makes an asset allocated
     or available: in the stock room it can be handed to anyone; with
     a person it is spoken for. Nothing else about a non-depletable
     asset changes, so this one field carries the whole state.
     ------------------------------------------------------------ */
  const LOCATION_KINDS = {
    stock:    { key: 'stock',    label: 'Stock Room', icon: 'fa-warehouse' },
    assigned: { key: 'assigned', label: 'Assigned',   icon: 'fa-user' }
  };

  const LOCATIONS = [
    { id: 'IT-CAGE-A1',  label: 'IT-CAGE-A1',  kind: 'stock' },
    { id: 'IT-CAGE-A2',  label: 'IT-CAGE-A2',  kind: 'stock' },
    { id: 'IT-BENCH-1',  label: 'IT-BENCH-1',  kind: 'stock' },
    { id: 'emp-jroth',   label: 'J. Roth — Estimating',   kind: 'assigned' },
    { id: 'emp-mdiaz',   label: 'M. Diaz — Prepress',     kind: 'assigned' },
    { id: 'emp-kbell',   label: 'K. Bell — Bindery',      kind: 'assigned' },
    { id: 'emp-tokafor', label: 'T. Okafor — Sales',      kind: 'assigned' },
    { id: 'emp-lhagen',  label: 'L. Hagen — Design',      kind: 'assigned' }
  ];

  const DIE_LOCATIONS = [
    { id: 'DIE-RACK-1-A', label: 'DIE-RACK-1-A', kind: 'stock' },
    { id: 'DIE-RACK-1-B', label: 'DIE-RACK-1-B', kind: 'stock' },
    { id: 'DIE-RACK-2-C', label: 'DIE-RACK-2-C', kind: 'stock' },
    { id: 'DIE-VAULT',    label: 'DIE-VAULT',    kind: 'stock' },
    { id: 'press-4',      label: 'On press — Kluge 4',      kind: 'assigned' },
    { id: 'press-6',      label: 'On press — Heidelberg 6', kind: 'assigned' },
    { id: 'vendor-ohdie', label: 'Out to Ohio Die',         kind: 'assigned' }
  ];

  function locationById(list, id) {
    return list.find(l => l.id === id) || null;
  }

  /* ── Multi-unit: one catalog of laptops ──────────────────────
     Same item, many assets. The units differ only by asset tag and
     where they are — there is no quantity to record, because one
     laptop is one laptop.
     ------------------------------------------------------------ */
  const MULTI_CONFIG = {
    catalog: 'Laptops',
    library: 'IT Library',
    unitType: {
      id: 'ut-assets',
      name: 'Assets',
      stockForm: 'nondepletable',
      tracking: 'multi',
      identityLabel: 'Asset Tag'
    }
  };

  /* location: null means recorded but not yet put away — On Order. */
  const MULTI_UNITS = [
    { id: 'a1', tag: 'CM-LT-0412', location: 'IT-CAGE-A1' },
    { id: 'a2', tag: 'CM-LT-0413', location: 'emp-jroth' },
    { id: 'a3', tag: 'CM-LT-0414', location: 'emp-mdiaz' },
    { id: 'a4', tag: 'CM-LT-0415', location: 'IT-CAGE-A2' },
    { id: 'a5', tag: 'CM-LT-0416', location: 'emp-kbell' },
    { id: 'a6', tag: 'CM-LT-0417', location: 'IT-BENCH-1' },
    { id: 'a7', tag: 'CM-LT-0421', location: null },
    { id: 'a8', tag: 'CM-LT-0422', location: null }
  ];

  /* The rest of the catalog. The detailed item's figures are summed
     from MULTI_UNITS, so the list and the item page cannot drift. */
  const MULTI_ITEMS = [
    { id: 'it-lat7450', name: 'Dell-Latitude-7450-16GB', detailed: true },
    { id: 'it-lat5550', name: 'Dell-Latitude-5550-32GB', onOrder: 4,  inHouse: 22, allocated: 19 },
    { id: 'it-prec',    name: 'Dell-Precision-3591-64GB', onOrder: 0, inHouse: 6,  allocated: 6 },
    { id: 'it-mbp14',   name: 'Apple-MacBook Pro-14-M4',  onOrder: 2,  inHouse: 11, allocated: 9 },
    { id: 'it-mba13',   name: 'Apple-MacBook Air-13-M3',  onOrder: 0,  inHouse: 8,  allocated: 3 },
    { id: 'it-tbook',   name: 'Lenovo-ThinkBook-16-16GB', onOrder: 6,  inHouse: 4,  allocated: 7 }
  ];

  /* ── Single-unit: one catalog of dies ────────────────────────
     Every die is unique, so an item page holding "the units within
     this item" would always hold exactly one row. The item is the
     unit: it carries the location itself, and the rollup that would
     have sat on the item page sits on the catalog instead.
     ------------------------------------------------------------ */
  const SINGLE_CONFIG = {
    catalog: 'Dies',
    library: 'Bindery Supplies',
    unitType: {
      id: 'ut-dies',
      name: 'Dies',
      stockForm: 'nondepletable',
      tracking: 'single',
      identityLabel: 'Die Number'
    }
  };

  const SINGLE_ITEMS = [
    { id: 'd1', number: 'D-1042', name: 'Omni-Emboss-Crest-2in',        location: 'DIE-RACK-1-A' },
    { id: 'd2', number: 'D-1043', name: 'Omni-Foil-Wordmark-6in',       location: 'press-4' },
    { id: 'd3', number: 'D-1088', name: 'Boyd-Deboss-Logo-3in',         location: 'DIE-RACK-1-B' },
    { id: 'd4', number: 'D-1090', name: 'Boyd-Cut-Tab-Round',           location: 'DIE-VAULT' },
    { id: 'd5', number: 'D-1121', name: 'Marriott-Emboss-Seal-4in',     location: 'press-6' },
    { id: 'd6', number: 'D-1140', name: 'TopGolf-Cut-Corner-Radius',    location: 'DIE-RACK-2-C' },
    { id: 'd7', number: 'D-1155', name: 'Kekes-Foil-Script-5in',        location: 'vendor-ohdie' },
    { id: 'd8', number: 'D-1170', name: 'TrueFood-Deboss-Leaf-2in',     location: null },
    { id: 'd9', number: 'D-1171', name: 'TrueFood-Cut-Menu-Slot',       location: null }
  ];

  /* ── Figures ─────────────────────────────────────────────────
     Read exactly as they do for depletable stock (R16 / R17), with a
     count of assets standing in for a measured quantity:

       On Order   no location yet — recorded, not findable
       In-House   has a location, wherever that is
       Allocated  that location is a person or a press
       Available  In-House − Allocated
     ------------------------------------------------------------ */
  function kindOf(list, id) {
    const loc = locationById(list, id);
    return loc ? loc.kind : null;
  }

  function rollup(records, list) {
    const inHouse   = records.filter(r => !!r.location).length;
    const allocated = records.filter(r => kindOf(list, r.location) === 'assigned').length;
    return {
      onOrder: records.length - inHouse,
      inHouse,
      allocated,
      available: inHouse - allocated
    };
  }

  /* A location select, grouped by what the group means for the
     figures: the stock room is available, a person is not. */
  function locationOptions(list, value) {
    const groups = ['stock', 'assigned'];
    const blank = `<option value=""${value ? '' : ' selected'}>Not placed</option>`;
    return blank + groups.map(k => {
      const opts = list.filter(l => l.kind === k).map(l =>
        `<option value="${l.id}"${l.id === value ? ' selected' : ''}>${l.label}</option>`
      ).join('');
      return `<optgroup label="${LOCATION_KINDS[k].label}">${opts}</optgroup>`;
    }).join('');
  }

  global.NONDEPLETABLE = {
    LOCATION_KINDS, LOCATIONS, DIE_LOCATIONS, locationById, locationOptions,
    MULTI_CONFIG, MULTI_UNITS, MULTI_ITEMS,
    SINGLE_CONFIG, SINGLE_ITEMS,
    kindOf, rollup
  };

})(window);
