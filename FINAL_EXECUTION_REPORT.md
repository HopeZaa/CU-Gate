# CU Gate Navigator — release 1.8 verification

Implemented typed starting points, live location and compass display, full-card selection with map zoom, resizable gate details, a compact legend/credit footer, left-aligned option labels and visible Near me recommendations. README.md is now entirely English. Gate data and map geometry are unchanged from release 1.7.

## Delivered behavior

- Starting-point input supports instant Thai/English local place matching, direct coordinate entry, the existing MRT preset and explicit online Photon search. A separate reference marker distinguishes a selected place from device GPS. A successful public-place query for Siam Paragon was observed in both development and production browsers.
- GPS uses one continuing high-accuracy watch with fresh fixes. Position and accuracy circle update together. A device compass cone updates from supported absolute readings; a moving GPS course is a labelled fallback. Relative orientation alone is ignored. The device dot is removed outside the bundled campus coverage. GPS and orientation listeners stop together.
- Near me highlights exactly one candidate with a 3.2-second halo and star. It prefers the closest scheduled-open mapped gate within current filters. A fallback is labelled check hours. The mobile gate-list button receives a notification dot and a subtle three-cycle pulse, acknowledged when the list opens. Reduced-motion settings disable these animations.
- The complete gate card is clickable through the accessible details button's stretched hit target. The Directions link retains its own hit target. Selection zooms to at least 17.2 on desktop and mobile, with space allowed for the details panel. Re-selecting a gate re-centres it.
- The details panel has a visible grip, bilingual drag hint and draggable top edge. Click and keyboard resizing are also supported. Existing status, weekly schedule, directions and source content remain scrollable.
- The pin guide was removed. The legend and linked OpenStreetMap credit stay on a single footer row in normal and expanded map views. Expanded legend content scrolls within its own space on narrow screens. Coordinate-checkbox text is aligned beside the checkbox on the left.

## Checks completed

TypeScript and ESLint passed. All **134 tests in 10 files** passed; the data-only validation suite passed 20 tests. New tests cover heading normalization, permission/cleanup behavior, local/coordinate/provider-result parsing, nearest recommendations, map coverage and resize bounds.

Default `./` and explicit `/cu-gate-navigator/` production builds passed. Static verification checks include local asset resolution, relative manifest scope/start URL, 180/192/512 px Home Screen icons, HTTPS place-search configuration, map geometry, and exclusion of development fixtures and archived pedestrian-only inventory. Vite reported non-fatal annotation warnings inside Zod; builds completed successfully.

Browser checks covered 1280×720 desktop, 390×844 mobile and 320×740 narrow mobile layouts; light/dark themes and Thai/English labels. Clicking the time area of a gate card opened details and zoomed the map. Desktop top-edge dragging reduced the panel from 570 to 435 px, and keyboard Down reduced it to 403 px. Production mobile dragging reduced a roughly 506 px panel to 394 px while leaving the selected marker visible above it. At 320 px, the expanded footer remained 33 px high, with the credit inside the viewport and no horizontal page overflow.

Controlled sensor integration used `tests/live-location-harness.html`, explicitly labelled “TEST FIXTURE — no device location.” Public gate-coordinate fixes moved A to C with one watch and two updates; the single highlighted gate changed accordingly. Compass samples changed the displayed cone from east (90°) to north (0°). Opening the gate list cleared its notification dot. An outside-campus fix removed the device dot; Stop cleared the watch. This is software integration evidence, not a physical-device sensor test or campus walk.

The production browser console had no warnings or errors during the recorded run. Temporary browser viewport settings were reset, QA tabs were closed and the development/production preview servers started for this task were stopped.

## Data integrity and limits

Byte comparison against the prior release confirmed unchanged `src/data/gates.json` and `public/campus.geojson`. There are still 21 main vehicle gate groups, 19 mapped points, 8 map-verified coordinates, 11 approximate points and 2 unresolved locations. The dynamic dashboard continues to expose 21 inspectable records and the original evidence classifications. The new 698-record place index contains reference locations, not additional gates or newly verified entrances.

Historical schedules remain the owner's adopted working baseline. The app has no live gate feed or special-closure calendar. Unverified evidence is not confirmed real-world access information. Actual phone compass/GPS performance and Home Screen installation still require device testing. Optional Photon service availability depends on its provider; local place matching and coordinate entry remain available without it. No remote repository, hosting settings or deployment was changed.

Evidence: `verification/v9/` contains screenshots, browser observations, scope hashes, console output and build/test logs. The source, static dist and ZIP are release 1.8.0.
