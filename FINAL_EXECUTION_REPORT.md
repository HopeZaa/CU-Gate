# CU Gate Navigator — release 1.9

Rolled the previous implementation back to the saved 1.7 source, then rebuilt the map interactions and resizable details. The requested typed starting points, location/compass display, single recommended gate, list update notification, full-card selection, compact footer and English README are included.

## Marker regression and repair

Version 1.8 assigned `className` to a MapLibre-owned marker after attaching it. This removed the map engine's positioning classes. It also reused that pattern for successive GPS fixes. The resulting elements could lose absolute positioning and drift away from their geographical points during zoom or state updates.

Each gate now has a permanent outer MapLibre anchor and a separate inner button. Application status classes, selection size and the recommendation halo update only the inner visual. Device and reference-location markers use the same separation. Subpixel positioning keeps centres aligned during zoom. Map labels retain their engine-owned positioning classes.

Camera actions are explicit. Selecting a card/pin zooms to the gate; location/compass/status updates and details-height changes do not trigger that selection zoom again. Manual pan/zoom pauses GPS following. Resizing the map viewport preserves its camera instead of resetting campus bounds.

## Verification

TypeScript, ESLint, all 134 tests in 10 files, and 20 data-validation tests passed. Root `./` and repository `/CU-Gate/` production builds passed static verification. Icons, manifest scope, relative assets, optional search configuration and exclusion of development fixtures were checked. The development-only map diagnostic hook is absent from production JavaScript.

Three recorded zoom/pan regressions cover 12 transitions each: desktop, selected details, and mobile with GPS/compass updates. All 19 gate centres remained within 1 px of the projection of their actual gate JSON coordinates. The mobile GPS run also measured the device dot; its maximum measured error across the gate/device samples was below 0.001 px. This tests rendered alignment, not real-world survey accuracy.

The mobile details handle was dragged down to 379 px in the production app; the selected gate stayed visible above it. A separate regression confirmed manual zoom 16.2 remained 16.2 after keyboard resizing. Full-card clicks on the time area opened and zoomed the requested gate. Thai starting-point input returned local results and selected the MRT reference point.

At 320×740 the expanded legend and OpenStreetMap credit shared a 33 px footer, with no horizontal page overflow. Full-map mode, Thai/English and light/dark themes were checked. The production browser console contained no warnings/errors during the recorded run. Original gate JSON and campus geometry match version 1.7 byte for byte: 21 main vehicle groups, 19 mapped points, 8 map-verified points, 11 approximate points and 2 unresolved locations.

GPS integration used an explicitly labelled simulated public-coordinate fixture. One watch delivered multiple fixes, the compass cone changed between east and north, exactly one recommended gate was highlighted, and opening the list acknowledged its update dot. An outside-campus fix removed the dot; Stop cleared the watch once. Real phone sensors, physical gate conditions and Home Screen installation were not tested. Historical operating schedules remain the owner's adopted baseline; unverified records are not current access confirmation.

Evidence is in `verification/v10/`. Temporary QA tabs were closed, the viewport reset and owned preview servers stopped. The complete release is prepared for replacement in the owner's existing `~/Desktop/Code/Web/CU-Gate` checkout and the requested commit/push. Git metadata, origin and local dependencies are preserved during replacement; push confirmation is recorded separately after execution.

The initial GitHub push rejected creation of `.github/workflows/pages.yml` because the existing Personal Access Token has no workflow scope. The deployment definition is retained in `deployment/github-pages.yml` as a non-executing template, allowing the app source, dist and documentation to be committed and pushed without expanding credential permissions. No automated deployment is claimed.
