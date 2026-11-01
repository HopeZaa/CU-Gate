# Data verification — version 1.7

The runtime Zod-validated JSON is scoped to main vehicle entrances with mapScope=vehicle-main and gateUse=vehicle. Scope validation rejects pedestrian entrances and pedestrian operating rules. Archived walking records are not imported by the app or included in dist. The original supplied source text is retained for inspection.

| Metric snapshot | Count |
|---|---:|
| Active vehicle gate groups | 21 |
| Verified gate information | 0 |
| Historical gate information | 21 |
| Unverified gate information | 0 |
| Unknown gate information | 0 |
| Verified map coordinates | 8 |
| Approximate coordinates | 11 |
| Unknown coordinates | 2 |
| Vehicle permissions without fresh verification | 21 |
| Schedules without fresh verification | 21 |

These are generated report snapshots. All ten dashboard metrics and their drilldowns are recomputed from the actual active JSON, not these constants. Gate and GPS partitions are separate; the last two metrics overlap them. Unknown verification is not a blanket blocker for the owner's adopted vehicle schedules, which cover 15 active groups through 16 structured rules.

Car rules include motorcycle access without changing hours, one-way direction or authorization. Foot-gate schedules are not used to fill missing vehicle hours. The owner-requested banner does not establish that foot gates open 24h. Unverified records are not confirmed real-world access information.

Full map mode preserves filters, leaves GPS and map controls available, and provides a return button and Escape handling. The banner moves left continuously, can be paused and respects reduced motion. The dashboard, list and markers share the same vehicle inventory.

Software checks validate source joins, coordinate pairs, scopes, schedules, full-screen layout, bilingual banner, pause/resume, stable exit behavior and unchanged gate conditions. Field gate operations, actual GPS sensor hardware and phone Home Screen installation remain outside this software QA. Current evidence is in verification/v8.

