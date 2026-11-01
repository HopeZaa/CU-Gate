export type HeadingState =
  | "idle"
  | "waiting"
  | "active"
  | "denied"
  | "unsupported";
export type CompassSample = {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
  alpha?: number | null;
  absolute?: boolean;
};
export const normalizeHeading = (value: number) => ((value % 360) + 360) % 360;
// Relative alpha does not establish north. Only a compass reading or absolute
// orientation is allowed to draw the direction cone.
export function compassHeading(
  sample: CompassSample,
  screenAngle = 0,
): number | null {
  if (
    typeof sample.webkitCompassHeading === "number" &&
    Number.isFinite(sample.webkitCompassHeading)
  ) {
    if (
      typeof sample.webkitCompassAccuracy === "number" &&
      sample.webkitCompassAccuracy < 0
    )
      return null;
    return normalizeHeading(sample.webkitCompassHeading + screenAngle);
  }
  if (
    sample.absolute === true &&
    typeof sample.alpha === "number" &&
    Number.isFinite(sample.alpha)
  )
    return normalizeHeading(360 - sample.alpha + screenAngle);
  return null;
}
export type OrientationPermission = {
  requestPermission?: (
    absolute?: boolean,
  ) => Promise<"granted" | "denied" | "prompt">;
};
export function startHeadingWatch(
  target: EventTarget,
  api: OrientationPermission | undefined,
  onHeading: (heading: number) => void,
  onState: (state: HeadingState) => void,
  angle: () => number = () => 0,
): () => void {
  let stopped = false,
    attached = false,
    last = -Infinity;
  const listener = (event: Event) => {
    const now = performance.now();
    if (stopped || now - last < 60) return;
    const heading = compassHeading(event as Event & CompassSample, angle());
    if (heading === null) return;
    last = now;
    onHeading(heading);
    onState("active");
  };
  const attach = () => {
    if (stopped) return;
    attached = true;
    target.addEventListener("deviceorientationabsolute", listener);
    target.addEventListener("deviceorientation", listener);
    onState("waiting");
  };
  if (!api) onState("unsupported");
  else if (api.requestPermission) {
    onState("waiting");
    // Called directly by a GPS/compass button gesture, including on iOS.
    try {
      void api
        .requestPermission(true)
        .then((result) => {
          if (stopped) return;
          if (result === "granted") attach();
          else onState("denied");
        })
        .catch(() => {
          if (!stopped) onState("denied");
        });
    } catch {
      onState("denied");
    }
  } else attach();
  return () => {
    stopped = true;
    if (attached) {
      target.removeEventListener("deviceorientationabsolute", listener);
      target.removeEventListener("deviceorientation", listener);
    }
  };
}
