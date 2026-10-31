import { readFile, access, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const root = resolve(process.env.VERIFY_DIST_DIR || "dist");
const html = await readFile(resolve(root, "index.html"), "utf8");
const base = process.env.VITE_BASE_PATH || "./";
const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
for (const url of urls) {
  if (/^(?:https?:|data:|#)/.test(url)) continue;
  assert.ok(url.startsWith(base), `Unexpected asset base: ${url}`);
  await access(resolve(root, url.slice(base.length)));
}
// Validate the actual installed-app resources for root and repository base paths.
const manifest = JSON.parse(
  await readFile(resolve(root, "app.webmanifest"), "utf8"),
);
assert.equal(manifest.display, "standalone");
assert.ok(manifest.name && manifest.short_name);
const appUrl = new URL(base === "./" ? "/" : base, "https://example.test");
const manifestUrl = new URL("app.webmanifest", appUrl);
assert.equal(new URL(manifest.scope, manifestUrl).pathname, appUrl.pathname);
assert.equal(new URL(manifest.id, manifestUrl).pathname, appUrl.pathname);
assert.equal(
  new URL(manifest.start_url, manifestUrl).pathname,
  appUrl.pathname,
);
assert.ok(
  manifest.icons.some((i) => i.sizes === "192x192" && i.purpose === "any"),
);
assert.ok(
  manifest.icons.some((i) => i.sizes === "512x512" && i.purpose === "any"),
);
assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));
for (const icon of [
  ...manifest.icons,
  { src: "./apple-touch-icon.png", sizes: "180x180" },
]) {
  assert.ok(/^\.\/[a-z0-9-]+\.png$/.test(icon.src));
  const png = await readFile(resolve(root, icon.src));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
}
assert.ok(html.includes('rel="apple-touch-icon"'));
assert.ok(html.includes('name="apple-mobile-web-app-capable" content="yes"'));
const geo = JSON.parse(await readFile(resolve(root, "campus.geojson"), "utf8"));
assert.equal(geo.type, "FeatureCollection");
assert.ok(geo.features.length > 0);
assert.ok(geo.features.some((f) => f.properties.kind === "road"));
assert.ok(geo.features.some((f) => f.properties.kind === "building"));
for (const name of [
  "GATE_DATA_SOURCES.md",
  "GATE_COORDINATE_REPORT.md",
  "DATA_VERIFICATION_REPORT.md",
])
  await access(resolve(root, "research", name));
async function files(path) {
  return (
    await Promise.all(
      (await readdir(path, { withFileTypes: true })).map(async (e) =>
        e.isDirectory()
          ? files(resolve(path, e.name))
          : [resolve(path, e.name)],
      ),
    )
  ).flat();
}
await access(resolve(root, "research", "owner-gates-2026-11-01.txt"));
const all = await files(root);
assert.ok(
  !all.some(
    (p) =>
      p.includes("gps-harness") ||
      p.includes("status-harness") ||
      p.includes("reference-harness") ||
      p.includes("map-review") ||
      p.includes("map-candidates") ||
      p.includes("qa-status") ||
      p.includes("node_modules"),
  ),
  "Test fixture or dependencies leaked into static output",
);
for (const path of all.filter(
  (p) => p.endsWith(".js") || p.endsWith(".html"),
)) {
  const text = await readFile(path, "utf8");
  assert.ok(
    !/https?:\/\/(localhost|127\.0\.0\.1)(?::|\/)/.test(text),
    `Local server dependency in ${path}`,
  );
  assert.ok(
    ![
      "map-review",
      "map-candidates",
      "qa-open",
      "qa-time",
      "qa-clock",
      "gps-harness",
      "status-harness",
      "reference-harness",
    ].some((name) => text.includes(name)),
    `Development fixture content in ${path}`,
  );
}
console.log(
  JSON.stringify(
    {
      result: "PASS",
      base,
      htmlAssets: urls.length,
      homeScreenIcons: "PASS (180 / 192 / 512 and maskable)",
      standaloneScope: appUrl.pathname,
      geojsonFeatures: geo.features.length,
      staticFiles: all.length,
      productionLocalhostDependencies: 0,
      testFixtureIncluded: false,
    },
    null,
    2,
  ),
);
