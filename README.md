# CU Gate Navigator — version 1.9

A Thai/English map of Chulalongkorn University's main **motorcycle and car gates**, with schedule-based availability, live device location, selectable starting points, light/dark themes and a data-quality dashboard. The app is a static React/TypeScript frontend; no backend or API key is required.

Created and maintained by [HopeZaa](https://github.com/HopeZaa).

## Use the app

1. Select **Motorcycle** or **Car**, then **All gates** or **Open now**. Availability uses Bangkok time and the owner-adopted historical vehicle schedules. It is not a live observation of a physical gate.
2. Click anywhere on a gate card, or click its map marker. The map zooms to that gate and opens its details. Closing details with the X button automatically fits the campus again. The separate Directions link opens Google Maps.
3. Drag the clearly marked top edge of the details panel down to reduce its height, or up to expand it. Clicking the handle toggles compact/expanded height. Keyboard users can focus the handle and use Up/Down (32 px), Home or End. Details remain scrollable.
4. Open **Start point** and type a place name. Local campus-area results appear immediately. Select a result, enter `latitude, longitude`, or use the public Sam Yan MRT preset. A selected place is a reference point, not your device location.
5. For a wider place search, click **Search online** or press Enter. Only that submitted query is sent to Photon. Coordinate input is handled locally. Local search remains available when the online provider is unavailable.
6. Click **Near me · GPS** and allow location access to follow your position. The blue dot and accuracy circle update from the device's location watch. The dot is shown only within the bundled map coverage. Dragging the map stops automatic following; the center-on-starting-point button resumes it.
7. When compass readings are available, a blue directional cone shows the device's facing direction. Enable compass access if requested. Without a compass, a moving device may show the GPS travel direction instead, explicitly labelled as such. No heading is drawn when neither is available.
8. Near me gives one mapped gate a slow glow and star: the nearest gate scheduled open for the selected mode, direction and filters. If no candidate is scheduled open, the nearest candidate is labelled **check hours**. The gate-list control shows an update dot and a subtle pulse; opening the list acknowledges it. Distances are straight-line estimates.
9. **Expand map** folds the header and controls away. Entering or leaving this mode automatically fits the campus to the new map viewport, including when gate details are open. GPS, zoom, fit-campus and Return controls remain available. Escape closes an open details card first, then exits the expanded map. The legend and OpenStreetMap credit share one compact footer row; the legend stays visible in both map modes. There is no pin-guide overlay.
10. Open **Data & sources** to inspect every gate, sources and dynamically calculated quality metrics. Thai/English and light/dark theme preferences persist locally.

## Map zoom stability

The map interaction layer was rebuilt from version 1.7 after a marker-position regression in version 1.8. MapLibre owns a permanent outer anchor for each gate, device dot and selected starting point. The visible button, selection border and recommendation animation live inside that anchor, so visual updates cannot remove the map engine's positioning classes or overwrite its transform.

Zoom and pan remain under user control. Selecting a gate explicitly zooms to its location; changing a status, receiving a compass sample or resizing details does not reset that zoom. Manual panning or zooming pauses GPS camera following until the centre button is used.

The development-only map fixture checks displayed marker centres against the map projection of each JSON coordinate across 12 zoom/pan transitions, including selected markers and GPS updates. Its visible report and screenshots are in `verification/v10`. It is excluded from the production build.

## Location and search limits

Device location and compass access require a secure context (HTTPS or localhost), browser permission and compatible hardware. Location and heading stay in memory: the app does not upload, log or persist these readings. Watches and orientation listeners stop on explicit Stop, page hiding, errors or unmount. Returning to a hidden page requires starting GPS again.

Sensor frequency, accuracy and compass calibration depend on the device and browser. The cone indicates device orientation, which may differ from a person's body or travel direction. This release was checked with controlled location/compass integration fixtures, not a real phone's sensors or an actual campus walk. See [MDN's permission requirements](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static) and the [orientation specification](https://www.w3.org/TR/orientation-event/).

Local search uses a bundled index of 698 named OSM ways within the campus-area extract, plus the public MRT preset. Result coordinates are place/road centres, not surveyed gate entrances. The local map is bounded; a selected place outside its coverage can still be used for distance calculations and external directions, but the app does not pretend to supply a full map there.

Online search uses the [Photon public demo](https://github.com/komoot/photon/blob/master/README.md), which permits moderate use and provides no availability guarantee. Requests are submitted explicitly, limited to six results, separated by at least 1.1 seconds and cached in memory (30 queries). No request is sent for every keystroke, and the campus search bias is fixed public information, never device GPS. The provider also receives ordinary network metadata. The UI identifies the provider before submission. Configure or disable this optional provider in `public/location-search.json` (deployed as `dist/location-search.json`); use a compatible HTTPS Photon endpoint for larger deployments. Nominatim is not used.

Google Maps is opened only by a directions link. A manually selected starting point can be included as the origin; device GPS is never added to the URL. Google applies its own location permissions and routing capabilities.

## Data scope and evidence

The active gate JSON contains **21 main vehicle gate groups**, with **19 mapped points**: 8 map-verified, 11 approximate and 2 without coordinates. Sixteen vehicle operating rules cover 15 groups. These are current dataset counts, not hardcoded dashboard values. All dashboard statistics, filters and exports are calculated from the actual JSON.

The ten dashboard measures cover discovered gates; verified, historical, unverified and unknown information; verified, approximate and unknown coordinates; unknown vehicle permissions; and unknown operating schedules. Users can inspect individual records and source links. A map-verified location is not proof of current access permission. Unverified information must not be treated as confirmed real-world access information.

At the owner's instruction, recorded historical vehicle schedules are the working baseline until corrected. Original evidence classifications remain visible. There is no live gate-status feed or special-closure calendar. Restricted/reserve gates are not promises of public access. Car access includes motorcycles under the same schedule, direction and authorization conditions. Pedestrian schedules never substitute for vehicle hours.

Nine pedestrian-only groups were removed from the active list, map, dashboard and export. The previous full inventory remains in `research/gate-inventory-before-vehicle-scope.json` for audit, and is excluded from the production build. Gates without coordinates remain inspectable in the list but have no invented marker or navigation destination. This UI update does not change gate coordinates or operating rules.

A thin bilingual notice moves from right to left above the map. It can be paused and respects reduced-motion preferences. Its English text is: “Pedestrian gates are beside the main gates. Please check opening and closing times.” The notice does not assert 24-hour pedestrian access or assign pedestrian hours from vehicle schedules.

[Sources](GATE_DATA_SOURCES.md) · [Coordinate report](GATE_COORDINATE_REPORT.md) · [Data verification](DATA_VERIFICATION_REPORT.md) · [Operating schedules](OPERATING_SCHEDULES.md) · [Latest execution report](FINAL_EXECUTION_REPORT.md) · [Third-party notices](THIRD_PARTY_NOTICES.md)

## Run locally

Use Node 26 (`.nvmrc`). This release was tested with Node 26.2.0 and npm 11.13.0. From the project directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. If dependencies are already installed, only `npm run dev` is needed.

```sh
npm run typecheck
npm run lint
npm test
npm run validate:data
npm run build
npm run verify:build
npm run preview
```

Serve `dist` over HTTP rather than opening `dist/index.html` with `file://`. Release evidence is in `verification/v10`. Development-only sensor fixtures in `tests/` are excluded from `dist`; their simulated readings are labelled explicitly.

## Static hosting and Home Screen

The GitHub Pages workflow is provided as `deployment/github-pages.yml`. The current Git credential cannot create executable Actions workflows, so this release keeps the file as a template. With a credential permitted to manage workflows, copy it to `.github/workflows/pages.yml`, set Pages to GitHub Actions and publish `dist` when deployment is authorized. This release is prepared for the existing CU-Gate GitHub repository. No repository access or Pages settings are changed by the application. The deployment template does not run automatically. The default relative base works on a root domain; for an explicit repository path:

```sh
VITE_BASE_PATH=/cu-gate-navigator/ npm run build
VITE_BASE_PATH=/cu-gate-navigator/ npm run verify:build
```

The app includes a 180 px Apple touch icon, 192/512 px manifest icons and a 512 px maskable icon, with standalone scope/start URL metadata that supports subdirectory hosting. An older saved shortcut may need to be added again after the hosted site is updated. See [Apple's Add to Home Screen instructions](https://support.apple.com/en-ie/guide/iphone/iphea86e5236/27/ios/27). Expanded map mode works inside the app and does not require browser fullscreen permission.

No service worker is included and offline operation is not guaranteed. Map rendering uses the bundled GeoJSON, not a mandatory paid tile service. Online place search and external directions require a network connection. See the third-party notices for data and dependency licenses.

## License

Copyright (c) 2026 HopeZaa.

The original application source code and original project documentation are licensed under the [GNU General Public License v3.0 only (GPL-3.0-only)](LICENSE).

CU Gate Navigator is free software: you can redistribute it and/or modify it under version 3 of the GNU General Public License as published by the Free Software Foundation. It is distributed without any warranty; see [LICENSE](LICENSE) for the complete terms.

This licensing change applies to this revision. Historical revisions keep their recorded MIT license notices in Git history.

Bundled OpenStreetMap data, including map geometry and OSM-derived records, remain under the Open Database License (ODbL). Dependencies, cited university materials and other third-party content retain their respective rights and license terms. See [Third-party notices](THIRD_PARTY_NOTICES.md) for details.
