import { includesMode, recordedMode, travelModes } from "./travel";
import type { Gate, Schedule, TravelMode, VerificationStatus } from "./data";
import type { StartingPoint } from "./origins";
export type Position = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  heading?: number;
  speed?: number;
};
export type AccessState =
  | "confirmed"
  | "possible"
  | "unknown"
  | "closed"
  | "not-permitted";
export const accessLabels: Record<AccessState, string> = {
  confirmed: "Accessible by verified records",
  possible: "Possibly accessible",
  unknown: "Access unknown",
  closed: "Closed by verified schedule",
  "not-permitted": "Not permitted by verified records",
};
export function hasCoordinates(
  g: Gate,
): g is Gate & { latitude: number; longitude: number } {
  return g.latitude !== null && g.longitude !== null;
}
export function haversine(a: Position, b: Position): number {
  const rad = Math.PI / 180,
    dLat = (b.latitude - a.latitude) * rad,
    dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(dLon / 2) ** 2;
  return 6371008.8 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}
export function distanceText(m: number | null): string {
  return m === null
    ? "Locate to see distance"
    : m < 1000
      ? `${Math.round(m)} m straight line`
      : `${(m / 1000).toFixed(2)} km straight line`;
}
export function bangkokParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      get("weekday"),
    ),
    minute: Number(get("hour")) * 60 + Number(get("minute")),
  };
}
const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
export function weeklyClockState(
  schedule: Pick<Schedule, "intervals">,
  now: Date,
): "open" | "closed" {
  const p = bangkokParts(now);
  const previous = (p.day + 6) % 7;
  return schedule.intervals.some((i) => {
    const start = minutes(i.open),
      end = minutes(i.close);
    return end > start
      ? i.days.includes(p.day) && p.minute >= start && p.minute < end
      : (i.days.includes(p.day) && p.minute >= start) ||
          (i.days.includes(previous) && p.minute < end);
  })
    ? "open"
    : "closed";
}
export function scheduleState(
  schedule: Schedule | null,
  now: Date,
  holiday: boolean | null = null,
): "open" | "closed" | "unknown" {
  if (!schedule || schedule.verificationStatus !== "VERIFIED") return "unknown";
  const p = bangkokParts(now);
  if (
    (schedule.validFrom && p.date < schedule.validFrom) ||
    (schedule.validThrough && p.date > schedule.validThrough)
  )
    return "unknown";
  if (
    schedule.holidayPolicy === "unknown" ||
    (schedule.holidayPolicy === "closed" && holiday === null)
  )
    return "unknown";
  if (schedule.holidayPolicy === "closed" && holiday) return "closed";
  return weeklyClockState(schedule, now);
}
export function permission(g: Gate, mode: TravelMode): boolean | null {
  if (g.accessVerificationStatus !== "VERIFIED") return null;
  if (
    travelModes.some((m) => includesMode(m, mode) && g.permissions[m] === true)
  )
    return true;
  return g.permissions[mode];
}
export function directionPermission(
  g: Gate,
  direction: "entry" | "exit",
): boolean | null {
  return g.accessVerificationStatus === "VERIFIED"
    ? direction === "entry"
      ? g.entryAllowed
      : g.exitAllowed
    : null;
}
export function accessState(
  g: Gate,
  mode: TravelMode,
  direction: "entry" | "exit",
  now: Date,
): AccessState {
  const modePermission = permission(g, mode),
    dir = directionPermission(g, direction),
    schedule = scheduleState(g.schedule, now);
  if (modePermission === false || dir === false) return "not-permitted";
  if (schedule === "closed") return "closed";
  if (
    g.verificationStatus === "VERIFIED" &&
    modePermission === true &&
    dir === true &&
    schedule === "open" &&
    g.accessType === "public" &&
    !g.specialRestrictions &&
    hasCoordinates(g) &&
    g.coordinateVerificationStatus === "VERIFIED"
  )
    return "confirmed";
  return modePermission === true || dir === true ? "possible" : "unknown";
}
export type Filters = {
  query: string;
  mode: TravelMode | "all";
  direction: "entry" | "exit";
  verification: VerificationStatus | "all";
  includeUnknown: boolean;
  mappedOnly: boolean;
  sort: "recommended" | "distance" | "name";
};
export const defaultFilters: Filters = {
  query: "",
  mode: "all",
  direction: "entry",
  verification: "all",
  includeUnknown: true,
  mappedOnly: false,
  sort: "recommended",
};
export function filterGates(
  gates: Gate[],
  filters: Filters,
  position: Position | null,
  now: Date,
  retainDenied = false,
): Gate[] {
  const q = filters.query.trim().normalize("NFKC").toLocaleLowerCase();
  const rank: Record<AccessState, number> = {
    confirmed: 0,
    possible: 1,
    unknown: 2,
    closed: 3,
    "not-permitted": 4,
  };
  return gates
    .filter((g) => {
      if (
        q &&
        ![g.name, g.shortNameTh, g.nameEn, g.nearby, g.nearbyTh, ...g.aliases]
          .filter(Boolean)
          .join(" ")
          .normalize("NFKC")
          .toLocaleLowerCase()
          .includes(q)
      )
        return false;
      if (
        filters.verification !== "all" &&
        g.verificationStatus !== filters.verification
      )
        return false;
      if (filters.mappedOnly && !hasCoordinates(g)) return false;
      if (filters.mode !== "all" && recordedMode(g, filters.mode) === false)
        return false;
      const m = filters.mode === "all" ? true : permission(g, filters.mode),
        d = directionPermission(g, filters.direction);
      return (
        (retainDenied || (m !== false && d !== false)) &&
        (filters.includeUnknown || (m !== null && d !== null))
      );
    })
    .sort((a, b) => {
      if (filters.sort === "name")
        return (a.nameEn || a.name).localeCompare(b.nameEn || b.name);
      if (filters.sort === "recommended") {
        const r =
          rank[
            accessState(
              a,
              filters.mode === "all" ? "pedestrian" : filters.mode,
              filters.direction,
              now,
            )
          ] -
          rank[
            accessState(
              b,
              filters.mode === "all" ? "pedestrian" : filters.mode,
              filters.direction,
              now,
            )
          ];
        if (r) return r;
      }
      if (position) {
        const ad = hasCoordinates(a) ? haversine(position, a) : Infinity,
          bd = hasCoordinates(b) ? haversine(position, b) : Infinity;
        if (ad !== bd) return ad - bd;
      }
      const confidence = { HIGH: 0, MEDIUM: 1, LOW: 2, UNKNOWN: 3 };
      return (
        confidence[a.coordinateConfidence] -
          confidence[b.coordinateConfidence] ||
        (a.nameEn || a.name).localeCompare(b.nameEn || b.name)
      );
    });
}
export function directionsUrl(
  g: Gate,
  mode: TravelMode | "all",
  origin?: StartingPoint | null,
): string | null {
  if (!hasCoordinates(g)) return null;
  const params = new URLSearchParams({
    api: "1",
    destination: `${g.latitude},${g.longitude}`,
    travelmode:
      mode === "car"
        ? "driving"
        : mode === "motorcycle"
          ? "two-wheeler"
          : "walking",
  });
  if (origin?.type === "public-landmark" || origin?.type === "selected-place") {
    params.set("origin", `${origin.latitude},${origin.longitude}`);
  }
  return `https://www.google.com/maps/dir/?${params}`;
}
export type QualityKey =
  | "total"
  | "VERIFIED"
  | "HISTORICAL"
  | "UNVERIFIED"
  | "UNKNOWN"
  | "gpsVerified"
  | "gpsApproximate"
  | "gpsUnknown"
  | "vehiclesUnknown"
  | "schedulesUnknown";
export const qualityDefinitions: Record<
  QualityKey,
  {
    label: string;
    description: string;
    matches: (g: Gate, now: Date) => boolean;
  }
> = {
  total: {
    label: "Discovered gate groups",
    description:
      "Named entrance groups in this inventory; paired entry/exit lanes count once. This is not a complete field survey.",
    matches: () => true,
  },
  VERIFIED: {
    label: "Verified information",
    description:
      "Gate records supported by sufficiently reliable, current evidence. Coordinate verification alone does not qualify a gate.",
    matches: (g) => g.verificationStatus === "VERIFIED",
  },
  HISTORICAL: {
    label: "Historical information",
    description:
      "Older official evidence whose present validity has not been established.",
    matches: (g) => g.verificationStatus === "HISTORICAL",
  },
  UNVERIFIED: {
    label: "Unverified information",
    description: "Reported entrances not independently confirmed.",
    matches: (g) => g.verificationStatus === "UNVERIFIED",
  },
  UNKNOWN: {
    label: "Unknown information",
    description: "Records without reliable supporting information.",
    matches: (g) => g.verificationStatus === "UNKNOWN",
  },
  gpsVerified: {
    label: "Verified GPS coordinates",
    description:
      "A physical mapped gate node, HIGH confidence and VERIFIED coordinate status. These are map-verified points, not field GPS measurements or access confirmation.",
    matches: (g) =>
      hasCoordinates(g) &&
      g.coordinateConfidence === "HIGH" &&
      g.coordinateVerificationStatus === "VERIFIED",
  },
  gpsApproximate: {
    label: "Approximate GPS coordinates",
    description:
      "Usable coordinates that are not in the verified coordinate group, including MEDIUM, LOW or unverified points.",
    matches: (g) =>
      hasCoordinates(g) &&
      !(
        g.coordinateConfidence === "HIGH" &&
        g.coordinateVerificationStatus === "VERIFIED"
      ),
  },
  gpsUnknown: {
    label: "Unknown coordinates",
    description:
      "No usable latitude/longitude pair. Not shown on the map; directions disabled.",
    matches: (g) => !hasCoordinates(g),
  },
  vehiclesUnknown: {
    label: "Unknown vehicle permissions",
    description:
      "At least one of car or motorcycle permission is unknown or lacks current verified evidence.",
    matches: (g) =>
      permission(g, "car") === null || permission(g, "motorcycle") === null,
  },
  schedulesUnknown: {
    label: "Unknown operating schedules",
    description:
      "No currently applicable, verified weekly schedule, including records with uncertain holiday rules. Evaluated in Asia/Bangkok.",
    matches: (g, now) => scheduleState(g.schedule, now) === "unknown",
  },
};
export function qualityRows(gates: Gate[], key: QualityKey, now: Date): Gate[] {
  return gates.filter((g) => qualityDefinitions[key].matches(g, now));
}
export function qualityStats(
  gates: Gate[],
  now: Date,
): Record<QualityKey, number> {
  return Object.fromEntries(
    (Object.keys(qualityDefinitions) as QualityKey[]).map((k) => [
      k,
      qualityRows(gates, k, now).length,
    ]),
  ) as Record<QualityKey, number>;
}
