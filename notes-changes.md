# User Stories

Entry point is **Inventory** in the left rail. It opens the libraries page.

Terms: a **library** is a collection of catalogs (Materials, IT, Shipping). A
**catalog** is a collection of items that share one set of properties and one
set of unit types (Bookcloth, Endsheet, Board). An **item** is one thing you
stock — one vendor, product line, family and color. A **unit type** is a named
way that item is held (Rolls, Swatches, Miscuts). A **measurement type** is the
*shape* behind a unit type — roll, sheet or piece — and it decides which fields
a unit records. A **unit** is one physical thing on a shelf: a roll, a stack of
sheets, a count of pieces.

Two scopes run through the whole tool and should never be confused:
**your view** (which libraries are on your tabs — per user, non-destructive) and
**the data** (libraries, catalogs, items, units — shared by everyone).

---

## 1. Libraries page — your view

| Control | Intended action |
|---|---|
| **Library tab** | Switches to that library. The panel below is welded to the active tab so the two read as one folder. |
| **× on a tab** | Takes that library off *your* tabs. Nothing is deleted and no one else is affected. Disabled on the last open tab — the page always shows a library. |
| **+ (tab strip)** | Opens the library picker. |
| **Picker — search field** | Narrows the list as you type. Focus lands here on open, so the picker is typeable immediately. |
| **Picker — option** | Adds that library to your tabs and switches to it. Options already open are marked *In your view*. |
| **Picker — Create "<name>"** | Appears when the typed name matches nothing. Creates a new library under that name and opens it. |
| **Picker — ↓ / ↑** | ↓ from the field enters the list, then walks it. ↑ walks back and returns to the field from the top, so typing is always one key away. |
| **Picker — Enter / Tab** | Takes the focused option. Tab is only intercepted while an option has focus, so it still leaves the picker from the field. |
| **Picker — Escape / click outside** | Closes without changing your view. |

**Persistence:** which libraries are open, and which one is active, are saved
per user. Coming back to the page restores the tabs you left.

---

## 2. Libraries page — the library itself

| Control | Intended action |
|---|---|
| **Pencil (title row)** | Renames in place: the heading becomes a field with save and cancel beside it, the same swap the item page uses for a job number. The row holds its height, so nothing below shifts. |
| **Rename — Enter / check** | Commits the name. Empty is rejected — the field marks itself and stays open. |
| **Rename — Escape / ×** | Leaves the name as it was. |
| **Trash (title row)** | Opens a confirmation modal. Disabled when only one library exists. |
| **Confirm modal — Delete** | Deletes the library **and its catalogs, for everyone**. The body states the catalog count, and points to the tab × as the way to just take it off your own view. |
| **Confirm modal — Cancel / × / Escape / overlay** | Closes, nothing deleted. |
| **Add Catalog** | Creates a catalog in this library. Needs a name before it appears in the list. |
| **Catalog row** | Opens the catalog's item list. The whole row is the target. |
| **Pencil (catalog row)** | Opens that catalog's settings. |
| **Count badge** | Read-only. How many items the catalog holds. |

---

## 3. Catalog page — the item list

| Control | Intended action |
|---|---|
| **Back to <library>** | Returns to the libraries page with that library active. |
| **Catalog Settings** | Opens settings for this catalog. |
| **Unit type tabs** | Switches which unit type the table reports on. Every tab shows the same five columns; only the measure in the headers changes, because a roll is counted in yards and a piece is not counted in anything. |
| **Search** | Narrows by item name or swatch number, live. Acts on the whole list, so it sits on the page rather than on the table's surface. A count appears once it is filtering; an empty result says so in the table. |
| **Column header** | Sorts by that column, ascending then descending. The caret shows direction; unsorted columns show the resting sort affordance so it is clear they can be clicked. Blanks sort to the bottom in both directions — an unknown is not a small number. |
| **Item name** | Opens the item page. |
| **Available cell** | Read-only, but flagged: amber when the item is running low, red when it is oversold. Both carry a tooltip saying which. |

Adding an item belongs here — see §7.

---

## 4. Item page

| Control | Intended action |
|---|---|
| **Back to <catalog>** | Returns to the item list. |
| **Pencil (item header)** | Edits the item's own details — the property values that name it. |
| **Property chips** | Read-only display of this item's property values. |
| **Unit type tabs** | Switches which unit type is on screen. Each has its own rollup and its own table, because their columns differ. |
| **Rollup tiles** | On Order / In-House / Allocated / Available for this unit type. Identical by default — colour is never decoration here. It appears only on Available, amber when low and red when oversold, each with an icon and a tooltip. |
| **Add <form>** | Adds a unit of this type — a roll, a sheet stack, a count of pieces. |
| **Job cell — +** | Allocates that unit to a job. Opens a six-digit field in place. |
| **Job cell — pencil** | Changes the job the unit is allocated to. |
| **Job field — Enter / check** | Commits. Non-six-digit input is refused in place with the reason, and the field stays open. Typing is digits-only and capped at six. |
| **Job field — Escape / ×** | Leaves the allocation as it was. |
| **Job cell — ×** | Releases the unit from its job. Allocated and Available follow immediately. |
| **Print** | Prints that unit's label. |
| **Switching tabs mid-edit** | Abandons an open job field, so it never reappears against a different unit type. |

---

## 5. Catalog settings

Everything on this page is a working copy. Nothing is committed until **Save
Changes**, and the button is disabled until something actually changes.

| Control | Intended action |
|---|---|
| **Catalog Title** | The catalog's name, edited directly as a labeled field rather than a heading with an edit affordance — this is the page where naming happens. Renaming here renames it on the item list and in its library. |
| **Save Changes** | Commits the whole page — title, properties, unit types, naming. Confirms in place, then returns to rest. |
| **Cancel** | Returns to the item list. Nothing committed is lost, because nothing was committed. |

### 5a. Catalog properties

Properties are the fields every item in this catalog carries.

| Control | Intended action |
|---|---|
| **Global chips** (Vendor, Default Location, Product Line, Family, Color) | Present on every catalog and not removable — they are what the rest of Platinum joins on. |
| **Created chips** | Properties this catalog added. Each carries the icon of its type: True/False → toggle, Dropdown → diamond, Measurement → square, Number → hashtag, Description → text. |
| **× on a chip** | Removes that property from the catalog. It should say what goes with it — values recorded on existing items are lost. |
| **Add Catalog Property** | Creates a property: name, type, and for a dropdown, its options. |

### 5b. Units

| Control | Intended action |
|---|---|
| **Unit type row** | Read-only summary — name, stock form, the fields a unit of this type records, and a worked example. Clicking the row is a shortcut to Edit. |
| **Pencil** | Opens the unit type in the flyout. |
| **Trash** | Asks in place: the row becomes a confirmation naming the unit type and how many recorded units go with it. Disabled on the last unit type — a catalog needs at least one way to hold stock. |
| **Row confirm — Delete / Cancel / Escape** | Deletes the type from the working copy, or backs out. |
| **Add Unit Type** | Opens the flyout empty, defaulted to a piece. |

**Flyout** (same panel recipe as the bindery calculator's Edit Job Details):

| Control | Intended action |
|---|---|
| **Unit type name** | What this collection is called — "Rolls", "Miscuts", "Swatches". Left blank, it falls back to the stock form's default name. |
| **Stock form** | Roll, Sheet or Piece. Switching swaps the field set below, and renames the type if it still carries the old default name. |
| **Width unit / Length unit** (roll) | The two units a roll records — 54 **in** wide, 50 **yd** long. Stock is the length, not a headcount of rolls. |
| **Width unit / Height unit** (sheet) | The two units a sheet records, separately, because 8.5 in × 11 in and 40 in × 60 in are both real. Stock is the count. |
| *(piece)* | No units. Stock is the count. |
| **Save Unit Type** | Writes the draft back into the page's working config. Still not committed until Save Changes. |
| **Cancel / × / Escape / overlay** | Discards the draft. |

### 5c. Item naming

| Control | Intended action |
|---|---|
| **Segment chips** | The template item names are built from, in order — Vendor-Product Line-Family-Color reads as *Majilite-Majilite-Baby Ostrich-Cobalt Blue*. |
| **× on a segment** | Drops that segment from the template. |
| **Add Naming Segment** | Adds a property to the end of the template. Only properties this catalog carries can be segments. |

---

## 6. Rules that hold everywhere

| # | Rule |
|---|---|
| R1 | A catalog needs at least one unit type. The last one's delete is disabled and says why. |
| R2 | A library needs at least one catalog — deleting the library is how you remove the last one. |
| R3 | The page always shows a library. The last open tab's × is disabled. |
| R4 | Hiding is per user and reversible; deleting is for everyone and asks first. Nothing in the UI should let those two be confused. |
| R5 | Stock state is one thing only: amber = running low (available at or under 20% of in-house), red = oversold (available below zero). Colour never means anything else. |
| R6 | Every destructive action names what goes with it before it happens — the catalogs in a library, the units in a unit type, the recorded values behind a property. |
| R7 | A job number is exactly six digits. |
| R8 | Item names are generated from the naming template, never typed. |

---
## 7. Editable unit rows (item page)

Every value in a unit row is now a field rather than static text with an edit affordance bolted on.

| Behaviour | Detail |
|---|---|
| **At rest** | A field reads exactly as the old static cell did — no border, no fill, column alignment kept. Measurements show their settled form (`1.50`, not `1.5`). |
| **Hover** | The row is the unit of discovery: hovering anywhere in a row outlines every field in it at once, so the editable targets are findable from one place instead of cell by cell. The field under the pointer takes the stronger edge, to say which one a click lands on. |
| **Focus** | White fill, focus ring, editable. The contents select on focus — one click and you can type over the value. A second click, or a drag, positions the caret normally. |
| **Empty** | Placeholder text in the field's own shape (`000000` for Job Number, `0.00`, `0`, `Add location`) in `--text-tertiary` — this replaces the old plus button. |
| **Size** | Two fields reading as one value: width `×` height. |
| **Input** | Numeric fields accept digits only (decimals take a single point, two places); no steppers. Characters that don't belong simply never land. |
| **Zero** | Zero is a real quantity for Yardage and Count — it says the unit is used up, not that the entry is wrong. Dimensions (Width, Height) still have to be greater than zero: a roll 0 inches wide is not a roll. |
| **Clearing** | Emptying a number is not an entry, so it reverts silently to what it held. Emptying Job Number is a real instruction: it releases the allocation. |
| **Commit** | Blur or Enter. Escape reverts. No save/cancel buttons. |
| **Reject** | An invalid value is rejected outright — the field snaps back to the value it held, the error tint flashes to point at which field refused, and a toast says why. |
| **Job Number** | Six digits, or empty — emptying the field releases the allocation (the old × action). |
| **Rollup** | A commit rebuilds the rollup and the footer in place — neither holds a field — so the figures follow the rows without the table being re-rendered underneath the cursor. That's what makes it possible to tab through a row field by field. |

New shared component: `components/toast/` — top-right, error/success/info, icon plus message (never colour alone), auto-dismisses, `window.toast(message, kind)`.

| # | Rule |
|---|---|
| R9 | A rejected value is discarded, never half-accepted: the field returns to its previous value and the toast names the reason. |
| R10 | Counts and measurements must be greater than zero. |

## 8. Depleted units

A quantity of zero is depletion, not an error. The quantity column is the one that says how much is on hand — Yardage for a roll, Count for anything else.

| Behaviour | Detail |
|---|---|
| **Dim** | A depleted unit's row is dimmed: still readable, still editable, plainly not part of what is on hand. The zero in the quantity column is the fact; the dimming is reinforcement. |
| **Hidden by default** | Depleted units are off screen unless asked for. **Show depleted** — a switch inline with the back link, above the first card — brings them back, and defaults to off. |
| **Leaving, not vanishing** | Zeroing a quantity dims the row where it stands and only takes it off screen once the cursor has left it, so a zero entered by mistake can be corrected without the row disappearing mid-edit. A toast says where it went. |
| **Footer** | Says what is on screen and what is being kept off it — "2 units · 1 depleted hidden". |
| **Empty states** | Two different sentences: nothing here at all, versus nothing left that is not used up (which points at the switch). |

New shared component: `components/switch/` — a labelled on/off control over a real checkbox, so it is keyboard- and screen-reader-operable for free.

## 9. Adding a unit

**Add Roll / Add Sheet / Add Swatch** appends a row to the bottom of the table and puts the cursor in its first field. A new unit is entered in the same place, and the same way, as an existing one is corrected — no modal, no separate form. An un-entered quantity is not depletion, so the new row stays put while it is being filled.

### Default values

Every measured field a unit of a given stock form records can be given a default in **Edit Unit Type → Default Values**. Those values are filled in when a new unit of that type is added, so adding one is a confirmation rather than a transcription — most rolls of a cloth come 54 inches wide.

| Behaviour | Detail |
|---|---|
| **Which fields** | Whatever the stock form measures: Width / Yardage for a roll, Width / Height / Count for a sheet, Count for a piece. Changing the stock form swaps the field set. |
| **No default** | Job Number, because an allocation belongs to one unit and not to the form; and Location, which is generated when the unit is created. |
| **Blank** | A field with no default starts empty on a new row, showing its placeholder. |
| **Stored** | On `unitType.defaults`, saved with the rest of the catalog config on Save Changes. A dimension of zero is not a default and is dropped. |

| # | Rule |
|---|---|
| R11 | Zero is a quantity, never an error. Dimensions must still be greater than zero. |
| R12 | A row is only taken off screen when the cursor is not in it. |
| R13 | A default belongs to a stock form's measured fields. Job Number and Location never have one. |

## 10. Library Settings

The pencil beside a library's name opens a **Library Settings** flyout — the same `.flyout-overlay` / `.flyout-panel` recipe as Edit Unit Type — instead of the old in-place rename. It edits a draft, so Cancel, the overlay and Esc all discard cleanly.

| Field | Detail |
|---|---|
| **Library name** | Renames the library everywhere: the tab, the panel title, the picker. An empty name is refused (it would be unfindable in the picker) — the field takes the error tint and a toast says so. |
| **Stock forms** | Which of Roll / Piece / Sheet stock can take in this library, as switches. "The physical forms stock takes in this library. Catalog unit types can only use forms listed here." |

| # | Rule |
|---|---|
| R14 | A library needs at least one stock form. The last one on cannot be turned off, and says why. |
| R15 | A stock form already in use by a unit type stays listed in that type's Stock Form select even if the library has since dropped it — hiding it would silently rewrite the unit type on the next save. |

Deleting a library is unchanged: still the trash beside the pencil, still confirmed, still says what is lost.

**Data.** `library.stockForms` joins `library.name` as an editable setting, and both now persist (`iqu.libraries`) so the catalog settings page can read them — `libraryOfCatalog()` finds a catalog's library, `stockFormsOf()` reads its forms and falls back to all three. Catalogs themselves stay in the seed data. The seeds are realistic: the IT Library and Sample Room hold pieces only, Foils & Films rolls and sheets.

## 11. Location decides On Order vs In-House

A unit with no location has not been put away yet: the stock is recorded but not findable, so it reads as **On Order**. Giving it a location is what brings it into stock.

| Figure | Made of |
|---|---|
| **On Order** | Units of this type with no location. |
| **In-House** | Units with a location. |
| **Allocated** | Units with a job number **and** a location — only stock in hand can be allocated against. |
| **Available** | In-House − Allocated. |

| # | Rule |
|---|---|
| R16 | A unit's quantity is counted once: On Order until it has a location, In-House after. |
| R17 | An unplaced unit is never Allocated, so Available can't go negative over stock that hasn't arrived. |

This is why a newly added unit — which starts with no location, since locations are generated on creation — shows up as On Order until it is placed.
