# Data verification — version 1.4

The application calculates all dashboard statistics from the parsed gate JSON. At this delivery, the source snapshot is:

| Metric | Count |
|---|---:|
| Discovered gate groups | 30 |
| Verified gate information | 0 |
| Historical gate information | 30 |
| Unverified gate information | 0 |
| Unknown gate information | 0 |
| Verified GPS coordinates | 8 |
| Approximate GPS coordinates | 18 |
| Unknown GPS coordinates | 4 |
| Vehicle permissions without new verification | 30 |
| Schedules without new verification | 30 |

These numbers are generated report snapshots, not constants in the dashboard. Gate evidence statuses partition the inventory; GPS groups partition it separately. Vehicle and schedule audit gaps overlap those partitions. Zero gate-level UNKNOWN does not mean every field is known. Coordinate verification is separate from gate evidence status.

## Operational baseline and audit

The owner explicitly adopts old schedules until corrected and supplies a 28-item inventory. 20 groups have structured operating rules. The navigation UI uses those rules even while the verification audit remains historical. Unknown verification no longer blocks adopted hours. Unverified information is not confirmed real-world access information; the dashboard states this explicitly. No live feed or new field verification is implied.

The new hierarchy is walking < motorcycle < car. Latest applicable evidence is resolved within each declared mode; eligible mode windows are then unioned. Car 24h therefore includes walking and motorcycle 24h. One-way, timing and authorization conditions carry through. Walking-only gates do not imply vehicle access. Conditional Dhamma exit windows subtract the Indoor Stadium exit's open hours. The current weekly pattern is used unless corrected; no holiday or race calendar is connected.

## Data integrity and inspection

Zod validates IDs, source links, unique map codes, complete coordinate pairs, ranges, dates, duplicate points, rule sources and linked gates. HTTP(S) source links and a tightly restricted local owner-source path are allowed; executable paths are rejected. The owner's full supplied text is inspectable from each associated gate. ownerInventory links all 28 entries, including the provisional Allied Health / health gate 5 alias.

Dashboard metric drilldowns, search, gate details, source links and JSON export use the same validated records. Unknown coordinates get no marker, distance or directions URL. Both themes use the same data and calculations. Theme preference changes only presentation and is saved locally.

## Verification scope

Automated tests exercise hierarchy unions, overnight boundaries, one-way inheritance, linked exit windows, missing schedules, source integrity and dynamic dashboard metrics. Browser checks cover responsive list/map views, the added northern markers, mode filters, detail cards, source links, light/dark switching, persistence and data quality. Logs and screenshots for this delivery are in verification/v5. Real gate conditions and sensor GPS on a physical device remain outside software QA.

