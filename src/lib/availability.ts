import { recordedMode } from "./travel";
import type { Gate, Schedule, TravelMode } from "./data";
import {
  accessState,
  bangkokParts,
  directionPermission,
  permission,
  scheduleState,
} from "./gates";
import type { Language } from "./i18n";
import { operatingClock, operatingRule } from "./operating";
import type { OperatingRule } from "./operating";

export type Availability = "open" | "closed" | "restricted" | "unknown";
export type AvailabilityFilter = "all" | "open";
export type GateAvailability = {
  state: Availability;
  label: string;
  reason: string;
  today: string;
  next: string | null;
  basis: "verified" | "reference" | "recorded" | "missing";
  source: string | null;
  condition: string | null;
  access: string;
};
const minute = (value: string) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
const clock = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
type Window = { start: number; end: number };

// Windows use minutes relative to today's midnight in Bangkok. Include yesterday's
// overnight tail, merge touching intervals, and clip to the evidence's validity.
function windows(schedule: Schedule, now: Date): Window[] {
  const p = bangkokParts(now);
  const midnight = new Date(`${p.date}T00:00:00+07:00`).getTime();
  const from = schedule.validFrom
    ? (new Date(`${schedule.validFrom}T00:00:00+07:00`).getTime() - midnight) /
      60000
    : -Infinity;
  const through = schedule.validThrough
    ? (new Date(`${schedule.validThrough}T00:00:00+07:00`).getTime() -
        midnight) /
        60000 +
      1440
    : Infinity;
  const ranges: Window[] = [];
  for (let offset = -1; offset <= 8; offset++) {
    const day = (p.day + offset + 7) % 7;
    for (const interval of schedule.intervals) {
      if (!interval.days.includes(day)) continue;
      const start = offset * 1440 + minute(interval.open);
      const end =
        offset * 1440 +
        minute(interval.close) +
        (minute(interval.close) < minute(interval.open) ? 1440 : 0);
      const clipped = {
        start: Math.max(start, from),
        end: Math.min(end, through),
      };
      if (clipped.start < clipped.end) ranges.push(clipped);
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  return ranges.reduce<Window[]>((merged, range) => {
    const last = merged.at(-1);
    if (last && range.start <= last.end)
      last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
    return merged;
  }, []);
}

export function scheduleSummary(
  schedule: Schedule | null,
  now: Date,
  lang: Language,
  adoptedRule: OperatingRule | null = null,
): { today: string; next: string | null } {
  const th = lang === "th";
  if ((!adoptedRule && scheduleState(schedule, now) === "unknown") || !schedule)
    return {
      today: th ? "ไม่มีข้อมูลเวลา" : "Hours unavailable",
      next: null,
    };
  const ranges = windows(schedule, now);
  const today = ranges
    .filter((r) => r.end > 0 && r.start < 1440)
    .map((r) => ({ start: Math.max(0, r.start), end: Math.min(1440, r.end) }));
  const todayText = today.length
    ? today
        .map((r) =>
          r.start === 0 && r.end === 1440
            ? th
              ? "เปิด 24 ชั่วโมง"
              : "Open 24 hours"
            : `${clock(r.start)}–${clock(r.end)}`,
        )
        .join(" / ")
    : th
      ? "ปิดทั้งวัน"
      : "Closed all day";
  const p = bangkokParts(now);
  const active = ranges.find((r) => r.start <= p.minute && r.end > p.minute);
  const boundary = active
    ? active.end
    : ranges.find((r) => r.start > p.minute)?.start;
  if (boundary === undefined || boundary >= 8 * 1440)
    return { today: todayText, next: null };
  const offset = Math.floor(boundary / 1440);
  if (
    adoptedRule &&
    Array.from({ length: offset + 1 }, (_, i) => (p.day + i) % 7).some(
      (day) => !adoptedRule.coveredDays.includes(day),
    )
  )
    return { today: todayText, next: null };
  const day =
    offset === 0
      ? ""
      : offset === 1
        ? th
          ? "พรุ่งนี้ "
          : "tomorrow "
        : `${new Intl.DateTimeFormat(th ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short" }).format(new Date(new Date(`${p.date}T00:00:00+07:00`).getTime() + offset * 86400000))} `;
  // Expiry is the end of our evidence, not a real-world closing event.
  const boundaryDate = bangkokParts(
    new Date(new Date(`${p.date}T00:00:00+07:00`).getTime() + boundary * 60000),
  ).date;
  if (active && schedule.validThrough && boundaryDate > schedule.validThrough)
    return {
      today: todayText,
      next: th ? "ตารางหมดอายุหลังวันนี้" : "Schedule expires after today",
    };
  return {
    today: todayText,
    next: `${active ? (th ? "ปิด " : "Closes ") : th ? "เปิด " : "Opens "}${day}${clock(boundary % 1440)}`,
  };
}

export function gateAvailability(
  g: Gate,
  mode: TravelMode | "all",
  direction: "entry" | "exit",
  now: Date,
  lang: Language,
): GateAvailability {
  const th = lang === "th";
  const m = mode === "all" ? "pedestrian" : mode;
  const rule =
    g.verificationStatus === "VERIFIED"
      ? null
      : operatingRule(g, mode, now, direction);
  const reference =
    rule &&
    !["closed", "not-permitted"].includes(accessState(g, m, direction, now));
  if (rule && reference) {
    const allowed =
      direction === "entry" ? rule.entryAllowed : rule.exitAllowed;
    const clockState = operatingClock(rule, now);
    const opposite = !allowed
      ? operatingRule(g, mode, now, direction === "entry" ? "exit" : "entry")
      : null;
    const summary = scheduleSummary(
      opposite?.schedule || rule.schedule,
      now,
      lang,
      opposite || rule,
    );
    if (!allowed) {
      summary.today = `${th ? (direction === "entry" ? "ออก: " : "เข้า: ") : direction === "entry" ? "Exit: " : "Entry: "}${summary.today}`;
      summary.next = null;
    }
    const inherited = rule.inheritedFrom
      ? th
        ? `ตามสิทธิ์${rule.inheritedFrom === "car" ? "รถยนต์" : "มอเตอร์ไซค์"}`
        : `Includes ${rule.inheritedFrom} access`
      : null;
    const condition =
      [th ? rule.conditionTh : rule.conditionEn, inherited]
        .filter(Boolean)
        .join(" · ") || null;
    return {
      state: !allowed || clockState === "closed" ? "closed" : "open",
      label: !allowed
        ? th
          ? direction === "entry"
            ? "ทางออกเท่านั้น"
            : "ทางเข้าเท่านั้น"
          : direction === "entry"
            ? "Exit only"
            : "Entry only"
        : clockState === "open"
          ? th
            ? "เปิดตามตาราง"
            : "Open by schedule"
          : th
            ? "ปิดตามตาราง"
            : "Closed by schedule",
      reason:
        condition ||
        (th ? "ใช้ตารางอ้างอิงเดิม" : "Adopted reference schedule"),
      ...summary,
      basis: "reference",
      source: rule.source,
      condition,
      access: !allowed
        ? th
          ? "ไม่รองรับทิศทางที่เลือก"
          : "Selected direction unavailable"
        : condition || (th ? "เข้า–ออกตามตาราง" : "Entry/exit by schedule"),
    };
  }
  const summary = scheduleSummary(g.schedule, now, lang);
  const state = accessState(g, m, direction, now);
  const result = (
    key: Availability,
    label: string,
    reason: string,
  ): GateAvailability => ({
    state: key,
    label,
    reason,
    ...summary,
    basis: key === "unknown" ? "missing" : "verified",
    source: g.scheduleSource,
    condition: g.specialRestrictions,
    access:
      key === "unknown"
        ? th
          ? "ไม่มีตารางสำหรับตัวเลือกนี้"
          : "No schedule for this selection"
        : key === "closed"
          ? reason
          : th
            ? "อนุญาตตามข้อมูล"
            : "Allowed by recorded rules",
  });
  if (state === "not-permitted")
    return result(
      "closed",
      th ? "ไม่อนุญาต" : "Not permitted",
      directionPermission(g, direction) === false
        ? th
          ? `ไม่อนุญาตให้${direction === "entry" ? "เข้า" : "ออก"}ทางประตูนี้`
          : `This gate does not permit ${direction}`
        : th
          ? "ไม่รองรับวิธีเดินทางที่เลือก"
          : "Selected travel mode is not permitted",
    );
  if (state === "closed")
    return result(
      "closed",
      th ? "ปิดตามตาราง" : "Closed by schedule",
      summary.next ||
        (th ? "นอกเวลาเปิดวันนี้" : "Outside today's opening hours"),
    );
  if (state === "confirmed")
    return result(
      "open",
      th ? "เปิดตามตาราง" : "Open by schedule",
      summary.next ||
        (th
          ? "ตรงตามสิทธิ์และตารางที่ยืนยัน"
          : "Matches verified access rules"),
    );
  if (
    scheduleState(g.schedule, now) === "open" &&
    permission(g, m) === true &&
    directionPermission(g, direction) === true &&
    (g.accessType === "restricted" || g.specialRestrictions)
  )
    return result(
      "restricted",
      th ? "มีเงื่อนไข" : "Restricted",
      th ? "ต้องตรวจสอบสิทธิ์กับเจ้าหน้าที่" : "Check authorization with staff",
    );
  if (g.accessProfile) {
    const supported = recordedMode(g, m) !== false;
    const allowed =
      direction === "entry"
        ? g.accessProfile.entryAllowed
        : g.accessProfile.exitAllowed;
    const condition =
      (th ? g.accessProfile.conditionTh : g.accessProfile.conditionEn) || null;
    const label = !supported
      ? th
        ? "ไม่รองรับวิธีเดินทางนี้"
        : "Mode unavailable"
      : !allowed
        ? th
          ? direction === "entry"
            ? "ทางออกเท่านั้น"
            : "ทางเข้าเท่านั้น"
          : direction === "entry"
            ? "Exit only"
            : "Entry only"
        : th
          ? "ยังไม่มีเวลาเปิดปิด"
          : "Hours not recorded";
    return {
      ...result(
        !supported || !allowed ? "closed" : "unknown",
        label,
        th
          ? "ตามข้อมูลประเภทประตูที่ระบุ ยังไม่มีตารางเวลา"
          : "Recorded gate type; opening hours unavailable",
      ),
      basis: "recorded",
      source: g.accessProfile.source,
      condition,
      access:
        !supported || !allowed
          ? label
          : [
              th ? "รองรับวิธีเดินทางที่เลือก" : "Selected mode supported",
              condition,
            ]
              .filter(Boolean)
              .join(" · "),
    };
  }
  const reason =
    scheduleState(g.schedule, now) === "unknown"
      ? th
        ? "ยังไม่มีตารางปัจจุบันที่ยืนยัน"
        : "No verified current schedule"
      : th
        ? "เวลาเปิดมีข้อมูล แต่สิทธิ์ผ่านประตูยังไม่ยืนยัน"
        : "Hours recorded; access permission is unconfirmed";
  return result("unknown", th ? "ไม่มีตาราง" : "No schedule", reason);
}

export function weeklyHours(
  g: Gate,
  mode: TravelMode | "all",
  now: Date,
  lang: Language,
  direction: "entry" | "exit" = "entry",
) {
  const p = bangkokParts(now);
  const midnight = new Date(`${p.date}T00:00:00+07:00`).getTime();
  return [1, 2, 3, 4, 5, 6, 0].map((day) => {
    const date = new Date(midnight + ((day - p.day + 7) % 7) * 86400000);
    const rule =
      g.verificationStatus === "VERIFIED"
        ? null
        : operatingRule(g, mode, date, direction);
    const summary = scheduleSummary(
      rule?.schedule || g.schedule,
      date,
      lang,
      rule,
    );
    return { day, hours: summary.today, today: day === p.day };
  });
}

export function availabilityCounts(
  gates: Gate[],
  mode: TravelMode | "all",
  direction: "entry" | "exit",
  now: Date,
): Record<Availability, number> {
  return gates.reduce(
    (counts, g) => {
      counts[gateAvailability(g, mode, direction, now, "en").state]++;
      return counts;
    },
    { open: 0, closed: 0, restricted: 0, unknown: 0 },
  );
}

export function filterAvailability(
  gates: Gate[],
  filter: AvailabilityFilter,
  mode: TravelMode | "all",
  direction: "entry" | "exit",
  now: Date,
): Gate[] {
  return filter === "all"
    ? gates
    : gates.filter(
        (g) => gateAvailability(g, mode, direction, now, "en").state === "open",
      );
}
