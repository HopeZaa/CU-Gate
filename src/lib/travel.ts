import type { Gate, TravelMode } from "./data";

export const travelModes: TravelMode[] = ["pedestrian", "motorcycle", "car"];
// Owner's operational rule: a higher-capacity mode includes the lower modes.
// This never changes the original direction, schedule or authorization condition.
export const includesMode = (allowed: TravelMode, requested: TravelMode) =>
  travelModes.indexOf(allowed) >= travelModes.indexOf(requested);

export function recordedMode(g: Gate, mode: TravelMode): boolean | null {
  if (g.accessProfile) return includesMode(g.accessProfile.highestMode, mode);
  return null;
}

export const sourceHref = (url: string) =>
  url.startsWith("research/") ? `${import.meta.env.BASE_URL}${url}` : url;
