import type { Gate, TravelMode } from "./data";
import type { Position } from "./gates";
import { hasCoordinates, haversine } from "./gates";
import { gateAvailability } from "./availability";
export function withinCampusMap(p: Position) {
  return (
    p.latitude >= 13.727 &&
    p.latitude <= 13.75 &&
    p.longitude >= 100.518 &&
    p.longitude <= 100.538
  );
}
export function nearestSuggestion(
  gates: Gate[],
  origin: Position,
  mode: TravelMode | "all",
  direction: "entry" | "exit",
  now: Date,
) {
  const mapped = gates.filter(hasCoordinates);
  const open = mapped.filter(
    (g) => gateAvailability(g, mode, direction, now, "en").state === "open",
  );
  const candidates = open.length ? open : mapped;
  const gate = [...candidates].sort(
    (a, b) =>
      haversine(origin, a) - haversine(origin, b) || a.id.localeCompare(b.id),
  )[0];
  return gate
    ? { gate, distance: haversine(origin, gate), open: open.length > 0 }
    : null;
}
export const clampDetailHeight = (height: number, viewportHeight: number) =>
  Math.round(
    Math.max(160, Math.min(height, Math.max(160, viewportHeight - 90))),
  );
