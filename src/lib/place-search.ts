import local from "../data/places.json";
import { origins } from "./origins";
import type { StartingPoint } from "./origins";
const normalize = (s: string) => s.normalize("NFKC").toLocaleLowerCase().trim();
export function coordinatePlace(query: string): StartingPoint | null {
  const m = query
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const latitude = Number(m[1]),
    longitude = Number(m[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return {
    id: `coordinates-${latitude}-${longitude}`,
    name: `${latitude}, ${longitude}`,
    nameEn: `${latitude}, ${longitude}`,
    latitude,
    longitude,
    type: "selected-place",
    source: "https://www.openstreetmap.org/",
    reviewedAt: new Date().toISOString().slice(0, 10),
    notesTh: "พิกัดที่คุณกรอกเอง ไม่ใช่ GPS ของอุปกรณ์",
  };
}
export function searchLocalPlaces(query: string): StartingPoint[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const coordinate = coordinatePlace(query);
  if (coordinate) return [coordinate];
  return [...origins, ...(local as StartingPoint[])]
    .filter((p) => normalize(`${p.name} ${p.nameEn}`).includes(q))
    .slice(0, 7);
}
type PhotonFeature = {
  geometry?: { type?: string; coordinates?: unknown[] };
  properties?: Record<string, unknown>;
};
export function parsePhotonPlaces(value: unknown): StartingPoint[] {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { features?: unknown }).features)
  )
    return [];
  return (value as { features: PhotonFeature[] }).features
    .flatMap((f, i) => {
      const coords = f.geometry?.coordinates,
        p = f.properties;
      if (
        f.geometry?.type !== "Point" ||
        !coords ||
        !p ||
        typeof coords[0] !== "number" ||
        typeof coords[1] !== "number" ||
        !Number.isFinite(coords[0]) ||
        !Number.isFinite(coords[1]) ||
        Math.abs(coords[0]) > 180 ||
        Math.abs(coords[1]) > 90
      )
        return [];
      const name =
        typeof p.name === "string"
          ? p.name
          : typeof p.street === "string"
            ? p.street
            : null;
      if (!name) return [];
      const parts = [p.street, p.district, p.city, p.country].filter(
        (x) => typeof x === "string" && x !== name,
      );
      const kind =
        p.osm_type === "N" ? "node" : p.osm_type === "R" ? "relation" : "way";
      return [
        {
          id: `photon-${String(p.osm_type || "place")}-${String(p.osm_id || i)}`,
          name: [name, ...new Set(parts)].join(" · "),
          nameEn: [name, ...new Set(parts)].join(" · "),
          latitude: coords[1],
          longitude: coords[0],
          source:
            typeof p.osm_id === "number"
              ? `https://www.openstreetmap.org/${kind}/${p.osm_id}`
              : "https://photon.komoot.io/",
          reviewedAt: new Date().toISOString().slice(0, 10),
          type: "selected-place" as const,
          notesTh:
            "ผลค้นหาสถานที่จาก Photon / OpenStreetMap ไม่ใช่ GPS ของอุปกรณ์",
        },
      ];
    })
    .slice(0, 6);
}
const cache = new Map<string, StartingPoint[]>();
let lastRequest = -Infinity;
export async function searchOnlinePlaces(
  query: string,
  lang: string,
  signal: AbortSignal,
): Promise<StartingPoint[]> {
  const q = query.trim();
  if (q.length < 2 || q.length > 140 || /^https?:/i.test(q)) return [];
  const key = `${lang}:${normalize(q)}`;
  if (cache.has(key)) return cache.get(key)!;
  if (Date.now() - lastRequest < 1100)
    throw new Error("Please wait a moment before searching again.");
  lastRequest = Date.now();
  const configResponse = await fetch(
    `${import.meta.env.BASE_URL}location-search.json`,
    { signal },
  );
  if (!configResponse.ok) throw new Error("Place search is unavailable.");
  const config = (await configResponse.json()) as {
    enabled?: boolean;
    endpoint?: string;
  };
  if (
    !config.enabled ||
    typeof config.endpoint !== "string" ||
    !config.endpoint.startsWith("https://")
  )
    throw new Error("Online place search is unavailable.");
  const url = new URL(config.endpoint);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "6");
  url.searchParams.set("lat", "13.738");
  url.searchParams.set("lon", "100.531");
  if (lang === "en") url.searchParams.set("lang", "en");
  // Only a submitted place query and a public campus bias leave the device.
  // Never send device GPS, heading or a keystroke-by-keystroke request stream.
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
    referrerPolicy: "strict-origin-when-cross-origin",
  });
  if (!response.ok) throw new Error("Online place search is unavailable.");
  const result = parsePhotonPlaces(await response.json());
  cache.set(key, result);
  if (cache.size > 30) cache.delete(cache.keys().next().value!);
  return result;
}
