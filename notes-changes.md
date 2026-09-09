# Inventory — behavior specification

What the tool does, and why it does it that way. This describes intended
product behavior. For where a screen's markup and styles live, see
`IMPLEMENTATION-NOTES.md`.

Rules are numbered by section so they can be cited in review.

---

## 1. The model

Five concepts. Everything else follows from them.

| Concept | What it is |
|---|---|
| **Library** | A collection of catalogs. Exists for the whole company. |
| **Catalog** | A set of items that share properties and a naming template — Bookcloth, Laptops, Dies. |
| **Item** | One thing the company buys or holds: a specific cloth, a laptop model, a die. |
| **Unit type** | A way stock of an item is held — rolls, swatches, miscuts. Defined per catalog. |
| **Unit** | One physical instance: this roll, at this location, with this much left. |

The distinction that does the most work:

- A **property** varies between **items**. One cloth is Cobalt Blue, another is Copper.
- An **added field** varies between the **units of one item**. This roll is 54" wide, that one is 52".

Putting a value in the wrong one is the most common way a catalog goes
wrong. If every unit of an item shares the value, it is a property.

| # | Rule |
|---|---|
| M1 | A catalog decides its own properties, naming template and unit types. Nothing is global except the dimension list. |
| M2 | A unit belongs to exactly one item and one unit type. |
| M3 | Items are named from a template, never typed. Two people cannot name the same thing two ways. |

---

## 2. The four figures

Every unit type in every catalog reports the same four. A figure means
the same thing everywhere it appears.

| Figure | Made of |
|---|---|
| **On Order** | Quantity on units with no location — recorded, not yet findable. |
| **In-House** | Quantity on units that have a location. |
| **Allocated** | Quantity on located units committed to a job or a person. |
| **Available** | In-House − Allocated. |

**A location is what brings stock into the building.** A unit recorded
without one is on its way; giving it a location is the act of receiving
it. This is why a newly added unit reads as On Order until it is placed.

**Available is always derived, never stored.** No stored number can
contradict the other two.

**Only located stock can be allocated against.** Stock that has not
arrived is counted once, as On Order, so Available never goes negative
over a delivery that is still on a truck.

| # | Rule |
|---|---|
| F1 | The four figures are defined once and reported identically everywhere. |
| F2 | Every figure states its unit of measure. |
| F3 | Available is derived at read time. |
| F4 | Colour appears on a figure only when it needs attention — amber when running low, red when Allocated exceeds In-House — and never alone: each state also carries an icon or a tooltip. |
| F5 | The low-stock threshold is a reorder point set per catalog or per unit type. It is not a fixed fraction. |

---

## 3. Libraries

A library exists for the whole company. What differs per person is which
libraries they keep as tabs.

**Organise libraries by what things are, not by who uses them.** The tab
view already handles who sees what, so a Die library serves Print and
Bindery without either owning it. Splitting by department would mean the
same physical die existing in two catalogs with two locations and two
allocation states.

### Your view

| Behavior | Detail |
|---|---|
| **Tabs** | One per library in this person's view. The active tab is joined to the panel below it, so the two read as one folder. |
| **Dismiss** | The × takes a library off *this person's* tabs. Nothing is deleted and nobody else is affected. |
| **Last tab** | Cannot be dismissed. The page always shows a library. |
| **Add a Library** | Opens a panel listing every library in the company, with catalog counts, searchable. |
| **Option is a toggle** | Not in your view: adds it and switches to it. Already in your view: takes it back out. The mark reads *In your view* at rest and *Remove* on hover. |
| **Panel stays open** | Several libraries get added or dropped in one trip. |
| **Keyboard** | ↓ from the search field enters the list and walks it; ↑ walks back and returns to the field from the top. Escape closes and returns focus to the +. |
| **No match** | Offers to create a library under the typed name. |
| **Persistence** | Which libraries are open, and which is active, are remembered per user. |

### The library itself

| Behavior | Detail |
|---|---|
| **Rename** | Changes the tab, the panel title and the breadcrumb above every catalog inside it. |
| **Empty name** | Refused — a library with no name is unfindable in the picker. |
| **Delete** | Confirmed, and the confirmation names how many catalogs go with it and says the action cannot be undone. |
| **Last library** | Cannot be deleted. |

A library carries a name and its catalogs. It does not constrain what
its catalogs may contain: unit types are built from the same controlled
dimension list everywhere, so there is nothing for a library to gate.

| # | Rule |
|---|---|
| L1 | Hiding a library changes one person's view. Deleting one changes the company's data. The two are never the same control. |
| L2 | The last library in a view, and the last library in the company, are both protected, and both say why. |

---

## 4. Catalog page

One row per item. **One column per unit type**, each carrying that
type's Available figure.

A reader should be able to answer *is this item short of anything* in
one look, rather than by visiting four tabs and holding four numbers in
their head.

| Behavior | Detail |
|---|---|
| **Columns** | Swatch, Item Name, then one per unit type in the order the catalog defines them. Adding a unit type adds a column. |
| **Unit of measure** | In the column header. A catalog can hold a type counted in yards beside one counted in each, so a bare figure would be two different things. |
| **Only Available** | On Order, In-House and Allocated are how Available was arrived at, not what anyone acts on. They are on the item page, where the units they are summed from live. |
| **State** | Marks the figure, not the cell — a tinted cell would read as a column of its own. |
| **Sort** | Any column. First click ascending, clicking again reverses. Blanks sort to the bottom either way: an unknown is not a small number. |
| **Search** | Item name or swatch number, reporting how many of the total are showing. |
| **Open an item** | The whole row. The item name stays a real link so middle-click and open-in-new-tab work. |
| **Add Item** | Above the table, matching every other add affordance. |

| # | Rule |
|---|---|
| C1 | The list opens unsorted, in the order the catalog is kept in. |
| C2 | A caption states that the unit type columns are Available, because no column header can. |

---

## 5. Catalog configuration

Two levels of setting, and the difference matters:

- **Single-Unit Items** belongs to the **catalog**. It is a claim about what a row on the catalog page *is*.
- Everything in the **unit type builder** belongs to a **unit type**. It describes how one kind of stock is held.

### 5.1 Properties and naming

Properties are what an item records about itself. Each has a kind — text,
number, true/false, or a list — which decides how it is edited and how it
is shown.

The **naming template** is an ordered list of properties. An item's name
is those values joined. Editing a property that feeds the template
renames the item.

| # | Rule |
|---|---|
| P1 | Properties belong to the catalog, so they are added and removed in Catalog Settings. Adding one from inside a single item would hide that it lands on every item. |
| P2 | Properties with no value are skipped in the name rather than leaving empty separators. |

### 5.2 Single-Unit Items

**On when each item in this catalog IS one physical object** — a die, a
press plate. The item is not a catalog entry that has a die; it *is* the
die. Its name, its properties and its location all describe one thing.

An item cannot be one die and also hold 48 yards of itself, which is why
this is a catalog-level claim rather than a unit type setting.

| When on | Consequence |
|---|---|
| Unit types | Exactly one. More than one would be the item claiming to be two different objects. |
| That type | No quantity dimension and no added fields. |
| Allocation | Forced to User. The question a table of unique records answers is *who has it*, and a job number cannot answer that. |
| Item page | None. The catalog page carries the records and the rollup. |

| # | Rule |
|---|---|
| S1 | The setting cannot be turned on while the catalog has more than one unit type. Turning it on would have to discard the others, and a switch that silently deletes work is not a switch. The reason is stated on the control. |
| S2 | Turning it off restores the quantity and the previous allocation choice. |

### 5.3 Unit types

A unit type is **built**, not chosen from a fixed list. It is:

| Part | Detail |
|---|---|
| **Name** | What this collection is called — "Rolls", "Miscuts", "Sample Boards". |
| **Allocation** | Job or User (§5.4). |
| **Quantity** | A dimension, its unit of measure, and an optional default. This is the figure all four rollup tiles report. |
| **Added fields** | Any number, each a dimension, unit of measure and optional default. |

**Dimensions are a controlled list**: Length, Width, Height, Count. Each
carries the units it can be measured in — the linear three take in / ft /
yd / mm / cm / m, Count takes only *each*. Free text here would make two
catalogs incomparable: "Width" in one and "width" in another are two
columns that should have been one.

This one builder covers every shape of stock:

| Stock | Built as |
|---|---|
| A roll of cloth | Quantity **Length (yd)**, added field **Width (in)** |
| A stack of miscuts | Quantity **Count (ea)**, added fields **Width**, **Height** |
| Swatches | Quantity **Count (ea)** |
| Laptops | Quantity **Count (ea)** |
| A mounted sample board | Quantity **Count (ea)**, default **1** |
| A die | A single-unit catalog (§5.2) |

Stock that is never consumed needs no special case. One mounted board is
Count (ea) with a default of 1: in-house 1, allocated 1 when it is off
the wall, available 0.

**Added fields track variance between the units of one item** — roll
width occasionally varies across bookcloth rolls, so Width is a field on
Rolls rather than a property of the cloth. Each becomes a column on that
type's table.

**A dimension is used once per unit type.** A Width beside a Width is two
columns of the same measurement with nothing to tell them apart, and the
second is always a mistake — so a dimension already taken by the quantity
or another field is not offered. With four dimensions, a type can carry a
quantity and three fields; at that point Add Field is spent and says so.

| # | Rule |
|---|---|
| U1 | A dimension's units belong to the dimension. Changing a dimension pulls its unit of measure onto the new list rather than leaving an impossible pairing. |
| U7 | A dimension can be used once per unit type. Taking one for the quantity takes it off the fields, and releasing one gives it back. |
| U2 | A catalog needs at least one unit type. The last one cannot be deleted. |
| U3 | Deleting a unit type names it and states how many recorded units go with it. |
| U4 | Saving a unit type files its shape as a **preset**, keyed by name, offered to every other catalog. Choosing a preset copies the shape; later edits never reach back. |
| U5 | A preset carries the shape only, never a catalog's Single-Unit claim. |
| U6 | A unit type's summary states what a unit of it records and gives a worked example, using each field's own default where one is set. |

### 5.4 Allocation

**Job or User, set per unit type.** Rolls of cloth go out on jobs, sample
boards go out to people, and both can live in one catalog. Deciding it
per unit would put a question on every row that only ever has one answer,
and let two rows in one table mean different things by the same column.

| Setting | Column | A value is | Empty means |
|---|---|---|---|
| **Job** | Job Number | Six digits, validated | Unallocated |
| **User** | Allocated to | A name | Unallocated |

Presented as two named options, not an on/off switch: "Allocate to user:
off" does not read as "job".

**Changing what a unit type allocates to releases everything it holds.**
A job number is not a person's name under another heading, so the values
cannot carry over — reinterpreting them would turn job 487712 into a
person called "487712". The panel states how many units the change will
release before it happens, and nothing is released until the unit type is
saved: cancelling leaves the allocations alone. Each released unit
records the reason in its log.

| # | Rule |
|---|---|
| A1 | The setting decides that type's column header, field kind and validation. |
| A2 | Allocation is recorded against the unit. It is never inferred from the name of the location it sits in. |
| A3 | Emptying the field releases the unit and is recorded in its log. |
| A4 | A single-unit catalog is always User, and its unit type has no allocation control. |
| A5 | A single-unit record can be allocated to several people at once; each adds one to Allocated. Everything else takes exactly one. |
| A6 | Changing what a unit type allocates to releases every allocation of that type. The change is stated before it is made and applied only on save. |

---

## 6. Items

### Add and edit

Adding an item and editing one are the **same panel** — adding is
editing a blank. Two panels taking the same values would be two things
to keep in step.

| Behavior | Detail |
|---|---|
| **Every property** | One field per property the catalog has, typed by the property: a vendor is a list, a flag is a switch, a number takes digits only. |
| **Generated name** | Shown as it will be saved, updating as the values that feed it are typed, so a rename is visible before saving rather than arriving as a surprise after. |
| **Identifier** | Handed out on add, not asked for. It has to be unique, and asking someone to know the next free one is asking them to do the system's job. It stays editable. |
| **Discard** | Cancel, the overlay and Escape all discard the draft. |
| **On save** | Updates the heading, breadcrumb, browser title and property chips. |

### On the item page

Properties with a value are shown as chips under the item name. A
property with no value shows no chip: an empty property is not a fact
about the item, and a row of blanks pushes the ones that matter off the
line.

| # | Rule |
|---|---|
| I1 | The name, the chips and the editor all read the same list, so a chip can never state something the editor cannot change. |
| I2 | A new item enters the catalog with its figures at zero — that is what a catalog entry with no stock recorded against it is. |

---

## 7. Units

The units of one item, one tab per unit type.

**Fixed columns in every catalog** — Location, Allocated to, Quantity —
then one column per added field, in the order the unit type defines them.
A reader who has learned one unit table has learned all of them.

### Editing

Every value in a row is editable where it is read. **There are no save
buttons in a table.**

| Behavior | Detail |
|---|---|
| **Commit** | On blur or Enter. |
| **Revert** | On Escape. |
| **Focus** | Selects the field's contents, so typing replaces rather than appends. |
| **Row hover** | Outlines every editable field in the row, so the targets are findable from one place rather than hunted cell by cell. |
| **After a commit** | The figures above the table rebuild; the table itself stands, so the cursor is never pulled out of a row mid-edit. |

### Refusals

An invalid entry is **rejected outright**: the field returns to the value
it held, a message says what was expected, and the field flashes so it is
obvious which one refused. Nothing is silently accepted or silently
changed.

| Entry | Treated as |
|---|---|
| A cleared number | Not an entry. The field returns to its value, with no error. |
| A cleared allocation | An instruction — release this unit. The one blank that is not a slip. |
| A job number that is not six digits | Refused, with the expected format stated. |
| A measurement of zero | Refused. Something 0 inches wide is not a thing. |
| A quantity of zero | Accepted. It means the unit is used up (§7.2). |

### 7.1 Adding a unit

Add places an empty row at the bottom of the table and puts the cursor in
its first field, so a new unit is entered in the same place and the same
way an existing one is corrected.

Each field starts at the unit type's **default** where one is set — most
rolls of a cloth come 54 inches wide, so adding one is a confirmation
rather than a transcription. Fields with no default start empty.

Location never takes a default: it is where the unit happens to be, and
a unit without one is On Order until it is placed.

### 7.2 Depleted units

A unit whose quantity has reached zero is **depleted** — used up, not
wrong. A quantity not yet entered is neither.

| Behavior | Detail |
|---|---|
| **Hidden by default** | A depleted unit is history, not stock. |
| **Show depleted** | Brings them back, including to recount one zeroed by mistake. |
| **Footer** | States how many units are showing and how many are hidden. |
| **On depletion** | The row dims in place and is only removed once focus has left it, so a mistyped zero can be corrected without the row vanishing mid-edit. |

| # | Rule |
|---|---|
| N1 | Quantity is whatever the unit type counts in — yards for a roll, each for a swatch. Depletion is that figure reaching zero, whatever it is. |
| N2 | A single-unit catalog has no depleted state and no Show depleted control: nothing about a unique record can run down. |

---

## 8. Single-unit catalogs

For catalogs where the item **is** the object. There is nothing within
the item to drill into, so the catalog page carries the records.

| Behavior | Detail |
|---|---|
| **Columns** | ID, Name, Location, Allocated to. No quantity column: a unique record is worth 1 while it exists. |
| **No item page** | The item is the unit. Following a stale link to one says so and points back. |
| **No tabs** | One unit type is not a choice. |
| **Rollup** | The same four figures, as a catalog total: records with no location are On Order, records with a location are In-House, each person holding one adds to Allocated. |
| **Editing** | Location and Allocated to are edited in the table, with the same commit and revert behavior as any unit. The one catalog where a row IS the object should not be the one catalog whose rows are edited elsewhere. |
| **Properties** | Reached from the row, in the same panel that adds and edits any item. |

**Two people claiming one record reads as oversold.** Available goes
negative for that item and the catalog rollup nets it against the rest.
That is the intended reading, not an error state: two people believe they
have the same die, and the figures should say so.

---

## 9. Activity log

A quantity is typed over, so the number on screen is the whole of what a
unit can say about itself. The table cannot answer the question people
actually bring to it — *where did the other 24 yards go?*

Every unit and every unique record carries a log.

| Event | Recorded when |
|---|---|
| Received | Stock is booked in. |
| Allocation removed — unit type changed | The unit type changed what it allocates to (§5.4). |
| Scanned to *location* | A location is entered on a unit that had none. |
| QTY *n* entered | A quantity is committed — every entry, including the one that depletes the unit. |
| Allocated to *job / person* | An allocation is committed. |
| Allocation removed | The allocation is cleared. |

| # | Rule |
|---|---|
| H1 | Oldest first. The log reads as the story of the record, not a stack of the most recent thing; the first event is where the record came from and is emphasised. |
| H2 | Opens beside the table, not inside it. A log is read top to bottom, and expanding a row would move every row the reader was just looking at. |
| H3 | Names the record it belongs to, because the panel covers the row that would otherwise say so. |
| H4 | Append-only, and never the source of a figure. It says what happened; the unit says what is true now. |

---

## 10. Patterns that hold everywhere

These are what let someone who has learned one screen use the next one
without being taught again.

| # | Rule |
|---|---|
| G1 | **Substantial work happens in the aside.** Editing a unit type, adding or editing an item, adding a library, library settings and the activity log all open in the same panel. |
| G2 | **Every panel edits a draft.** Cancel, the overlay and Escape discard cleanly, and nothing is committed until saved. |
| G3 | **Nothing that belongs in a row moves into a panel.** A value read in a table is edited in that table. |
| G4 | **Add affordances sit above the thing they add to**, and read the same on every screen. |
| G5 | **Destructive actions state their cost** — what is being deleted and what goes with it — and say when they cannot be undone. |
| G6 | **A protected control says why it is protected.** The last library, the last unit type, and a setting that would have to discard work all state their reason rather than simply refusing. |
| G7 | **A consequence is stated where the choice is made**, in the help line under the control that causes it, not in a note elsewhere on the page. |
| G8 | **Colour is never decoration and never alone.** It appears only on a figure needing attention, and always with an icon or a tooltip. |

