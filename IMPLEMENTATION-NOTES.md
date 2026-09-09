# Implementation notes

A map for the Angular team. Every UI element in this prototype has its
HTML in a `.html` file and its styling in `inventory.css`. JavaScript
moves values into that markup and toggles state classes — it does not
build markup.

## How to read the prototype

Repeated structures are `<template>` elements at the bottom of each
page. The page's JavaScript clones one per row and fills its text.
Every template is an `@for` waiting to happen:

```html
<!-- catalog-dies.html -->
<template id="dieRowTemplate">
  <tr>
    <td class="left col-id strong" data-cell="id"></td>
    ...
  </tr>
</template>
```

```js
const row = rowTemplate.content.firstElementChild.cloneNode(true);
row.querySelector('[data-cell="id"]').textContent = die.props['d-number'];
```

`data-*` attributes are hooks for behaviour and for filling values.
`class` attributes are for styling. They are deliberately not the same
set, so a class can be renamed without breaking behaviour.

## Pages

| Page | What it is |
|---|---|
| `inventory.html` | Libraries, the per-person tab view, and the catalogs inside one |
| `catalog.html` | A measured catalog's items — one column per unit type |
| `catalog-dies.html` | A single-unit catalog — the item IS the record |
| `item.html` | One item's units, per unit type |
| `catalog-settings.html` | The catalog's settings and the unit type builder |

## Components

| Component | HTML | CSS | JS |
|---|---|---|---|
| **LibraryTabs** | `inventory.html` → `<!-- Library tabs -->` + `#libTabTemplate` | `.lib-tabs`, `.lib-tab` | `inventory.html` script → Tabs |
| **LibraryPanel** | `inventory.html` → `<!-- Library panel -->` + `#catalogRowTemplate` | `.lib-panel`, `.catalog-list`, `.catalog-row` | → The active library |
| **AddLibraryPanel** | `inventory.html` → `<!-- Add a Library -->` + `#libOptionTemplate` | `.lib-picker-list`, `.lib-option` | → Add a Library |
| **LibrarySettingsPanel** | `inventory.html` → `<!-- Library Settings -->` | `flyout.css`, `.field` | → Library Settings |
| **ConfirmModal** | `inventory.html` → `<!-- Delete confirmation -->` | `confirm-modal.css` | → Delete |
| **CatalogTable** | `catalog.html` → `<!-- Items table -->` + `#itemRowTemplate`, `#unitCellTemplate`, `#unitColumnHeaderTemplate` | `table.data`, `.col-num`, `.pill` | `catalog.html` script |
| **DiesTable** | `catalog-dies.html` → `<!-- Dies table -->` + `#dieRowTemplate` | `table.data`, `.cell-field`, `.col-id` | `catalog-dies.html` script |
| **CatalogRollup** | `catalog-dies.html` → `<!-- Catalog rollup -->` | `.unit-rollup.is-standalone`, `.rollup-stat` | → Rollup |
| **ItemHeader** | `item.html` → `<!-- Item header -->` + `#chipTemplate` | `.item-header`, `.chip` | `item.html` script → Item header |
| **UnitTypeTabs** | `item.html` → `<!-- Unit type tabs -->` + `#tabTemplate` | `.tab-row`, `.tab-btn` | → Tabs |
| **UnitTable** | `item.html` → `<!-- Unit type block -->` + `#unitRowTemplate`, `#fieldCellTemplate`, `#columnHeaderTemplate` | `.unit-type-block`, `.cell-field` | → Rows, Editing |
| **UnitRollup** | `item.html` → inside `<!-- Unit type block -->` | `.unit-rollup`, `.rollup-stat` | → Rollup |
| **UnitTypeList** | `catalog-settings.html` → `<!-- Units -->` + `#unitTypeRowTemplate`, `#unitTypeConfirmTemplate` | `.unit-config-list`, `.unit-config-row` | `catalog-settings.html` script |
| **UnitTypeBuilder** | `catalog-settings.html` → `<!-- Unit Type Builder -->` + `#builderFieldTemplate` | `.seg`, `.builder-row`, `.field-group` | → Builder |
| **ItemEditor** | the `<!-- Item Editor -->` block + four `#field*Template`s, in each page that uses it | `.field`, `.field-list`, `.generated-name` | `components/item-editor/item-editor.js` |
| **ActivityLog** | the `<!-- Activity Log -->` block + `#timelineRowTemplate`, in each page that uses it | `.activity-timeline`, `.timeline-row` | `components/activity-log/activity-log.js` |
| **Toast** | created by its own script | `components/toast/toast.css` | `components/toast/toast.js` |

**ItemEditor and ActivityLog are shared.** Their markup is repeated in
each page that opens them, because there is no build step to include a
partial — in Angular they are one component each, used in three places.
Their JavaScript reads the page's markup and never creates any.

## Shared CSS

`inventory.css` is one file, sectioned by comment banners. The pieces
worth knowing:

| Class | What it is |
|---|---|
| `.page-inner` | The one width wrapper — a workspace-width column, centred |
| `.page-card` | The same width with a surface behind it; `.is-flush` drops its padding |
| `.page-stack` | One gap between the parts of a page, replacing five different margins |
| `.section` / `.section-label` / `.section-help` | A titled block inside a card |
| `.cell-field` | An input that rests as plain text in a table cell and outlines on row hover |
| `.add-row` | The full-width add affordance, above the thing it adds to |
| `.seg` / `.seg-option` | Two named options, one lit — for a choice between two things |
| `.check-row` | A checkbox that carries its own explanation |
| `.rollup-stat` | One of the four figure tiles; `.is-low` / `.is-over` are its states |
| `.btn-pill`, `.icon-btn`, `.btn-ghost` | The button set |
| `.flyout-overlay` / `.flyout-panel` | The aside, in `components/flyout/flyout.css` |

Everything added during the handoff refactor is under the
`HANDOFF ADDITIONS` banner at the foot of the file.

## What is simulated

These exist to demonstrate an interaction and would be real work in the
application:

- **All data.** `inventory-data.js` is mock content plus the arithmetic
  behind the four figures. Nothing persists; every page load starts from
  the seed.
- **Sorting and searching** are done in the page. Both would be server
  concerns at real volumes.
- **Adding a unit** invents an id and pushes onto an array.
- **Catalog Properties and Item Naming** on the settings page are static
  chips. Removing one removes the chip and nothing else.
- **Add Catalog** and **Create Library** are affordances with no
  behaviour behind them.
- **The unit type preset list** is in memory, so a type saved as a preset
  is a preset until the page reloads.
- **Job numbers** are validated as six digits in the page. Real
  validation belongs against the job system.

## What would become Angular state

| Prototype | Angular |
|---|---|
| `activeId` on the item page and inventory page | a selected-index / route param |
| `showDepleted` | a checkbox bound to a signal |
| `sort = { key, dir }` | a sort state on the table component |
| `confirmingId` in the unit type list | a per-row `isConfirming` |
| `draft` in the builder and the item editor | a reactive form, with Cancel discarding it |
| `.cell-field` commit on blur / Enter / Escape | `(blur)`, `(keydown.enter)`, `(keydown.escape)` |
| `openIds` (which libraries are in view) | user preference, stored per user |

## Behaviour worth keeping

A few interactions carry design decisions rather than convenience, and
are described in `notes-changes.md`:

- A field commits on blur or Enter and reverts on Escape. There are no
  save buttons in a table.
- An invalid entry is rejected outright: the field returns to what it
  held, a toast says why, and the tint flashes to point at the field.
- Emptying an allocation is a real instruction — release the unit — so
  it is the one text field whose blank is not treated as a slip.
- Colour appears only on a figure that needs attention, never as
  decoration, and never alone: every state also carries an icon or a
  tooltip.

---

# Handheld scanner

A second prototype, in `scanner.html` / `scanner.css` / `scanner.js` /
`scanner-data.js`. It shares the design tokens and the desktop
prototype's conventions but none of its files, so neither can break the
other. Reached from `index.html` → Handheld Scanner.

Everything inside `.device-screen` is the application. The frame around
it, the title above it, the trigger and the label list beside it are
desktop scaffolding so the prototype can be shown on a laptop. Delete
`.bench*`, `.device*` and the Scan chooser block and the app is
unchanged.

The prototype controls sit **outside** the device deliberately: a
handheld has a hardware trigger and a world full of labels, and neither
is a thing on the screen. Putting the label list on the screen made it
look like an app feature.

## Screens

One `<section class="screen">` per view; exactly one carries
`.is-active`. In Angular each is a routed component, and `state.back`
is the router's history rather than an array.

| Screen | `data-screen` | What it is |
|---|---|---|
| Scan | `scan` | The home screen. Trigger, manual entry, this shift's scans |
| Unit | `unit` | What a unit barcode resolves to: details, then actions |
| Adjust Quantity | `quantity` | Current / Amount used / New quantity |
| Move | `move` | Scan the location the unit is going to |
| Allocate | `allocate` | Scan a job **or** a person, decided by the unit type |
| Location | `location` | Location details, the units it holds, its actions |
| History | `history` | Serves a unit's log and a location's — one component |
| Confirmation | `confirm` | What was saved, and the way to the next scan |

## Components

| Component | HTML | CSS | JS |
|---|---|---|---|
| **DeviceShell** | `<!-- Bench -->` + `.device` | `.bench*`, `.device*` | none — scaffolding only |
| **ScanTarget** | `<!-- Screen: Scan -->` + every scan screen | `.scan-target`, `.is-listening`, `.is-reading` | the chooser's `pointerdown` |
| **ScanChooser** | `<!-- Prototype controls -->` + `#scanOptionTemplate` | `.scan-chooser*`, `.scan-option`, `.is-armed` | the Scan chooser block — **scaffolding, beside the device, not shipped** |
| **ManualEntry** | in each scan screen | `.manual-entry`, `.input` | `actions['*-manual']` |
| **AppBar** | top of every `.screen` | `.app-bar*` | `show()` / `back()` |
| **UnitDetail** | `<!-- Screen: Unit -->` + `#detailRowTemplate` | `.record`, `.detail-list`, `.qty-headline`, `.pill` | `renderUnitDetails()` |
| **ActionList** | Unit and Location screens | `.action-list`, `.action-item` | delegated `data-act` listener |
| **QuantityForm** | `<!-- Screen: Adjust Quantity -->` | `.linked-pair`, `.qty-input`, `.readout` | `syncFromUsed` / `syncFromNew` / `setCorrection` |
| **LocationDetail** | `<!-- Screen: Location -->` + `#unitRowTemplate` | `.log-list`, `.log-row` | `renderLocationUnits()` |
| **ActivityTimeline** | `<!-- Screen: History -->` + `#timelineRowTemplate` | `.timeline*` | `renderHistory()` |
| **RecentScans** | Scan screen + `#recentRowTemplate` | `.log-list`, `.log-row` | `renderRecent()` |
| **Toast** | `#toast` | `.toast` | `toast()` / `reject()` |
| **DiscardModal** | `<!-- Discard confirmation -->` | `components/confirm-modal/confirm-modal.css` + the `.device-screen .modal-overlay` override | `unsavedWork()` / `askDiscard()` / `leave()` |

Two binding attributes, and only two: `data-bind` writes an element's
text, `data-bind-class` writes its whole `class` attribute — used by the
status pill and the icons, and nothing else. In Angular they are `{{ }}`
and `[class]`.

The timeline is deliberately the **same shape** as the desktop unit
history (`components/activity-log`) and the job page's Scan History. It
is a copy here so the file stands alone; for handoff those are one
component, used in three places.

## Decisions worth keeping

- **One scan field, two kinds of label.** The operator does not know
  which kind of barcode they just pulled the trigger on, so the app does
  not ask. `ScannerData.resolve()` answers with a `kind` and the app
  routes on that. A job or badge scanned at the home screen is rejected
  by name — "that is a job barcode" — rather than "not found".
- **Adjust Quantity is absent on a single-unit record, not disabled.**
  A die has no counted quantity, so there is nothing for the action to
  act on. A greyed control invites a second tap that will never work.
- **Amount used and New quantity are two views of one number.** Filling
  either fills the other; the derived one is tinted (`.is-derived`) so
  the operator can see which figure the system worked out. Neither is
  primary — which one you have depends on whether you measured what you
  took or what is left.
- **Current quantity is read-only until asked for.** Correcting a count
  is a stocktake adjustment, not a record of use, and the two log
  differently. The unlock keeps the correction one deliberate tap away
  and keeps it out of the fast path.
- **Allocation never asks job-or-person.** The unit type already
  answered that (`allocateTo`), so the screen commits to one: its label,
  its scan help, its validation and its rejection all name the one kind
  it takes.
- **Release is an action, not an empty field.** On the desktop, emptying
  the allocation field is a real instruction because a field commits on
  blur. A handheld has no blur, so the instruction gets its own row.
- **The location screen shows only its name and what it holds.** Our
  barcodes are not semantic, so a kind ("Warehouse shelf"), a path
  ("Warehouse 3 › Aisle 1 › Bay A") and the raw barcode were all reading
  meaning into a string that does not carry it. The app bar names the
  location; the count moved onto the "What is here" header as a badge,
  where it describes the list rather than standing as a detail row of
  its own.
- **A row names who has the unit, not that somebody does.** "Allocated"
  is not actionable. "Job 487712" or "On press — Kluge 4" is — a number
  to look up, or a person to walk over to.
- **The back arrow asks before throwing an entry away.** It is the one
  way off Adjust Quantity, Move and Allocate that does not say what it
  costs — with a quantity typed and not saved it discarded silently, and
  forgetting to hit Save is the easy mistake. Cancel is *not* guarded:
  it is labelled, and discarding is what the operator asked for. The
  dialog is the desktop prototype's `confirm-modal`, so the two
  prototypes hand over one component; it is a div rather than a
  `<dialog>` only because a real dialog renders in the top layer and
  would cover the browser window instead of the device frame. **In the
  application it is a `<dialog>` opened with `showModal()`** — which
  brings focus trapping, Esc, and the Android back gesture for free.
- **Nothing is reachable except by scanning it.** Recent scans and
  "what is here" are a **record** of what was scanned, not a way into
  records that were not. Their rows are plain elements — no hover, no
  cursor, no focus stop, `.log-list` / `.log-row` — so the list reads as
  a log and behaves as one. A unit, job or location you have not scanned
  cannot be opened from anywhere in the app.
- **Every scan screen carries a typed way in.** A rubbed label is the
  commonest floor failure. Enter commits, because a real scanner emits a
  newline — the same key path serves scanning and typing.
- **Confirmation offers the next scan, not the way home.** The unit in
  hand is usually the last thing the operator needs from it.
- **Touch targets are 48px minimum, 64px for the action rows** — a
  gloved thumb, not a mouse. The token set has no touch-target token;
  flagged at the foot of `scanner.css`.

## What is simulated

- **All data.** `scanner-data.js` is sample records whose ids,
  locations and unit types match `inventory-data.js`. In memory; every
  reload starts from the seed.
- **Scanning.** Holding the trigger or the on-screen target lists, as
  pills beside the device, the labels the current screen could accept — every unit and
  location on the scan screen, locations on the move screen, job tickets
  or badges on the allocate screen. Drag onto one and release to scan
  it; release on nothing and nothing happens. **This whole mechanism is
  scaffolding**: a real handheld reads a label and hands the app a
  string, so in Angular the trigger is a hardware event and the sheet,
  the drag and the arming are not built. `.is-reading` on the target and
  `.is-held` on the trigger are the held-down feedback.
- **Job validation** is six digits, checked in the page. Real validation
  belongs against the job system.
- **Put a unit here** on the location screen only sends the operator to
  the scan screen; the put-away itself is the move flow.
- **Recent scans** are this page load's, not the shift's.
- **History entries** written by the prototype are dated "today".

## What would become Angular state

| Prototype | Angular |
|---|---|
| `state.screen` + `state.back` | the router and its history |
| `state.unit` / `state.location` | a resolved route param, or a scan service |
| `state.qty` in the quantity screen | a reactive form; Cancel discards it |
| `syncFromUsed` / `syncFromNew` | `valueChanges` on the two controls, each patching the other with `{ emitEvent: false }` |
| `state.qty.correcting` | a signal gating the correction control |
| `state.recent` | a scan-history service, per user and per shift |
| `.is-derived` | a class binding on the control the other one filled |
| `unsavedWork()` | `form.dirty`, and a `CanDeactivate` route guard |
