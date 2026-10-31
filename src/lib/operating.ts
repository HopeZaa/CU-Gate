import { dataset } from "./data";
import type { Gate, TravelMode } from "./data";
import { bangkokParts, weeklyClockState } from "./gates";
import { includesMode, travelModes } from "./travel";

export type OperatingRule = Gate["operatingRules"][number] & {
  inheritedFrom?: TravelMode;
};
const sourceDate = (rule: OperatingRule) =>
  dataset?.sources.find((s) => s.id === rule.source)?.publishedAt || "";
const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
const clock = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
type Range = [number, number];
function merge(ranges: Range[]): Range[] {
  return ranges
    .sort((a, b) => a[0] - b[0])
    .reduce<Range[]>((out, r) => {
      const last = out.at(-1);
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else out.push([...r]);
      return out;
    }, []);
}
function subtract(ranges: Range[], blocked: Range[]): Range[] {
  return blocked.reduce(
    (rest, b) =>
      rest.flatMap((r) =>
        r[1] <= b[0] || r[0] >= b[1]
          ? [r]
          : (
              [
                [r[0], Math.min(r[1], b[0])],
                [Math.max(r[0], b[1]), r[1]],
              ] as Range[]
            ).filter((x) => x[0] < x[1]),
      ),
    ranges,
  );
}
// Select the newest source within each declared mode, then union all modes
// which include the requested one. A newer walking rule cannot erase car access.
function selected(g: Gate, mode: TravelMode, day: number): OperatingRule[] {
  const rules = travelModes
    .filter((m) => includesMode(m, mode))
    .flatMap((m) => {
      const r = [...g.operatingRules]
        .filter((r) => r.modes.includes(m) && r.coveredDays.includes(day))
        .sort(
          (a, b) =>
            sourceDate(b).localeCompare(sourceDate(a)) ||
            a.modes.length - b.modes.length,
        )[0];
      return r ? [r] : [];
    });
  return [...new Set(rules)];
}
function dayRanges(
  g: Gate,
  mode: TravelMode,
  direction: "entry" | "exit",
  day: number,
  seen: string[] = [],
): Range[] {
  if (seen.includes(g.id)) return [];
  const ranges: Range[] = [];
  for (const offset of [-1, 0]) {
    const sourceDay = (day + offset + 7) % 7;
    for (const r of selected(g, mode, sourceDay)) {
      if (!(direction === "entry" ? r.entryAllowed : r.exitAllowed)) continue;
      let local: Range[] = r.schedule.intervals
        .filter((i) => i.days.includes(sourceDay))
        .map((i) => {
          const start = minutes(i.open) + offset * 1440;
          const end =
            minutes(i.close) +
            offset * 1440 +
            (minutes(i.close) < minutes(i.open) ? 1440 : 0);
          return [Math.max(0, start), Math.min(1440, end)] as Range;
        })
        .filter((r) => r[0] < r[1]);
      if (direction === "exit" && r.exitWhenClosedGate) {
        const target = dataset?.gates.find(
          (x) => x.id === r.exitWhenClosedGate,
        );
        // Unknown linked hours cannot establish a conditional exit window.
        local =
          target && selected(target, mode, day).length
            ? subtract(
                local,
                dayRanges(target, mode, "exit", day, [...seen, g.id]),
              )
            : [];
      }
      ranges.push(...local);
    }
  }
  return merge(ranges);
}
export function operatingRule(
  g: Gate,
  mode: TravelMode | "all",
  now: Date,
  direction: "entry" | "exit" = "entry",
): OperatingRule | null {
  const m = mode === "all" ? "pedestrian" : mode;
  const p = bangkokParts(now);
  const rules = selected(g, m, p.day);
  const previous = selected(g, m, (p.day + 6) % 7).filter((r) =>
    r.schedule.intervals.some(
      (i) =>
        i.days.includes((p.day + 6) % 7) &&
        minutes(i.close) < minutes(i.open) &&
        p.minute < minutes(i.close),
    ),
  );
  if (!rules.length && !previous.length) return null;
  const candidates = [...new Set([...rules, ...previous])];
  const active = candidates.filter(
    (r) =>
      (direction === "entry" ? r.entryAllowed : r.exitAllowed) &&
      weeklyClockState(r.schedule, now) === "open",
  );
  const representative = (active.length ? active : candidates).sort(
    (a, b) =>
      Number(b.modes.includes(m)) - Number(a.modes.includes(m)) ||
      sourceDate(b).localeCompare(sourceDate(a)),
  )[0];
  const intervals = [0, 1, 2, 3, 4, 5, 6].flatMap((day) =>
    dayRanges(g, m, direction, day).map(([start, end]) => ({
      days: [day],
      open: clock(start),
      close: clock(end),
    })),
  );
  const allowed = candidates.some((r) =>
    direction === "entry" ? r.entryAllowed : r.exitAllowed,
  );
  const inheritedFrom = representative.modes.find((x) => includesMode(x, m));
  return {
    ...representative,
    inheritedFrom: inheritedFrom !== m ? inheritedFrom : undefined,
    entryAllowed: direction === "entry" ? allowed : representative.entryAllowed,
    exitAllowed: direction === "exit" ? allowed : representative.exitAllowed,
    exitWhenClosedGate: null,
    coveredDays: [0, 1, 2, 3, 4, 5, 6].filter(
      (day) => selected(g, m, day).length > 0,
    ),
    schedule: { ...representative.schedule, intervals },
  };
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
