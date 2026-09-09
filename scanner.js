/* ============================================================
   Handheld scanner — prototype behaviour
   ------------------------------------------------------------
   This file moves values into markup that already exists in
   scanner.html and toggles the state classes listed at the foot
   of scanner.css. It builds no markup: every repeated structure
   is cloned from a <template>.
   ============================================================ */
(function () {
  'use strict';

  const D = window.ScannerData;

  /* ── State ───────────────────────────────────────────────────
     In Angular: a route param for the screen, and a small store
     for the scanned record and the in-flight draft. */
  const state = {
    screen: 'scan',
    back: [],            // screen stack, for the app bar's back arrow
    unit: null,          // the unit last scanned
    location: null,      // the location last scanned
    historyOf: null,     // 'unit' | 'location'
    qty: { current: null, used: null, new: null, correcting: false },
    move: { target: null },
    alloc: { target: null },
    confirm: { title: '', headline: '', detail: '' }
  };


  /* ── Screens ─────────────────────────────────────────────────── */

  function show(screen, opts) {
    const push = !(opts && opts.replace);
    if (push && screen !== state.screen) state.back.push(state.screen);
    state.screen = screen;

    document.querySelectorAll('.screen').forEach(el => {
      el.classList.toggle('is-active', el.dataset.screen === screen);
    });

    render();
    const body = document.querySelector('.screen.is-active .screen-body');
    if (body) body.scrollTop = 0;
  }

  function back() {
    /* The back arrow is the one way off these screens that does not
       say what it costs. With an entry made and not saved it would
       throw the entry away silently, so it asks first. */
    if (unsavedWork()) { askDiscard(); return; }
    leave();
  }

  function leave() {
    clearDraft();
    const prev = state.back.pop() || 'scan';
    state.screen = prev;
    show(prev, { replace: true });
  }

  /* What counts as work in progress, per screen. */
  function unsavedWork() {
    if (state.screen === 'quantity') {
      return state.qty.used !== null
          || state.qty.new !== null
          || (state.qty.correcting && state.qty.current !== null
              && state.unit && state.qty.current !== state.unit.qty);
    }
    if (state.screen === 'move')     return !!state.move.target;
    if (state.screen === 'allocate') return !!state.alloc.target;
    return false;
  }

  function discardDetail() {
    const uom = (state.unit && state.unit.uom) || '';
    if (state.screen === 'quantity') {
      if (state.qty.new !== null) return 'The new quantity of ' + state.qty.new + ' ' + uom + ' has not been saved.';
      return 'The corrected count has not been saved.';
    }
    if (state.screen === 'move')     return 'This unit has not been moved to ' + state.move.target.name + ' yet.';
    if (state.screen === 'allocate') return 'This unit has not been allocated to ' + state.alloc.target.value + ' yet.';
    return 'This entry has not been saved.';
  }

  function clearDraft() {
    state.qty = { current: null, used: null, new: null, correcting: false };
    state.move.target = null;
    state.alloc.target = null;
    document.querySelectorAll('#screen-quantity .input').forEach(i => {
      i.value = ''; i.classList.remove('is-derived');
    });
    document.getElementById('moveManual').value = '';
    document.getElementById('allocManual').value = '';
  }

  function askDiscard() {
    render();
    document.getElementById('discardModal').classList.add('open');
    document.querySelector('#discardModal [data-act="discard-cancel"]').focus();
  }

  function closeDiscard() {
    document.getElementById('discardModal').classList.remove('open');
  }


  /* ── Binding ─────────────────────────────────────────────────
     One pass over every [data-bind]. A bind whose name ends in
     "Icon" sets a class instead of text, and "statusPill" sets the
     pill's modifier — the only two exceptions, kept here so the
     markup stays plain. */

  function bindValues() {
    const u = state.unit;
    const l = state.location;
    const v = {};

    if (u) {
      const allocated = !!u.allocation;
      const placed = !!u.location;

      v['unit.id'] = u.id.toUpperCase();
      v['unit.barcode'] = u.barcode;
      v['unit.itemName'] = u.itemName;
      v['unit.unitType'] = u.unitType;
      /* Library › Catalog › Unit type — where this unit sits, in one
         line. A single-unit catalog has one type named after the
         catalog, so the third segment would only repeat the second. */
      v['unit.catalogPath'] = (u.singleUnit || u.unitType === u.catalog)
        ? u.library + ' › ' + u.catalog
        : u.library + ' › ' + u.catalog + ' › ' + u.unitType;
      v['unit.qty'] = u.qty === null ? '—' : String(u.qty);
      v['unit.uom'] = u.uom || '';
      v['unit.location'] = u.location || 'No location';
      v['unit.allocationText'] = allocated
        ? (u.allocation.kind === 'job' ? 'Job ' + u.allocation.value : u.allocation.value)
        : 'Not allocated';

      /* The pill carries the allocation itself. A separate "Allocated
         to" row said the same thing twice, once without the value. */
      v['unit.statusText'] = !placed ? 'On order — no location'
                           : allocated ? 'Allocated to ' + u.allocation.value
                           : 'Available';
      v['unit.statusIcon'] = !placed ? 'fa-solid fa-circle-exclamation'
                           : allocated ? 'fa-solid fa-user-tag'
                           : 'fa-solid fa-circle-check';
      v['unit.statusPill'] = !placed ? 'pill pill--unplaced'
                           : allocated ? 'pill pill--allocated'
                           : 'pill pill--available';

      const kindWord = u.allocateTo === 'job' ? 'a job' : 'a person';
      v['unit.allocateActionName'] = allocated ? 'Reallocate' : 'Allocate';
      v['unit.allocateActionHelp'] = 'Scan ' + kindWord + ' to commit this unit to';
      v['unit.releaseHelp'] = allocated
        ? 'Currently ' + v['unit.allocationText'] + ' — returns it to available'
        : '';

      /* Adjust Quantity is absent, not disabled, on a single-unit
         record: there is no counted quantity for it to act on. */
      v['unit.qtyAction'] = !u.singleUnit;
      v['unit.qty_row'] = !u.singleUnit;
      v['unit.release'] = allocated;

      /* Quantity screen */
      const cur = state.qty.current === null ? u.qty : state.qty.current;
      v['qty.current'] = cur === null ? '—' : String(cur);
      v['qty.currentReadout'] = !state.qty.correcting;
      v['qty.unlock'] = !state.qty.correcting;
      v['qty.currentField'] = state.qty.correcting;
      v['qty.canSave'] = (state.qty.new !== null && state.qty.new !== u.qty)
                      || (state.qty.correcting && state.qty.current !== null && state.qty.current !== u.qty);

      /* Move screen */
      v['move.target'] = state.move.target ? state.move.target.name : 'Not scanned';
      v['move.canSave'] = !!state.move.target;

      /* Allocate screen */
      const toJob = u.allocateTo === 'job';
      v['alloc.title'] = allocated ? 'Reallocate' : 'Allocate';
      v['alloc.targetLabel'] = toJob ? 'To job' : 'To person';
      v['alloc.target'] = state.alloc.target
        ? (toJob ? 'Job ' + state.alloc.target.value + ' — ' + state.alloc.target.label
                 : state.alloc.target.value + ' — ' + state.alloc.target.label)
        : 'Not scanned';
      v['alloc.icon'] = toJob ? 'fa-solid fa-clipboard-list' : 'fa-solid fa-id-badge';
      v['alloc.scanLabel'] = toJob ? 'Scan the job ticket' : 'Scan the badge';
      v['alloc.manualLabel'] = toJob ? 'Or enter a job number' : 'Or enter a name';
      v['alloc.placeholder'] = toJob ? '487712' : 'L. Hagen';
      v['alloc.saveLabel'] = allocated ? 'Reallocate' : 'Allocate';
      v['alloc.canSave'] = !!state.alloc.target;
    }

    /* The location screen shows its name (in the app bar) and what it
       holds. Barcodes here are not semantic, so nothing is derived from
       the scanned string and presented as if it meant something. */
    if (l) {
      v['loc.name'] = l.name;
      v['loc.unitCount'] = String(l.unitIds.length);
    }

    v['history.subject'] = state.historyOf === 'location'
      ? (l ? l.name : 'Location')
      : (u ? u.id.toUpperCase() : 'Unit');

    v['discard.detail'] = unsavedWork() ? discardDetail() : '';

    v['confirm.title'] = state.confirm.title;
    v['confirm.headline'] = state.confirm.headline;
    v['confirm.detail'] = state.confirm.detail;

    return v;
  }

  function render() {
    const v = bindValues();

    /* data-bind writes text. data-bind-class writes the whole class
       attribute — icons and the status pill, and nothing else. */
    document.querySelectorAll('[data-bind]').forEach(el => {
      const key = el.dataset.bind;
      if (!(key in v)) return;
      const val = v[key];
      el.textContent = (val === null || val === undefined) ? '—' : String(val);
    });

    document.querySelectorAll('[data-bind-class]').forEach(el => {
      const key = el.dataset.bindClass;
      if (key in v) el.className = v[key];
    });

    document.querySelectorAll('[data-bind-placeholder]').forEach(el => {
      const key = el.dataset.bindPlaceholder;
      if (key in v) el.placeholder = v[key];
    });

    document.querySelectorAll('[data-bind-disabled]').forEach(el => {
      const key = el.dataset.bindDisabled;
      if (key in v) el.disabled = !v[key];
    });

    /* Rows that appear or vanish with the record's shape */
    document.querySelectorAll('[data-row]').forEach(el => {
      const key = el.dataset.row;
      const map = { 'unit.qty': 'unit.qty_row' };
      const k = map[key] || key;
      if (k in v) el.hidden = !v[k];
    });

    renderUnitDetails();
    renderLocationUnits();
    renderHistory();
  }


  /* ── Repeated structures ─────────────────────────────────────
     Each clones a <template> once per row. In Angular these are
     @for blocks over the same arrays. */

  function clone(id) {
    return document.getElementById(id).content.firstElementChild.cloneNode(true);
  }

  function detailRow(label, value, mono) {
    const row = clone('detailRowTemplate');
    row.querySelector('[data-cell="label"]').textContent = label;
    const val = row.querySelector('[data-cell="value"]');
    const blank = (value === null || value === undefined || value === '');
    val.textContent = blank ? '—' : value;
    if (mono) val.classList.add('is-mono');
    if (blank) val.classList.add('is-empty');
    return row;
  }

  function renderUnitDetails() {
    const host = document.getElementById('unitDetails');
    const u = state.unit;
    if (!host) return;
    host.textContent = '';
    if (!u) return;

    /* Location, then the unit type's added fields. The allocation is
       on the pill and the catalog is in the kind line above; neither
       gets a row of its own. */
    host.appendChild(detailRow('Location', u.location, true));
    u.fields.forEach(f => {
      host.appendChild(detailRow(f.label, f.uom ? f.value + ' ' + f.uom : f.value));
    });
  }


  function renderLocationUnits() {
    const host = document.getElementById('locUnitList');
    const empty = document.getElementById('locUnitEmpty');
    const l = state.location;
    if (!host) return;
    host.textContent = '';
    if (!l) { empty.hidden = false; return; }

    empty.hidden = l.unitIds.length > 0;

    l.unitIds.forEach(id => {
      const u = D.unitById(id);
      if (!u) return;
      const row = clone('unitRowTemplate');
      row.querySelector('[data-cell="name"]').textContent = u.itemName;
      /* "Allocated" tells the operator nothing they can act on. Who
         has it does — a job number they can look up, a name they can
         walk over to. */
      const holder = u.allocation
        ? (u.allocation.kind === 'job' ? 'Job ' + u.allocation.value : u.allocation.value)
        : 'Available';
      row.querySelector('[data-cell="meta"]').textContent = u.unitType + ' · ' + holder;
      row.querySelector('[data-cell="qty"]').textContent = u.qty === null ? '1' : String(u.qty);
      row.querySelector('[data-cell="qtyCaption"]').textContent = u.uom || 'unit';
      host.appendChild(row);
    });
  }

  function renderHistory() {
    const host = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    if (!host) return;
    host.textContent = '';

    const src = state.historyOf === 'location'
      ? (state.location ? state.location.history : [])
      : (state.unit ? state.unit.history : []);

    empty.hidden = src.length > 0;

    /* Oldest first — the log reads as the story of the record
       rather than a stack of the most recent thing. */
    src.forEach(e => {
      const row = clone('timelineRowTemplate');
      row.querySelector('[data-cell="text"]').textContent = e.text;
      row.querySelector('[data-cell="at"]').textContent = e.at;
      host.appendChild(row);
    });
  }


  /* ── Toast ───────────────────────────────────────────────────
     An invalid scan is rejected outright and said out loud. The
     handheld has no room for inline errors under every field. */

  let toastTimer = null;

  function toast(message) {
    const el = document.getElementById('toast');
    document.getElementById('toastText').textContent = message;
    el.classList.add('is-error');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  function reject(input, message) {
    toast(message);
    if (!input) return;
    input.classList.add('is-rejected');
    setTimeout(() => input.classList.remove('is-rejected'), 900);
  }


  /* ── Opening a scanned record ────────────────────────────────── */



  function openUnit(u) {
    state.unit = u;
    state.qty = { current: null, used: null, new: null, correcting: false };
    state.move.target = null;
    state.alloc.target = null;
    show('unit');
  }

  function openLocation(l) {
    state.location = l;
    show('location');
  }

  function openCode(code, input) {
    const hit = D.resolve(code);
    if (!hit) { reject(input, 'No record for ' + code + '. Check the label, or enter the code.'); return false; }
    if (hit.kind === 'unit') { openUnit(hit.record); return true; }
    if (hit.kind === 'location') { openLocation(hit.record); return true; }
    reject(input, 'That is a ' + hit.kind + ' barcode. Scan a unit or a location.');
    return false;
  }


  /* ── The linked quantity pair ────────────────────────────────
     Amount used and New quantity are two views of one number.
     Filling either fills the other; the filled one is tinted so the
     operator can see which figure the system derived. */

  function currentQty() {
    if (state.qty.correcting && state.qty.current !== null) return state.qty.current;
    return state.unit ? state.unit.qty : 0;
  }

  function syncFromUsed(raw) {
    const usedEl = document.getElementById('qtyUsed');
    const newEl  = document.getElementById('qtyNew');
    const cur = currentQty();

    if (raw === '') {
      state.qty.used = null; state.qty.new = null;
      newEl.value = ''; newEl.classList.remove('is-derived');
      render(); return;
    }

    const used = Number(raw);
    if (isNaN(used) || used < 0) { reject(usedEl, 'Amount used has to be a number.'); return; }
    if (used > cur) {
      reject(usedEl, 'Only ' + cur + ' ' + state.unit.uom + ' on this unit. Correct the count first if that is wrong.');
      return;
    }

    state.qty.used = used;
    state.qty.new = cur - used;
    newEl.value = String(state.qty.new);
    newEl.classList.add('is-derived');
    usedEl.classList.remove('is-derived');
    render();
  }

  function syncFromNew(raw) {
    const usedEl = document.getElementById('qtyUsed');
    const newEl  = document.getElementById('qtyNew');
    const cur = currentQty();

    if (raw === '') {
      state.qty.new = null; state.qty.used = null;
      usedEl.value = ''; usedEl.classList.remove('is-derived');
      render(); return;
    }

    const next = Number(raw);
    if (isNaN(next) || next < 0) { reject(newEl, 'New quantity has to be a number.'); return; }
    if (next > cur) {
      reject(newEl, 'A quantity above ' + cur + ' is a correction, not use. Use the correction above.');
      return;
    }

    state.qty.new = next;
    state.qty.used = cur - next;
    usedEl.value = String(state.qty.used);
    usedEl.classList.add('is-derived');
    newEl.classList.remove('is-derived');
    render();
  }

  function setCorrection(raw) {
    if (raw === '') { state.qty.current = null; render(); return; }
    const n = Number(raw);
    if (isNaN(n) || n < 0) { reject(document.getElementById('qtyCurrent'), 'A count has to be a number.'); return; }
    state.qty.current = n;
    /* A correction resets the pair — the number underneath it just changed. */
    state.qty.used = null; state.qty.new = null;
    document.getElementById('qtyUsed').value = '';
    document.getElementById('qtyNew').value = '';
    render();
  }


  /* ── Committing ──────────────────────────────────────────────
     Each writes to the mock record and shows the confirmation. In
     the real tool they are one request each. */

  function done(title, headline, detail) {
    state.confirm = { title: title, headline: headline, detail: detail };
    clearDraft();
    state.back = ['scan', 'unit'];
    show('confirm', { replace: true });
  }

  function saveQuantity() {
    const u = state.unit;
    const cur = currentQty();
    const next = state.qty.new === null ? cur : state.qty.new;
    const was = u.qty;

    u.qty = next;

    if (state.qty.correcting && state.qty.new === null) {
      u.history.push({ at: 'today', text: 'Count corrected ' + was + ' → ' + next + ' ' + u.uom });
      done('Quantity saved', 'Count corrected',
           was + ' → ' + next + ' ' + u.uom + ' on ' + u.id.toUpperCase() + '.');
    } else {
      const used = cur - next;
      u.history.push({ at: 'today', text: 'Quantity ' + was + ' → ' + next + ' ' + u.uom + ' — ' + used + ' used' });
      done('Quantity saved', used + ' ' + u.uom + ' used',
           u.itemName + ' is now ' + next + ' ' + u.uom + '.');
    }
  }

  function saveMove() {
    const u = state.unit;
    const from = u.location;
    const to = state.move.target;

    const fromLoc = from ? D.locationById(from) : null;
    if (fromLoc) fromLoc.unitIds = fromLoc.unitIds.filter(id => id !== u.id);
    if (!to.unitIds.includes(u.id)) to.unitIds.push(u.id);

    u.location = to.id;
    u.history.push({ at: 'today', text: 'Moved ' + (from || 'no location') + ' → ' + to.id });
    done('Unit moved', 'Now at ' + to.name,
         u.itemName + ' moved from ' + (from || 'no location') + '.');
  }

  function saveAlloc() {
    const u = state.unit;
    const t = state.alloc.target;
    u.allocation = { kind: u.allocateTo, value: t.value };
    u.history.push({ at: 'today', text: 'Allocated to ' + (u.allocateTo === 'job' ? 'job ' : '') + t.value });
    done('Allocated',
         u.allocateTo === 'job' ? 'On job ' + t.value : 'With ' + t.value,
         u.itemName + ' — ' + t.label + '.');
  }

  function release() {
    const u = state.unit;
    const was = u.allocation;
    if (!was) return;
    u.allocation = null;
    u.history.push({ at: 'today', text: 'Allocation removed' });
    done('Released', 'Back to available',
         u.itemName + ' released from ' + (was.kind === 'job' ? 'job ' : '') + was.value + '.');
  }


  /* ── Actions ─────────────────────────────────────────────────
     One delegated listener. Every button says what it does in
     data-act; nothing is wired by class name. */

  const actions = {
    'back': back,

    /* Cancel says what it does, so it does not ask — but it is the
       same discard, so it goes through the same path. */
    'cancel': () => { clearDraft(); leave(); },

    'discard-cancel': closeDiscard,
    'discard-confirm': () => { closeDiscard(); leave(); },

    'go-scan': () => { state.back = []; show('scan', { replace: true }); },

    'back-to-unit': () => { state.back = ['scan']; show('unit', { replace: true }); },


    'scan-manual': () => {
      const input = document.getElementById('scanManual');
      if (openCode(input.value, input)) input.value = '';
    },

    'go-quantity': () => { show('quantity'); },

    'unlock-current': () => {
      state.qty.correcting = true;
      state.qty.current = state.unit.qty;
      render();
      const el = document.getElementById('qtyCurrent');
      el.value = String(state.unit.qty);
      el.focus();
    },

    'save-quantity': saveQuantity,

    'go-move': () => {
      state.move.target = null;
      document.getElementById('moveManual').value = '';
      show('move');
    },

    'move-manual': () => {
      const input = document.getElementById('moveManual');
      const hit = D.resolve(input.value);
      if (!hit || hit.kind !== 'location') { reject(input, 'Not a location. Scan a shelf label.'); return; }
      if (hit.record.id === state.unit.location) { reject(input, 'The unit is already there.'); return; }
      state.move.target = hit.record;
      render();
    },

    'save-move': saveMove,

    'go-allocate': () => {
      state.alloc.target = null;
      document.getElementById('allocManual').value = '';
      show('allocate');
    },

    'alloc-manual': () => {
      const input = document.getElementById('allocManual');
      const raw = input.value.trim();
      const toJob = state.unit.allocateTo === 'job';

      if (!raw) { reject(input, 'Nothing entered.'); return; }

      if (toJob) {
        /* Six digits, checked in the page. Real validation belongs
           against the job system. */
        if (!/^\d{6}$/.test(raw)) { reject(input, 'A job number is six digits.'); return; }
        const job = D.JOBS.find(j => j.value === raw);
        state.alloc.target = job || { value: raw, label: 'not in this prototype' };
      } else {
        const user = D.USERS.find(u => u.value.toLowerCase() === raw.toLowerCase());
        if (!user) { reject(input, 'No one on the floor list matches that name.'); return; }
        state.alloc.target = user;
      }
      render();
    },

    'save-alloc': saveAlloc,

    'release': release,

    'open-unit-history': () => { state.historyOf = 'unit'; show('history'); },

    'open-loc-history': () => { state.historyOf = 'location'; show('history'); },

    'put-away': () => {
      /* Simulated: a put-away is a move started from the location end.
         It sends the operator to the scan screen looking for a unit. */
      toast('Scan the unit going onto ' + state.location.name + '.');
      show('scan');
    }
  };

  /* ── Scan chooser ────────────────────────────────────────────
     PROTOTYPE SCAFFOLDING, and the only part of this file that would
     not exist in the application. A real handheld reads a label and
     hands the app a string. On a laptop there is nothing to read, so
     holding the trigger (or the on-screen target) offers the labels
     the current screen could accept; drag onto one and release to
     scan it. In Angular, the trigger is a hardware event and none of
     this — the sheet, the drag, the arming — is built. */

  const chooser = document.getElementById('scanChooser');
  const chooserList = document.getElementById('scanChooserList');
  let held = null;   // the element the pointer went down on
  let armed = null;  // the option under the pointer

  /* What the current screen could accept. The trigger never offers a
     label the screen would only reject. */
  function chooserOptions() {
    if (state.screen === 'move') {
      return D.LOCATIONS
        .filter(l => l.id !== (state.unit && state.unit.location))
        .map(l => ({ kind: 'Location', label: l.name, code: l.barcode }));
    }

    if (state.screen === 'allocate') {
      const toJob = state.unit && state.unit.allocateTo === 'job';
      return (toJob ? D.JOBS : D.USERS).map(t => ({
        kind: toJob ? 'Job ticket' : 'Badge',
        label: toJob ? t.value + ' — ' + t.label : t.value + ' — ' + t.label,
        code: t.barcode
      }));
    }

    return D.UNITS.map(u => ({
      kind: u.unitType,
      label: u.barcode + ' — ' + u.itemName,
      code: u.barcode
    })).concat(D.LOCATIONS.map(l => ({
      kind: 'Location',
      label: l.name,
      code: l.barcode
    })));
  }

  function openChooser(originEl) {
    chooserList.textContent = '';
    chooserOptions().forEach(opt => {
      const row = clone('scanOptionTemplate');
      row.querySelector('[data-cell="kind"]').textContent = opt.kind;
      row.querySelector('[data-cell="label"]').textContent = opt.label;
      row.dataset.code = opt.code;
      chooserList.appendChild(row);
    });
    chooser.hidden = false;

    if (originEl.classList.contains('scan-target')) originEl.classList.add('is-reading');
    if (originEl.classList.contains('trigger-btn')) originEl.classList.add('is-held');
  }

  function closeChooser() {
    chooser.hidden = true;
    if (armed) armed.classList.remove('is-armed');
    armed = null;
    document.querySelectorAll('.scan-target').forEach(el => el.classList.remove('is-reading'));
    document.querySelectorAll('.trigger-btn').forEach(el => el.classList.remove('is-held'));
  }

  function armAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const opt = el && el.closest ? el.closest('.scan-option') : null;
    if (opt === armed) return;
    if (armed) armed.classList.remove('is-armed');
    armed = opt;
    if (armed) armed.classList.add('is-armed');
  }

  /* A scanned code lands wherever the current screen puts it: the
     home screen opens the record, move and allocate fill their
     target. Same paths the typed entry uses. */
  function scanned(code) {
    if (state.screen === 'move') {
      const hit = D.resolve(code);
      if (!hit || hit.kind !== 'location') return;
      state.move.target = hit.record;
      document.getElementById('moveManual').value = hit.record.name;
      render();
      return;
    }

    if (state.screen === 'allocate') {
      const hit = D.resolve(code);
      if (!hit || (hit.kind !== 'job' && hit.kind !== 'user')) return;
      state.alloc.target = hit.record;
      document.getElementById('allocManual').value = hit.record.value;
      render();
      return;
    }

    openCode(code);
  }

  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-act="simulate-scan"]');
    if (!el) return;
    e.preventDefault();
    held = el;
    if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    openChooser(el);
  });

  document.addEventListener('pointermove', e => {
    if (!held) return;
    armAt(e.clientX, e.clientY);
  });

  document.addEventListener('pointerup', () => {
    if (!held) return;
    const code = armed ? armed.dataset.code : null;
    closeChooser();
    held = null;
    if (code) scanned(code);
  });

  /* Released outside the window, or interrupted: nothing was scanned. */
  document.addEventListener('pointercancel', () => {
    if (!held) return;
    closeChooser();
    held = null;
  });


  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const fn = actions[el.dataset.act];
    if (fn) fn(el);
  });

  /* Enter commits a manual entry — a real scanner emits a newline,
     so the same key path serves both typing and scanning. */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('discardModal').classList.contains('open')) {
      closeDiscard();
      return;
    }
    if (e.key !== 'Enter') return;
    const f = e.target.dataset && e.target.dataset.field;
    if (f === 'scan-code')  { e.preventDefault(); actions['scan-manual'](); }
    if (f === 'move-code')  { e.preventDefault(); actions['move-manual'](); }
    if (f === 'alloc-code') { e.preventDefault(); actions['alloc-manual'](); }
  });

  document.addEventListener('input', e => {
    const f = e.target.dataset && e.target.dataset.field;
    if (f === 'qty.used')    syncFromUsed(e.target.value);
    if (f === 'qty.new')     syncFromNew(e.target.value);
    if (f === 'qty.current') setCorrection(e.target.value);
  });


  render();
})();
