> Current app behaviour is described in Revision 4 below: the owner has adopted historical schedules as the operating baseline. Earlier revision descriptions are retained as research history.

# Data verification report

Review date: **1 November 2026**, Asia/Bangkok.

## Gate information versus geographic information

These are separate classifications. An old official source can reliably show that a named entrance existed, while still providing no verified current permission or schedule. A physical map point can be verified without knowing whether the gate is usable. Every gate's details show these separately.

| Gate information status | Records |
|---|---:|
| VERIFIED | 0 |
| HISTORICAL | 22 |
| UNVERIFIED | 0 |
| UNKNOWN | 0 |

| Data quality measure | Records |
|---|---:|
| Total discovered gate groups | 22 |
| Map-verified GPS coordinates | 8 |
| Approximate GPS coordinates | 3 |
| Unknown coordinates | 11 |
| Unknown current car or motorcycle permission | 22 |
| Unknown current operating schedule | 22 |

These counts are a generated report snapshot. The application's dashboard recomputes from `src/data/gates.json`, using `qualityStats` / `qualityRows`; no demonstration counts are embedded in its components. Four information statuses partition the gate inventory. Three coordinate coverage groups partition it separately. Vehicle/schedule gaps overlap those groups and must not be added to them.

## Verification policy

- VERIFIED: sufficient reliable current evidence for the record's claimed operating information.
- HISTORICAL: an older official announcement or map identifies the entrance, but current applicability is not established.
- UNVERIFIED: a reported identity is not independently confirmed.
- UNKNOWN: no reliable information for the record's identity is available.

The current inventory's gate-level zero UNKNOWN count does not mean there are no missing fields: all operating schedules and current permission fields remain unknown. Coordinate verification status is separate. Eight geographic points are VERIFIED; three point-to-identity associations are UNVERIFIED; eleven are UNKNOWN.

## Schema and integrity checks

Runtime Zod validation checks the dataset, coordinate pair completeness, ranges, dates, HTTP(S) source URLs, source references, unique IDs, duplicate coordinate pairs and evidence metadata. Tests read the actual imported JSON. Invalid data is rejected and the app shows a data error rather than plotting unvalidated values.

Historical schedules are not promoted to current schedule objects. No vehicle permission is inferred from a road, a generic vehicle reference, a pedestrian rule, or another mode. Current entry/exit fields are independently null. Empty `permittedVehicles` means none confirmed, not a ban on all vehicles.

## Recommendation guardrails

A gate becomes confirmed accessible by records only when its gate status, permissions and geographic evidence are verified, selected mode and direction are allowed, its verified applicable schedule says open, and access is public without unresolved restrictions. This still is not live operational status. Unknown holiday policies yield an unknown schedule. Historical, future or expired schedules yield unknown. Verified denials/closures take effect independently.

Candidates are ordered by supported access class, then straight-line distance when location is available, then coordinate evidence. Strict filtering excludes unknown permissions; the current dataset therefore correctly produces an empty strict-access result. Missing coordinates never produce a distance, marker or navigation URL.

## Dashboard definitions

- Verified GPS: usable pair + HIGH coordinate confidence + VERIFIED coordinate status; map verification, not a field GPS survey.
- Approximate GPS: usable pair outside the above group, including unverified points.
- Unknown GPS: no usable coordinate pair.
- Unknown vehicle permissions: current evidence cannot resolve either car or motorcycle permission. Walking permission is separate.
- Unknown schedule: no verified, applicable schedule at the evaluated Bangkok time, or unresolved holiday rules.

Metric selection filters the inspection table from the original records. Search intersects that subset. Summary cards always describe the complete inventory, as labelled. Each table record opens evidence and source URLs. JSON export contains the same loaded dataset.

## Limits

Data completeness remains incomplete. No comprehensive current policy, live operational feed, field survey, verified holiday calendar or current mode-specific authorization was obtained. The collected evidence supports a cautious research/navigation aid, not a guarantee that a visitor can enter. Sources, conflicts and unresolved discovery leads are listed in `GATE_DATA_SOURCES.md`.

## Revision 2: usable information without false current access

`referenceAccess` contains 12 historical operating references for 10 groups. Every reference joins to a real source and is marked HISTORICAL. Reference hours and restrictions are shown with the publication year. They never populate current permission/schedule fields, change a gate to VERIFIED, or generate a live open/closed claim. Null `requiresAuthorization` means the notice does not establish that requirement; it does not mean unrestricted entry.

The main list defaults to the 11 mappable gates. All 22 records remain available in the dashboard and via the option to include unlocated gates. Known reference direction conflicts are demoted in suggested ordering; an old exit-only rule cannot become an entry recommendation. Exact current denials or closures still override historical labels. Unknown current permission fields and schedules still count as unknown in the dashboard.

The generic Access unknown badge is replaced with separate factual descriptions: documented mapped entrance, dated access reference, explicit old authorization requirement, old exit-only reference, or approximate point. This is a presentation of available evidence, not reclassification as currently accessible. Thai/English switching changes text only; calculations and source associations stay the same.

## Revision 3: map status at the current Bangkok time

Version 1.2 defaults to the map on mobile. All gates retains known closed or denied records so red pins remain inspectable. There are two primary controls: All gates and Open now. Search, travel mode, entry/exit and optional evidence filters still intersect the results. Unlocated records appear in the list but never receive invented map points.

A shared `gateAvailability` calculation drives marker colour/symbol, compact pin card, list badge, dynamic counts and the Open now filter. Green requires the same current verified public access, selected mode/direction, applicable schedule and verified coordinate conditions as confirmed access. Red means a verified closure or denial; amber means recorded open hours with a verified permission but an authorization condition; grey means insufficient current evidence. Open now excludes red, amber and grey. No historical/event reference is promoted to a current schedule.

Today's hours and the next opening/closing are calculated in Asia/Bangkok, including yesterday's overnight tail, touching/overlapping periods, multiple shifts and validity limits. Evidence expiry is labelled as expiry rather than asserted as a real-world closing event. Unknown holiday applicability remains unknown. The clock refreshes at minute boundaries and on tab return. This is schedule-based status, not live operational telemetry.

The real dataset remains unchanged: no current schedule is verified, so Open now honestly contains zero records. This means insufficient evidence, not that every physical gate is closed. A separately labelled development-only `tests/status-harness.html` demonstrates the four states and time transition; it does not change `src/data/gates.json` or ship in the static build. Real-data and synthetic QA screenshots are named separately in `verification/v3/`.

A pin card initially shows a short status, today's hours, next change if known, selected access, coordinate/distance and directions. Dated notices, permissions, provenance, review dates and all source links are available in one collapsed disclosure. It no longer asks users to interpret a long announcement to determine the current status.

## Revision 4: user-adopted historical operating baseline (v1.3)

The app owner explicitly requested that older schedules be used as the working current baseline until corrected. This supersedes the prior presentation policy that prevented historical hours from driving the main map. `operationPolicy` records that decision. 47 structured `operatingRules` cover 19 of 22 gate groups. They remain HISTORICAL, join to real sources, and do not change the original verified-access fields, coordinates or evidence statistics.

The shared availability calculation now uses adopted weekly rules when no verified current gate record supersedes them. It resolves the selected mode, entry/exit, Bangkok day and time, latest applicable source, explicit one-way rules and the linked Dhamma/Stadium vehicle-exit condition. Authorization notes are shown as compact conditions rather than suppressing all scheduled-open gates. Source publication year and a reference-schedule label remain available in the pin card.

The 2 December 2021 all-pedestrian-gates notice is adopted as a shared walking baseline for the listed main/pedestrian gate groups: weekdays 06:00–20:00, weekends 06:00–18:00. Applying that shared notice to the named main-gate groups is an explicit app baseline, not individual field verification. Pharmacy uses the faculty-specific February table. The 2008 weekend-only vehicle table supplies only covered weekend days; it does not fabricate weekday hours. Latest matching dated rules override older matching rules. Event-only graduation records do not supply normal weekly hours.

Known exceptions (authorization, race-day hours and public holidays) remain in source material/conditions. The default clock uses the ordinary weekly pattern; no live closure, holiday or race calendar is connected. The app owner can correct the structured JSON directly. Sources added in this revision: [June 2020 opening notice](https://www.chula.ac.th/news/31457/) and [November 2008 weekend table](https://www.arts.chula.ac.th/~tran/downloads/cu_traffic_03.pdf). See `OPERATING_SCHEDULES.md` for every adopted rule and source.

The dashboard still audits current verification separately: adopting older data does not turn it into a new verification. Main navigation is usable with the adopted schedules; unknown verification is no longer a blanket operational blocker. Unlocated gates still receive no invented points or directions.
