import type { Position } from "./gates";
export type GPSState =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported"
  | "insecure"
  | "paused";
export const gpsMessages: Record<GPSState, string> = {
  idle: "Your location stays on this device.",
  requesting: "Waiting for location permission…",
  active: "Location updates are on.",
  denied:
    "Location permission denied. Allow it in your browser’s site settings, then retry.",
  unavailable:
    "Your location is unavailable. Try again outdoors or with location services enabled.",
  timeout: "Location request timed out. Try again.",
  unsupported: "This browser does not support geolocation.",
  insecure: "Location needs HTTPS or localhost.",
  paused: "Location updates paused. Locate again to resume.",
};
export function startLocationWatch(
  geo: Geolocation | undefined,
  onPosition: (p: Position) => void,
  onState: (s: GPSState) => void,
  secure = true,
): () => void {
  if (!secure) {
    onState("insecure");
    return () => {};
  }
  if (!geo) {
    onState("unsupported");
    return () => {};
  }
  onState("requesting");
  let stopped = false,
    id: number | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (id !== undefined) geo.clearWatch(id);
  };
  try {
    id = geo.watchPosition(
      (p) => {
        if (stopped) return;
        const { latitude, longitude, accuracy } = p.coords;
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          !Number.isFinite(accuracy) ||
          accuracy < 0 ||
          Math.abs(latitude) > 90 ||
          Math.abs(longitude) > 180
        ) {
          onState("unavailable");
          stop();
          return;
        }
        onPosition({ latitude, longitude, accuracy, timestamp: p.timestamp });
        onState("active");
      },
      (e) => {
        if (stopped) return;
        onState(
          e.code === 1 ? "denied" : e.code === 3 ? "timeout" : "unavailable",
        );
        stop();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
    if (stopped && id !== undefined) geo.clearWatch(id);
  } catch {
    onState("unavailable");
    stop();
  }
  return stop;
}
