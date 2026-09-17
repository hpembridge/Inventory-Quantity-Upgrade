/* ============================================================
   Catalog property filters
   ------------------------------------------------------------
   Google Sheets-style column filters, driven by the catalog's own
   properties: one filter per property, and the list inside it is
   always the distinct values that property currently holds — never
   a hardcoded list. Add a property to the catalog and it gets a
   filter for free; nothing here names "Vendor" or "Color" directly.

   Counts inside each list are cross-filtered: opening the Color
   filter shows how many items would match each color if every
   OTHER active filter (and the name search) stayed as it is. That
   is what makes picking a value useful instead of picking blind.

   Prototype-only: HTML is real markup (the three <template>s below),
   cloned once per property / per value. Angular: FilterBar becomes
   *ngFor over properties; each FilterMenu owns its own popover and
   its own list; the chip row is a sibling reading the same filter
   state. The filtering itself (matchesFilters) is exactly the
   predicate a real list would apply, whether client-side or as a
   query.
   ============================================================ */
(function (global) {

  // Kinds worth a distinct-value list. 'number' (a swatch number) is
  // effectively a unique id per item — a checklist of 800 numbers
  // helps no one, so it is left to the name/number search instead.
  const FILTERABLE_KINDS = ['select', 'text', 'boolean', 'location'];

  function boolLabel(v) { return v ? 'Yes' : 'No'; }

  function CatalogFilters(opts) {
    const properties = (opts.properties || []).filter(p => FILTERABLE_KINDS.includes(p.kind));
    const items = opts.items;
    const barEl = opts.barEl;
    const chipsEl = opts.chipsEl;
    const onChange = opts.onChange || function () {};
    const extraPredicate = opts.extraPredicate || function () { return true; };

    const btnTemplate    = document.getElementById('filterButtonTemplate');
    const optionTemplate = document.getElementById('filterOptionTemplate');
    const chipTemplate   = document.getElementById('filterChipTemplate');

    // filters: { propId => Set(valueString) }. An empty or absent set
    // means "no restriction from this property."
    const filters = {};
    properties.forEach(p => { filters[p.id] = new Set(); });

    let openMenu = null;

    function rawValue(item, prop) {
      const v = (item.props || {})[prop.id];
      if (prop.kind === 'boolean') return boolLabel(!!v);
      return (v === null || v === undefined || String(v).trim() === '') ? '' : String(v);
    }

    /* An item matches when every property with an active filter
       includes that item's value — properties combine with AND,
       values within one property combine with OR (checking two
       colors means "either color," not "both"). */
    function matchesFilters(item, excludingId) {
      return properties.every(p => {
        if (p.id === excludingId) return true;
        const set = filters[p.id];
        if (!set || set.size === 0) return true;
        return set.has(rawValue(item, p));
      });
    }

    function filteredItems() {
      return items.filter(it => matchesFilters(it, null) && extraPredicate(it));
    }

    /* Distinct values for one property, counted against everything
       EXCEPT that property's own filter — so choosing a value never
       makes its own count vanish. */
    function distinctValuesFor(prop) {
      const counts = new Map();
      items.forEach(it => {
        if (!matchesFilters(it, prop.id) || !extraPredicate(it)) return;
        const v = rawValue(it, prop);
        counts.set(v, (counts.get(v) || 0) + 1);
      });
      return Array.from(counts.entries())
        .sort((a, b) => {
          if (a[0] === '') return 1;
          if (b[0] === '') return -1;
          return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
        });
    }

    function activeCount(propId) { return filters[propId].size; }

    function closeMenu() {
      if (!openMenu) return;
      openMenu.el.classList.remove('is-open');
      openMenu.popover.hidden = true;
      openMenu = null;
    }

    function renderList(prop, menuEl, popoverEl, listEl, searchValue) {
      const q = (searchValue || '').trim().toLowerCase();
      const values = distinctValuesFor(prop).filter(([v]) =>
        !q || (v === '' ? 'blank'.includes(q) : v.toLowerCase().includes(q)));

      listEl.replaceChildren();

      if (values.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'filter-popover-empty';
        empty.textContent = 'No values match.';
        listEl.appendChild(empty);
        return;
      }

      values.forEach(([value, count]) => {
        const row = optionTemplate.content.firstElementChild.cloneNode(true);
        const checkbox = row.querySelector('[data-filter-checkbox]');
        const label    = row.querySelector('[data-filter-option-label]');
        const countEl  = row.querySelector('[data-filter-option-count]');

        checkbox.checked = filters[prop.id].has(value);
        label.textContent = value === '' ? '(Blank)' : value;
        label.classList.toggle('is-blank', value === '');
        countEl.textContent = count;
        row.classList.toggle('is-zero', count === 0 && !checkbox.checked);

        checkbox.addEventListener('change', () => {
          if (checkbox.checked) filters[prop.id].add(value);
          else filters[prop.id].delete(value);
          refreshButton(prop, menuEl);
          renderChips();
          onChange(filteredItems());
          // Re-render this same list so counts stay honest against
          // the filter that was just changed.
          renderList(prop, menuEl, popoverEl, listEl, searchValue);
        });

        listEl.appendChild(row);
      });
    }

    function refreshButton(prop, menuEl) {
      const btn = menuEl.querySelector('[data-filter-toggle]');
      const countBadge = btn.querySelector('[data-filter-count]');
      const n = activeCount(prop.id);
      countBadge.hidden = n === 0;
      countBadge.textContent = n;
      btn.classList.toggle('is-active', n > 0);
    }

    function buildMenu(prop) {
      const menuEl = btnTemplate.content.firstElementChild.cloneNode(true);
      const btn      = menuEl.querySelector('[data-filter-toggle]');
      const popover  = menuEl.querySelector('[data-filter-popover]');
      const listEl   = menuEl.querySelector('[data-filter-list]');
      const searchEl = menuEl.querySelector('[data-filter-search]');
      const allBtn   = menuEl.querySelector('[data-filter-all]');
      const noneBtn  = menuEl.querySelector('[data-filter-none]');

      btn.querySelector('[data-filter-label]').textContent = prop.label;
      searchEl.placeholder = `Search ${prop.label.toLowerCase()}`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menuEl.classList.contains('is-open');
        closeMenu();
        if (isOpen) return;
        menuEl.classList.add('is-open');
        popover.hidden = false;
        openMenu = { el: menuEl, popover };
        searchEl.value = '';
        renderList(prop, menuEl, popover, listEl, '');
        searchEl.focus();
      });

      searchEl.addEventListener('input', () => renderList(prop, menuEl, popover, listEl, searchEl.value));
      popover.addEventListener('click', (e) => e.stopPropagation());

      allBtn.addEventListener('click', () => {
        distinctValuesFor(prop).forEach(([v]) => filters[prop.id].add(v));
        refreshButton(prop, menuEl);
        renderChips();
        onChange(filteredItems());
        renderList(prop, menuEl, popover, listEl, searchEl.value);
      });
      noneBtn.addEventListener('click', () => {
        filters[prop.id].clear();
        refreshButton(prop, menuEl);
        renderChips();
        onChange(filteredItems());
        renderList(prop, menuEl, popover, listEl, searchEl.value);
      });

      refreshButton(prop, menuEl);
      return menuEl;
    }

    function renderChips() {
      if (!chipsEl) return;
      chipsEl.replaceChildren();
      let any = false;

      properties.forEach(prop => {
        filters[prop.id].forEach(value => {
          any = true;
          const chip = chipTemplate.content.firstElementChild.cloneNode(true);
          chip.querySelector('[data-chip-label]').textContent = prop.label + ':';
          chip.querySelector('[data-chip-value]').textContent = value === '' ? '(Blank)' : value;
          chip.querySelector('[data-chip-remove]').addEventListener('click', () => {
            filters[prop.id].delete(value);
            const menuEl = barEl.children[properties.indexOf(prop)];
            if (menuEl) refreshButton(prop, menuEl);
            renderChips();
            onChange(filteredItems());
          });
          chipsEl.appendChild(chip);
        });
      });

      if (any) {
        const clearAll = document.createElement('button');
        clearAll.type = 'button';
        clearAll.className = 'filter-link';
        clearAll.textContent = 'Clear all filters';
        clearAll.addEventListener('click', () => {
          properties.forEach(p => filters[p.id].clear());
          barEl.querySelectorAll('.filter-menu').forEach((menuEl, i) => refreshButton(properties[i], menuEl));
          renderChips();
          onChange(filteredItems());
        });
        chipsEl.appendChild(clearAll);
      }
      chipsEl.hidden = !any;
    }

    barEl.replaceChildren();
    properties.forEach(prop => barEl.appendChild(buildMenu(prop)));
    renderChips();

    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

    return {
      getFilteredItems: filteredItems,
      /* Called when something outside this component (the name
         search box) changes what counts as "in view," so open
         popovers and chip counts stay honest. */
      refresh() {
        renderChips();
        if (openMenu) document.dispatchEvent(new Event('click'));
      }
    };
  }

  global.CatalogFilters = { init: CatalogFilters };

})(window);
