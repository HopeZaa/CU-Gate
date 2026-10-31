> Current app behaviour is described in Revision 4 below: the owner has adopted historical schedules as the operating baseline. Earlier revision descriptions are retained as research history.

# Gate data sources

Research review date: **1 November 2026 (Asia/Bangkok)**.

## Result and scope

The inventory contains **22 named entrance groups**, discovered through Thai/English university notices, an official campus map and OSM comparisons. A named entrance complex counts once even when it has separate incoming/outgoing lane barriers. This is a source-backed inventory, **not a claim to have found every physical opening**. School-internal entrances, hospital gates, parking barriers inside the campus and unrelated neighbouring properties are excluded from the navigation inventory.

All gate records are HISTORICAL: old official evidence identifies them, but present-day operating validity is unestablished. A coordinate may be map-verified independently of this record status. No live access feed or current comprehensive gate policy was obtained.

## Source register

### cu-map-2023

[Undergraduate prospectus 2023 · campus map, pp. 97–98](https://www.inter.chula.ac.th/wp-content/uploads/2023/03/Prospectus2023_Reduced.pdf)

Published: 2023-03. Reviewed: 2026-11-01.

Eight named gate groups A–H; geographical context only. Month from hosting path; exact publication day unknown.

### cu-2025-event

[Commencement traffic notice · 29 Sep–1 Oct 2025](https://web-stage.ccc.chula.ac.th/news/262720/)

Published: 2025-09-28. Reviewed: 2026-11-01.

Past event restrictions; not a current operating schedule.

### cu-2023-event

[Commencement traffic notice · October 2023](https://www.chula.ac.th/news/133566/)

Published: 2023-09-19. Reviewed: 2026-11-01.

Past event; distinguishes pedestrian access and the engineering reserve gate.

### cu-nov-2021

[Gate operations effective 1 November 2021](https://www.chula.ac.th/en/news/51831/)

Published: 2021-10-29. Reviewed: 2026-11-01.

COVID-era operating policy; current validity not established.

### cu-dec-2021

[Vehicle and pedestrian gates · December 2021](https://www.chula.ac.th/en/news/55773/)

Published: 2021-12-02. Reviewed: 2026-11-01.

COVID-era changes, including Communication Arts; historical only.

### cu-polsci-2021

[Political Science vehicle gate update](https://www.chula.ac.th/en/news/56919/)

Published: 2021-12-14. Reviewed: 2026-11-01.

Effective 7 December 2021; historical only.

### cu-sasin-2018

[Sasin gate operating-time change](https://web-stage.ccc.chula.ac.th/news/12922/)

Published: 2018-09-12. Reviewed: 2026-11-01.

Old car/pedestrian schedules; later COVID and event notices differ.

### cu-exits-2021

[Temporary stadium closure and alternative exits](https://www.chula.ac.th/news/54078/)

Published: 2021-11-19. Reviewed: 2026-11-01.

Construction-era alternative vehicle and pedestrian exits; does not establish permanent operation.

### cu-cham9-2024

[Chamchuri 9 entrances · temporary closure](https://www.chula.ac.th/news/149022/)

Published: 2024-02-08. Reviewed: 2026-11-01.

Identifies Market-side entrance and U-Center-side exit; closure was 7–8 February 2024 only.

### cu-apr-2020

[Campus gate restrictions · April 2020](https://www.chula.ac.th/en/news/29031/)

Published: 2020-04-02. Reviewed: 2026-11-01.

Pandemic restrictions; identifies health-science and dormitory gates, without exact points.

### cu-feb-2021

[Temporary campus closure · February 2021](https://www.chula.ac.th/news/43419/)

Published: 2021-02-12. Reviewed: 2026-11-01.

Historical Veterinary and Pharmacy gate references.

### cu-law-2022

[Graduation access notice · academic year 2020](https://web-stage.ccc.chula.ac.th/en/news/72235/)

Published: 2022. Reviewed: 2026-11-01.

Includes a Law pedestrian gate. Exact publication day unavailable; past graduation activities only.

### osm-campus

[OpenStreetMap · bounded campus extract](https://api.openstreetmap.org/api/0.6/map?bbox=100.520,13.729,100.535,13.744)

Published: unknown; current OSM database extract. Reviewed: 2026-11-01.

Downloaded 1 November 2026. ODbL data; object edit dates are not site inspections or proof of public access.

### cu-nov-2021-th

[Thai gate operations notice effective 1 November 2021](https://www.chula.ac.th/news/51817/)

Published: 2021-10-29. Reviewed: 2026-11-01.

COVID-era policy; Dhamma vehicle entry and conditional exit are distinct. Current applicability not established.

### cu-security

[Campus Security & Safety](https://www.chula.ac.th/en/life-at-cu/campus-safety/)

Published: unknown; current OSM database extract. Reviewed: 2026-11-01.

University security and traffic center, 24-hour contact 02-218-0000. No gate-by-gate schedule.

### cu-visitors-2025

[Official visitor guidance 2025](https://www.inter.chula.ac.th/wp-content/uploads/2025/01/Visit-Request-Form-2025.pdf)

Published: 2025-01. Reviewed: 2026-11-01.

General public may visit campus and museums. Non-Chula visitors cannot enter buildings. Does not confirm individual gate permission.

## Research and discovery log

- Searched Thai terms for gate opening/closing, traffic arrangements, Phayathai, Henri Dunant, Sasin, Chula Phat 14, health-science faculties and recent 2567–2569 announcements; searched English gate-operation and campus-map terms. Search results do not prove absence of a newer notice.
- Read official indexed notices from 2018, 2020, 2021, 2022, 2023, 2024 and 2025. Some direct university fetches returned an anti-bot page; the indexed readable text was used where available. No security challenge was bypassed. The live interactive university map shell did not expose a usable gate dataset to this research session.
- Downloaded the official 2023 prospectus. Rendered PDF page index 50 (printed pages 97–98) and visually inspected gate labels A–H, surrounding roads and faculty context. Used the 2023 map rather than ambiguous OCR in an older third-party mirror.
- Overpass `overpass-api.de` returned HTTP 406 for the bounded gate-node query. `overpass.kumi.systems` timed out after 70 seconds. The successful fallback was one OSM API map request for bbox `100.520,13.729,100.535,13.744`. Original raw XML is kept in the task's working research cache; a relevant barrier-node extract and derivative map are shipped locally.
- Compared physical `barrier=gate`/`lift_gate` nodes and connecting OSM roads/paths to the campus map. Matching a building's location was not accepted as a gate coordinate. Named old sources with no unambiguous entrance point keep null coordinates.
- Cached the static gate JSON, sources and map extract. No research API is queried by application visitors.

## Reconciliation and conflicts

- Phayathai 1/2 and Henri Dunant 1 have paired adjacent barrier nodes. Each named complex is one record with a real representative lane point, not an average or duplicate record.
- The 2023 official map resolves Dhamma Center as Chula Soi 9 Gate 1. Some older notices call the area Soi 42; the conflicting naming is retained in the record notes.
- Faculty names and road-number names are aliases of the same entrance where supported. Old map labels “Sanam Kila 1/2” are retained as aliases for the Henri Dunant Arts/Political Science groups.
- Notices distinguish vehicular and pedestrian rules at the same faculty precinct. Without evidence of distinct physical openings, these remain one entrance group; access is unknown for every current mode. They are not inflated into separate records.
- The 2024 notice explicitly distinguishes Chamchuri 9's Market side and U-Center side. These are separate named groups. The unspecified 2021 side-building exit is retained with the U-Center record as a possible association, without inventing another point.
- A 2021 construction notice mentions an indoor-sports-building alternative exit and stadium pedestrian opening. Their independent physical identities remain unresolved; they are discovery leads rather than additional presumed permanent gates. See the stadium evidence notes. No temporary construction/event entrance is asserted to operate today.
- The Engineering reserve gate is retained as an event-era reserve entrance with unknown current restrictions; it is not recommended as a public emergency route.
- Sasin day/holiday rules, Chula Phat 14 closing times and various event schedules differ across years. None was arbitrarily selected as a current schedule.

## Inventory and source joins

| Gate ID | Entrance group | Evidence IDs | Current status |
|---|---|---|---|
| `phayathai-1` | ประตูพญาไท 1 / Phayathai Road Gate 1 | cu-2025-event, cu-2023-event, cu-map-2023, osm-campus | HISTORICAL |
| `phayathai-2` | ประตูพญาไท 2 / Phayathai Road Gate 2 | cu-2025-event, cu-map-2023, osm-campus | HISTORICAL |
| `phayathai-3` | ประตูพญาไท 3 / Phayathai Road Gate 3 | cu-nov-2021, cu-2025-event, cu-map-2023, osm-campus, cu-nov-2021-th | HISTORICAL |
| `henri-dunant-1` | ประตูอังรีดูนังต์ 1 / Henri Dunant Road Gate 1 | cu-2025-event, cu-exits-2021, cu-map-2023, osm-campus | HISTORICAL |
| `henri-dunant-2` | ประตูอังรีดูนังต์ 2 / Henri Dunant Road Gate 2 | cu-polsci-2021, cu-2025-event, cu-map-2023, osm-campus, cu-nov-2021-th | HISTORICAL |
| `sasin` | ประตูศศินทร์ / Chula Soi 12 Gate 1 (Sasin) | cu-sasin-2018, cu-nov-2021, cu-2025-event, cu-map-2023, osm-campus, cu-nov-2021-th | HISTORICAL |
| `dhamma` | ประตูธรรมสถาน / Chula Soi 9 Gate 1 (Dhamma Center) | cu-nov-2021, cu-2025-event, cu-map-2023, osm-campus, cu-nov-2021-th | HISTORICAL |
| `stadium` | ประตูสนามกีฬาจุฬาฯ / Chula Soi 9 Gate 2 (Chulalongkorn Stadium) | cu-nov-2021, cu-exits-2021, cu-2025-event, cu-map-2023, osm-campus, cu-nov-2021-th | HISTORICAL |
| `science` | ประตูคณะวิทยาศาสตร์ / Faculty of Science gate | cu-nov-2021, cu-2023-event, cu-2025-event, osm-campus, cu-nov-2021-th | HISTORICAL |
| `architecture` | ประตูคณะสถาปัตยกรรมศาสตร์ / Faculty of Architecture gate | cu-2023-event, cu-2025-event, osm-campus | HISTORICAL |
| `communication` | ประตูคณะนิเทศศาสตร์ / Faculty of Communication Arts gate | cu-dec-2021, cu-2025-event, osm-campus | HISTORICAL |
| `cham9-market` | ประตูจามจุรี 9 ฝั่งตลาดสามย่าน / Chamchuri 9 · Sam Yan Market side | cu-cham9-2024 | HISTORICAL |
| `cham9-ucenter` | ประตูจามจุรี 9 ฝั่งยูเซ็นเตอร์ / Chamchuri 9 · U-Center side | cu-cham9-2024, cu-exits-2021 | HISTORICAL |
| `cham-square-foot` | ประตูทางเท้าด้านจามจุรีสแควร์ / Chamchuri Square pedestrian gate | cu-2023-event, cu-2025-event | HISTORICAL |
| `engineering-reserve` | ประตูด้านอาคารวิศวกรรมสถาน / Engineering reserve gate | cu-2023-event, cu-2025-event | HISTORICAL |
| `education-foot` | ประตูทางเท้าอาคารจามจุรี 5 / Chamchuri 5 / Education pedestrian gate | cu-nov-2021, cu-apr-2020, cu-nov-2021-th | HISTORICAL |
| `dormitory-phayathai` | ประตูหอพักนิสิตด้านถนนพญาไท / Student dormitory · Phayathai Road gate | cu-apr-2020, cu-law-2022 | HISTORICAL |
| `pharmacy` | ประตูคณะเภสัชศาสตร์ / Faculty of Pharmaceutical Sciences gate | cu-feb-2021, cu-2023-event, cu-2025-event | HISTORICAL |
| `veterinary` | ประตูคณะสัตวแพทยศาสตร์ / Faculty of Veterinary Science gate | cu-feb-2021, cu-apr-2020 | HISTORICAL |
| `dentistry` | ประตูคณะทันตแพทยศาสตร์ / Faculty of Dentistry gate | cu-apr-2020 | HISTORICAL |
| `chulaphat14` | ประตูจุฬาพัฒน์ 14 / Chula Phat 14 gate | cu-nov-2021, cu-feb-2021, cu-nov-2021-th | HISTORICAL |
| `law-foot` | ประตูทางเท้าคณะนิติศาสตร์ / Faculty of Law pedestrian gate | cu-law-2022 | HISTORICAL |

## What would improve the data

Obtain a current gate-by-gate statement from the university's security/traffic authority, including separate car, motorcycle, pedestrian, direction and visitor rules. Perform a physical entrance survey for unresolved identities and null points. Check each permanent entrance against an up-to-date campus map and document event/holiday exceptions. Those are evidence gaps, not facts that software can infer.

## Revision 2: operating references and visitor guidance

The revised UI has Thai names, nearby places, notes and source summaries for every gate. It preserves 12 structured, dated operating references across 10 entrance groups in `referenceAccess`, separate from the null current access and schedule fields. All references are HISTORICAL. A temporary COVID-era policy is labelled with its year; event-only information is excluded from normal planning. Generic vehicle references remain generic and do not resolve current car or motorcycle permission. Authorization requirements not stated by a source remain null.

Added the Thai 29 October 2021 notice, official campus-security contact page and official January 2025 visitor guidance. The visitor guidance describes campus-level public visits, not permission through every gate or into buildings. The security page supports the user-initiated contact link 02-218-0000; it does not supply per-gate opening status. No current gate-by-gate operating feed was found in the follow-up research.

MRT Sam Yan is offered as an optional public starting point using [OSM node 1698343087](https://www.openstreetmap.org/node/1698343087), recorded in `src/data/origins.json`. It is not a device GPS reading, university entrance coordinate or inferred walking route.

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
