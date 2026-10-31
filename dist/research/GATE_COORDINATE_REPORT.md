> Current app behaviour is described in Revision 4 below: the owner has adopted historical schedules as the operating baseline. Earlier revision descriptions are retained as research history.

# Gate coordinate research report

Reviewed **1 November 2026**. Coordinate reference system: **WGS84** (latitude, longitude). No field GPS measurement was performed.

## Method and meaning

The official 2023 prospectus map (printed pp. 97–98) was visually inspected alongside physical OSM barrier nodes and road/path topology in the current downloaded extract. The map names eight entrance complexes A–H. Their mapped barrier points are HIGH confidence / VERIFIED **for geographic identification only**. Three other physical gate nodes have approximate faculty-name associations and remain MEDIUM / UNVERIFIED. No coarse estimates or building centroids were used to fill the remaining records.

HIGH does not mean public access, current operation, a sensor measurement or a particular lane's permission. The representative point for a paired-lane complex is an actual node. The external navigation destination may therefore refer to one side of a multi-lane entrance; directions still require checking local signs.

## Counts

- HIGH: 8
- MEDIUM: 3
- LOW: 0
- UNKNOWN: 11

## Every record

| Gate ID | Latitude | Longitude | Confidence / status | Physical point and verification note |
|---|---:|---:|---|---|
| `phayathai-1` | 13.7387455 | 100.5298425 | HIGH / VERIFIED | [OSM node](https://www.openstreetmap.org/node/359788705). Physical OSM barrier node cross-matched to gate A on the official 2023 map. Representative lane where entry/exit barriers are paired. No field GPS survey. |
| `phayathai-2` | 13.7387095 | 100.5294859 | HIGH / VERIFIED | [OSM node](https://www.openstreetmap.org/node/1703081344). Physical OSM barrier node cross-matched to gate B on the official 2023 map. Representative lane where entry/exit barriers are paired. No field GPS survey. |
| `phayathai-3` | 13.7349556 | 100.5292581 | HIGH / VERIFIED | [OSM node](https://www.openstreetmap.org/node/359788610). Physical OSM barrier node cross-matched to gate C on the official 2023 map. Representative lane where entry/exit barriers are paired. No field GPS survey. |
| `henri-dunant-1` | 13.7379945 | 100.5344199 | HIGH / VERIFIED | [OSM node](https://www.openstreetmap.org/node/359789581). Physical OSM barrier node cross-matched to gate D on the official 2023 map. Representative lane where entry/exit barriers are paired. No field GPS survey. |
| `henri-dunant-2` | 13.7342472 | 100.5339512 | HIGH / VERIFIED | [OSM node](https://www.openstreetmap.org/node/359788509). Physical OSM barrier node cross-matched to gate E on the official 2023 map. Representative lane where entry/exit barriers are paired. No field GPS survey. |
| `sasin` | 13.7430643 | 100.5279029 | HIGH / VERIFIED | [OSM node](https://www.openstreetmap.org/node/1848751281). Physical OSM barrier node cross-matched to gate F on the official 2023 map. Representative lane where entry/exit barriers are paired. No field GPS survey. |
| `dhamma` | 13.7397359 | 100.5254363 | HIGH / VERIFIED | [OSM node](https://www.openstreetmap.org/node/2106361166). Physical OSM barrier node cross-matched to gate G on the official 2023 map. Representative lane where entry/exit barriers are paired. No field GPS survey. |
| `stadium` | 13.7367067 | 100.5249037 | HIGH / VERIFIED | [OSM node](https://www.openstreetmap.org/node/2106361169). Physical OSM barrier node cross-matched to gate H on the official 2023 map. Representative lane where entry/exit barriers are paired. No field GPS survey. |
| `science` | 13.7378398 | 100.529713 | MEDIUM / UNVERIFIED | [OSM node](https://www.openstreetmap.org/node/359788690). Mapped physical barrier; matching this node to the announced gate is approximate and not independently confirmed. |
| `architecture` | 13.739653 | 100.5299744 | MEDIUM / UNVERIFIED | [OSM node](https://www.openstreetmap.org/node/359788777). Mapped physical barrier; matching this node to the announced gate is approximate and not independently confirmed. |
| `communication` | 13.7363977 | 100.5290425 | MEDIUM / UNVERIFIED | [OSM node](https://www.openstreetmap.org/node/6238285795). Mapped physical barrier; matching this node to the announced gate is approximate and not independently confirmed. |
| `cham9-market` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `cham9-ucenter` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `cham-square-foot` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `engineering-reserve` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `education-foot` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `dormitory-phayathai` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `pharmacy` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `veterinary` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `dentistry` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `chulaphat14` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |
| `law-foot` | null | null | UNKNOWN / UNKNOWN | No coordinate source. No unambiguous physical entrance point established. No building centroid substituted. |

## Cross-check references

- [Official 2023 university prospectus map](https://www.inter.chula.ac.th/wp-content/uploads/2023/03/Prospectus2023_Reduced.pdf), PDF page index 50 / printed pages 97–98: entrance names and relative position, not georeferenced GPS coordinates.
- [OSM API bounded map extract](https://api.openstreetmap.org/api/0.6/map?bbox=100.520,13.729,100.535,13.744), retrieved 1 November 2026: actual node geometry and connected roads. OSM © contributors / ODbL. Each gate's point URL, object edit time and review date are in the gate JSON.
- [Local relevant barrier extract](public/research/osm-barriers.json): retained node IDs, versions, coordinates and tags. It includes neighbouring candidates and internal barriers; it is not the gate inventory.
- [University notice identifying Chamchuri 9 sides](https://www.chula.ac.th/news/149022/): evidence for distinct entrance names; no substitute coordinates were inferred from its building references.

## Lane deduplication

Phayathai 1 uses node 359788705; neighbouring node 2106361172 belongs to the same named complex. Phayathai 2 uses 1703081344 rather than creating another record for 2106361176. Henri Dunant 1 uses 359789581 rather than separately counting 2106361179. Sasin uses the actual barrier 1848751281 on the access road identified by map F. No averages were used. No direction is inferred from a node's location, a connected one-way road, or another lane's tags.

## Remaining uncertainty

Map and OSM dates cannot establish physical changes after mapping or confirm access today. All eleven null points need an exact entrance-identity check. Approximate Science, Architecture and Communication Arts associations need an independent positional check. The app omits null points from markers, warns for approximate destinations, and disables directions where location is unresolved.

## Revision 2: public origin and map display

The gate coordinate inventory is unchanged. The added Sam Yan MRT origin (13.7331316, 100.5295758, OSM node 1698343087) is stored separately in `src/data/origins.json`, not added to gate counts. The UI uses a labelled teal M marker for this selected starting point, and a blue accuracy marker only for actual geolocation callbacks. Choosing the landmark stops any GPS watch. Distances are explicitly straight-line. Thai map labels describe surrounding places and are not replacements for gate coordinates.

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
