import { dataset } from "./data";
import type { Gate, TravelMode } from "./data";
import { bangkokParts, weeklyClockState } from "./gates";

export type OperatingRule = Gate["operatingRules"][number];
const sourceDate = (rule: OperatingRule) =>
  dataset?.sources.find((s) => s.id === rule.source)?.publishedAt || "";

// These are adopted working rules. They deliberately retain HISTORICAL status;
// the quality dashboard and verified access functions continue to report provenance.
export function operatingRule(
  g: Gate,
  mode: TravelMode | "all",
  now: Date,
): OperatingRule | null {
  const m = mode === "all" ? "pedestrian" : mode;
  const p = bangkokParts(now);
  const mins = (value: string) =>
    Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  return (
    [...g.operatingRules]
      .filter(
        (r) =>
          r.modes.includes(m) &&
          (r.coveredDays.includes(p.day) ||
            r.schedule.intervals.some(
              (i) =>
                i.days.includes((p.day + 6) % 7) &&
                mins(i.close) < mins(i.open) &&
                p.minute < mins(i.close),
            )),
      )
      .sort(
        (a, b) =>
          sourceDate(b).localeCompare(sourceDate(a)) ||
          a.modes.length - b.modes.length,
      )[0] || null
  );
}

export function operatingClock(
  rule: OperatingRule,
  now: Date,
  holiday = false,
): "open" | "closed" {
  if (holiday && rule.schedule.holidayPolicy === "closed") return "closed";
  return weeklyClockState(rule.schedule, now);
}

export function hasOperatingHours(
  g: Gate,
  mode: TravelMode | "all",
  now: Date,
) {
  return g.schedule !== null || operatingRule(g, mode, now) !== null;
}
