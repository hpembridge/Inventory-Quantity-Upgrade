# Superseded — the Non-Depletable prototypes

These four pages and their data layer were built against the old model,
where a unit type picked one of four hardcoded **stock forms** — Roll,
Sheet, Piece, Non-Depletable — and Non-Depletable carried a second
setting, Tracking, to say whether an item held many units or was itself
the unit.

That whole shape is gone. A unit type is now **built**: a quantity
dimension, a unit of measure, and any number of added fields. The two
things Non-Depletable existed to express both fall out of the general
model without a special case:

| Old | Now |
|---|---|
| Non-Depletable, Tracking = Multiple units | A normal type, QTY **Count (ea)**. One laptop is one laptop; nothing about the quantity is special, so nothing about the type needs to be. |
| Non-Depletable, Tracking = Single unit | **Single-Unit Items** checked. |
| Location kind — Stock Room vs Assigned | An explicit allocation. Whether an asset is spoken for is now recorded, not inferred from the name of the shelf it is on. |

The location-kind mechanism is the part worth not mourning. It made
`IT-CAGE-A1` mean "available" and `J. Roth — Estimating` mean
"allocated", which worked only as long as every location name was
correctly typed at creation and never reused. Allocation is a fact about
a unit; it belongs on the unit.

These files are kept only so the old reasoning is readable. They do not
run — `nondepletable-data.js` reads a `MEASUREMENT_TYPES` export that no
longer exists.
