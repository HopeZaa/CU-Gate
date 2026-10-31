import { includesMode } from "./travel";
import type { Dataset, Gate, TravelMode } from "./data";
import type { AccessState, Position } from "./gates";
import { accessState, hasCoordinates, haversine } from "./gates";
import type { Language } from "./i18n";
import { gateAvailability } from "./availability";
export type AccessReference = Gate["referenceAccess"][number];
export function matchingReferences(
  g: Gate,
  mode: TravelMode | "all",
  includeEvents = false,
): AccessReference[] {
  return g.referenceAccess
    .filter(
      (r) =>
        (includeEvents || r.context !== "event-only") &&
        (mode === "all" ||
          r.appliesTo === mode ||
          r.appliesTo === "vehicle" ||
          includesMode(r.appliesTo, mode)),
    )
    .sort(
      (a, b) => Number(b.appliesTo === mode) - Number(a.appliesTo === mode),
    );
}
export function referenceFor(g: Gate, mode: TravelMode | "all") {
  return matchingReferences(g, mode)[0] ?? null;
}
export function referenceYear(
  ref: AccessReference,
  data: Dataset,
  lang: Language,
) {
  const date = data.sources.find((s) => s.id === ref.source)?.publishedAt;
  return date
    ? String(Number(date.slice(0, 4)) + (lang === "th" ? 543 : 0))
    : lang === "th"
      ? "ไม่ทราบปี"
      : "undated";
}
export function planningLabel(
  g: Gate,
  mode: TravelMode | "all",
  direction: "entry" | "exit",
  now: Date,
  lang: Language,
): { label: string; tone: string; state: AccessState } {
  const state = accessState(
    g,
    mode === "all" ? "pedestrian" : mode,
    direction,
    now,
  );
  const current = {
    confirmed: ["ตรงเงื่อนไขที่ยืนยัน", "Matches verified rules", "confirmed"],
    closed: ["ปิดตามตารางที่ยืนยัน", "Closed by verified schedule", "closed"],
    "not-permitted": [
      "ไม่อนุญาตตามข้อมูลล่าสุด",
      "Not permitted by verified rules",
      "closed",
    ],
  }[state as "confirmed" | "closed" | "not-permitted"];
  if (current)
    return { label: current[lang === "th" ? 0 : 1], tone: current[2], state };
  const r = referenceFor(g, mode);
  if (r) {
    if ((direction === "entry" ? r.entryAllowed : r.exitAllowed) === false)
      return {
        label:
          lang === "th"
            ? direction === "entry"
              ? "ประกาศเดิม: ทางออกเท่านั้น"
              : "ประกาศเดิม: ทางเข้าเท่านั้น"
            : direction === "entry"
              ? "Old notice: exit only"
              : "Old notice: entry only",
        tone: "caution",
        state,
      };
    if (r.requiresAuthorization)
      return {
        label:
          lang === "th"
            ? "ประกาศเดิมกำหนดให้ขออนุญาต"
            : "Prior authorization in old notice",
        tone: "caution",
        state,
      };
    return {
      label:
        lang === "th"
          ? "มีข้อมูลการใช้งานอ้างอิง"
          : "Access reference available",
      tone: "reference",
      state,
    };
  }
  return {
    label:
      lang === "th"
        ? g.coordinateVerificationStatus === "VERIFIED"
          ? "พบในแผนที่มหาวิทยาลัย"
          : hasCoordinates(g)
            ? "จุดประตูโดยประมาณ"
            : "รอยืนยันจุดประตู"
        : g.coordinateVerificationStatus === "VERIFIED"
          ? "On the university map"
          : hasCoordinates(g)
            ? "Approximate gate point"
            : "Gate location unresolved",
    tone: "mapped",
    state,
  };
}
export function planGateOrder(
  gates: Gate[],
  mode: TravelMode | "all",
  direction: "entry" | "exit",
  now: Date,
  origin: Position | null,
  sort: "recommended" | "distance" | "name",
  lang: Language,
): Gate[] {
  const rank = (g: Gate) => {
    if (!hasCoordinates(g)) return 20;
    const live = gateAvailability(g, mode, direction, now, lang);
    if (live.state === "open") return 0;
    if (live.state === "restricted") return 1;
    if (live.state === "closed") return 9;
    const s = accessState(
      g,
      mode === "all" ? "pedestrian" : mode,
      direction,
      now,
    );
    if (s === "closed" || s === "not-permitted") return 9;
    if (s === "confirmed") return 0;
    const ref = referenceFor(g, mode);
    if (
      ref &&
      (direction === "entry" ? ref.entryAllowed : ref.exitAllowed) === false
    )
      return 8;
    if (!hasCoordinates(g)) return 7;
    return 1;
  };
  return [...gates].sort((a, b) => {
    if (sort === "name")
      return (lang === "th" ? a.shortNameTh : a.nameEn || a.name).localeCompare(
        lang === "th" ? b.shortNameTh : b.nameEn || b.name,
        lang,
      );
    if (sort === "recommended") {
      const d = rank(a) - rank(b);
      if (d) return d;
    }
    if (origin) {
      const da = hasCoordinates(a) ? haversine(origin, a) : Infinity,
        db = hasCoordinates(b) ? haversine(origin, b) : Infinity;
      if (da !== db) return da - db;
    }
    const confidence = { HIGH: 0, MEDIUM: 1, LOW: 2, UNKNOWN: 3 };
    return (
      confidence[a.coordinateConfidence] - confidence[b.coordinateConfidence] ||
      (a.mapLetter || "Z").localeCompare(b.mapLetter || "Z")
    );
  });
}
