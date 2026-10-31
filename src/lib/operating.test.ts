import { describe, expect, it } from "vitest";
import { dataset, datasetSchema } from "./data";
import {
  gateAvailability,
  filterAvailability,
  weeklyHours,
} from "./availability";
import { operatingClock, operatingRule } from "./operating";
import { accessState, qualityStats } from "./gates";
const data = dataset!;
const gate = (id: string) => data.gates.find((g) => g.id === id)!;
const monday = new Date("2026-11-02T05:00:00Z"); // Monday 12:00 Bangkok.
const sunday = new Date("2026-11-01T05:00:00Z"); // Sunday 12:00 Bangkok.

describe("adopted historical operating rules", () => {
  it("validates every adopted rule and its source without relabelling evidence", () => {
    expect(data.operationPolicy?.basis).toBe("historical-baseline");
    expect(data.gates.some((g) => g.operatingRules.length)).toBe(true);
    for (const g of data.gates)
      for (const r of g.operatingRules) {
        expect(r.schedule.verificationStatus).toBe("HISTORICAL");
        expect(g.sources).toContain(r.source);
        expect(data.sources.some((s) => s.id === r.source)).toBe(true);
        expect(r.source).not.toContain("event");
      }
  });
  it("uses the later December pedestrian notice for weekdays and weekends", () => {
    const g = gate("sasin");
    expect(operatingRule(g, "pedestrian", sunday)?.source).toBe("cu-dec-2021");
    expect(
      gateAvailability(g, "pedestrian", "entry", monday, "th"),
    ).toMatchObject({
      state: "open",
      today: "06:00–20:00",
      basis: "reference",
    });
    expect(
      gateAvailability(g, "pedestrian", "entry", sunday, "th"),
    ).toMatchObject({ state: "open", today: "06:00–18:00" });
  });
  it("changes from open to closed at the exact weekend boundary", () => {
    const g = gate("phayathai-3");
    expect(
      gateAvailability(
        g,
        "pedestrian",
        "entry",
        new Date("2026-11-01T10:59:00Z"),
        "th",
      ).state,
    ).toBe("open");
    expect(
      gateAvailability(
        g,
        "pedestrian",
        "entry",
        new Date("2026-11-01T11:00:00Z"),
        "th",
      ),
    ).toMatchObject({ state: "closed", next: "เปิด พรุ่งนี้ 06:00" });
  });
  it("uses 24-hour vehicle hours while retaining the authorization condition", () => {
    const g = gate("phayathai-3");
    const status = gateAvailability(
      g,
      "car",
      "entry",
      new Date("2026-10-31T20:00:00Z"),
      "th",
    );
    expect(status).toMatchObject({
      state: "open",
      today: "เปิด 24 ชั่วโมง",
      basis: "reference",
    });
    expect(status.condition).toContain("ผู้ได้รับอนุญาต");
    expect(filterAvailability([g], "open", "car", "entry", monday)).toEqual([
      g,
    ]);
  });
  it("enforces exit-only hours separately from the gate clock", () => {
    const g = gate("science");
    expect(gateAvailability(g, "car", "entry", monday, "th").label).toBe(
      "ทางออกเท่านั้น",
    );
    expect(gateAvailability(g, "car", "exit", monday, "th").state).toBe("open");
    expect(filterAvailability([g], "open", "car", "entry", monday)).toEqual([]);
  });
  it("opens the Dhamma vehicle exit only while the Stadium exit is closed", () => {
    const g = gate("dhamma");
    expect(gateAvailability(g, "car", "entry", monday, "th").state).toBe(
      "open",
    );
    expect(gateAvailability(g, "car", "exit", monday, "th").state).toBe(
      "closed",
    );
    expect(
      gateAvailability(g, "car", "exit", new Date("2026-10-31T20:00:00Z"), "th")
        .state,
    ).toBe("open");
  });
  it("does not block an approximate map point from using its recorded hours", () => {
    const g = gate("science");
    expect(g.coordinateVerificationStatus).toBe("UNVERIFIED");
    expect(gateAvailability(g, "pedestrian", "entry", monday, "th").state).toBe(
      "open",
    );
  });
  it("uses car-specific Sasin rules before the older all-vehicle weekend fallback", () => {
    const g = gate("sasin");
    expect(gateAvailability(g, "car", "entry", sunday, "th").state).toBe(
      "closed",
    );
    expect(operatingRule(g, "car", sunday)?.source).toBe("cu-sasin-2018");
    expect(operatingRule(g, "motorcycle", sunday)?.source).toBe(
      "cu-weekend-2008",
    );
    expect(operatingRule(g, "motorcycle", monday)).toBeNull();
  });
  it("keeps weekend-only evidence from inventing weekday hours or a next-week opening", () => {
    const g = gate("phayathai-1");
    expect(operatingRule(g, "car", monday)).toBeNull();
    expect(
      gateAvailability(
        g,
        "car",
        "entry",
        new Date("2026-11-01T13:00:00Z"),
        "th",
      ).next,
    ).toBeNull();
  });
  it("shows pharmacy car and walking schedules separately on Sunday", () => {
    expect(
      gateAvailability(gate("pharmacy"), "car", "entry", sunday, "th").state,
    ).toBe("closed");
    expect(
      gateAvailability(gate("pharmacy"), "pedestrian", "entry", sunday, "th"),
    ).toMatchObject({ state: "open", today: "05:00–18:00" });
  });
  it("renders a seven-day schedule with the current day highlighted", () => {
    const rows = weeklyHours(gate("phayathai-3"), "pedestrian", sunday, "th");
    expect(rows.map((r) => r.day)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(rows.find((r) => r.day === 1)?.hours).toBe("06:00–20:00");
    expect(rows.find((r) => r.day === 0)).toMatchObject({
      hours: "06:00–18:00",
      today: true,
    });
  });
  it("retains unknown hours only for records without a usable baseline", () => {
    expect(
      gateAvailability(
        gate("engineering-reserve"),
        "pedestrian",
        "entry",
        monday,
        "th",
      ).state,
    ).toBe("unknown");
    expect(operatingRule(gate("law-foot"), "pedestrian", monday)).toBeNull();
  });
  it("does not change the original verified access audit or quality counts", () => {
    expect(
      gateAvailability(gate("phayathai-3"), "car", "entry", monday, "th").state,
    ).toBe("open");
    expect(accessState(gate("phayathai-3"), "car", "entry", monday)).toBe(
      "unknown",
    );
    const s = qualityStats(data.gates, monday);
    expect(s.HISTORICAL).toBe(data.gates.length);
    expect(s.VERIFIED).toBe(0);
    expect(s.schedulesUnknown).toBe(data.gates.length);
  });
  it("honours an explicit public-holiday closure without changing the normal weekly baseline", () => {
    const r = operatingRule(gate("science"), "car", monday)!;
    expect(operatingClock(r, monday, false)).toBe("open");
    expect(operatingClock(r, monday, true)).toBe("closed");
  });
  it("supports an overnight opening carried from the previous covered day", () => {
    const g = structuredClone(gate("phayathai-3"));
    const rule = structuredClone(g.operatingRules[0]);
    rule.coveredDays = [1];
    rule.schedule.intervals = [{ days: [1], open: "22:00", close: "02:00" }];
    g.operatingRules = [rule];
    const afterMidnight = new Date("2026-11-02T18:00:00Z");
    expect(operatingRule(g, "car", afterMidnight)?.id).toBe(rule.id);
    expect(
      gateAvailability(g, "car", "entry", afterMidnight, "th"),
    ).toMatchObject({ state: "open", today: "00:00–02:00" });
  });
  it("rejects missing rule sources and falsely verified adopted rules", () => {
    const d = structuredClone(data);
    d.gates[0].operatingRules[0].source = "missing";
    expect(datasetSchema.safeParse(d).success).toBe(false);
    const other = structuredClone(data);
    other.gates[0].operatingRules[0].schedule.verificationStatus = "VERIFIED";
    expect(datasetSchema.safeParse(other).success).toBe(false);
  });
});
