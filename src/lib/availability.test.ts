import { describe, expect, it } from "vitest";
import { dataset } from "./data";
import type { Gate, Schedule } from "./data";
import {
  availabilityCounts,
  filterAvailability,
  gateAvailability,
  scheduleSummary,
} from "./availability";
import { defaultFilters, filterGates } from "./gates";
const noon = new Date("2026-11-02T05:00:00Z"); // Monday 12:00 Bangkok.
const weekly: Schedule = {
  verificationStatus: "VERIFIED",
  validFrom: "2026-01-01",
  validThrough: "2026-12-31",
  holidayPolicy: "same",
  intervals: [{ days: [1, 2, 3, 4, 5], open: "06:00", close: "20:00" }],
};
function fixture(): Gate {
  return {
    ...structuredClone(dataset!.gates[0]),
    verificationStatus: "VERIFIED",
    accessVerificationStatus: "VERIFIED",
    accessType: "public",
    permissions: { pedestrian: true, car: false, motorcycle: null },
    entryAllowed: true,
    exitAllowed: false,
    specialRestrictions: null,
    operatingRules: [],
    schedule: structuredClone(weekly),
  };
}
const state = (g: Gate, date = noon) =>
  gateAvailability(g, "pedestrian", "entry", date, "th").state;

describe("map availability and the Open now filter", () => {
  it("shows verified usable access as green and calculates closing time", () => {
    expect(
      gateAvailability(fixture(), "pedestrian", "entry", noon, "th"),
    ).toMatchObject({
      state: "open",
      label: "เปิดตามตาราง",
      today: "06:00–20:00",
      next: "ปิด 20:00",
    });
  });
  it("changes to closed at the exact closing boundary", () => {
    expect(state(fixture(), new Date("2026-11-02T12:59:00Z"))).toBe("open");
    expect(state(fixture(), new Date("2026-11-02T13:00:00Z"))).toBe("closed");
  });
  it("does not treat opening hours as permission for cars or motorcycles", () => {
    expect(gateAvailability(fixture(), "car", "entry", noon, "th").state).toBe(
      "closed",
    );
    expect(
      gateAvailability(fixture(), "motorcycle", "entry", noon, "th").state,
    ).toBe("unknown");
  });
  it("respects the selected entry/exit direction", () =>
    expect(
      gateAvailability(fixture(), "pedestrian", "exit", noon, "en").label,
    ).toBe("Not permitted"));
  it("keeps restricted access out of Open now", () => {
    const g = { ...fixture(), accessType: "restricted" as const };
    expect(state(g)).toBe("restricted");
    expect(
      filterAvailability([g], "open", "pedestrian", "entry", noon),
    ).toEqual([]);
    expect(
      state({ ...fixture(), specialRestrictions: "Staff card required" }),
    ).toBe("restricted");
  });
  it("does not use absent, approximate or historical evidence to show green", () => {
    const g = fixture();
    expect(state({ ...g, schedule: null })).toBe("unknown");
    expect(state({ ...g, entryAllowed: null })).toBe("unknown");
    expect(state({ ...g, accessVerificationStatus: "HISTORICAL" })).toBe(
      "unknown",
    );
    expect(state({ ...g, verificationStatus: "HISTORICAL" })).toBe("unknown");
    expect(state({ ...g, coordinateVerificationStatus: "UNVERIFIED" })).toBe(
      "unknown",
    );
    expect(state({ ...g, latitude: null, longitude: null })).toBe("unknown");
  });
  it("does not apply expired schedules or uncertain holiday rules", () => {
    const g = fixture();
    expect(
      state({ ...g, schedule: { ...weekly, validThrough: "2025-12-31" } }),
    ).toBe("unknown");
    expect(
      state({ ...g, schedule: { ...weekly, holidayPolicy: "closed" } }),
    ).toBe("unknown");
  });
  it("uses the adopted historical baseline without changing evidence status", () => {
    const open = filterAvailability(
      dataset!.gates,
      "open",
      "pedestrian",
      "entry",
      noon,
    );
    expect(open.length).toBeGreaterThan(0);
    expect(
      open.every(
        (g) =>
          gateAvailability(g, "pedestrian", "entry", noon, "th").basis ===
          "reference",
      ),
    ).toBe(true);
    expect(
      dataset!.gates.every(
        (g) => g.verificationStatus === "HISTORICAL" && g.schedule === null,
      ),
    ).toBe(true);
  });
  it("calculates counts and results from changed records and time", () => {
    const open = fixture();
    const closed = { ...fixture(), id: "closed", entryAllowed: false };
    const restricted = {
      ...fixture(),
      id: "restricted",
      accessType: "restricted" as const,
    };
    const unknown = { ...fixture(), id: "unknown", schedule: null };
    const gates = [open, closed, restricted, unknown];
    expect(availabilityCounts(gates, "pedestrian", "entry", noon)).toEqual({
      open: 1,
      closed: 1,
      restricted: 1,
      unknown: 1,
    });
    expect(
      filterAvailability(gates, "open", "pedestrian", "entry", noon),
    ).toEqual([open]);
    expect(
      filterAvailability(gates, "all", "pedestrian", "entry", noon),
    ).toEqual(gates);
    expect(
      availabilityCounts(
        gates,
        "pedestrian",
        "entry",
        new Date("2026-11-02T14:00:00Z"),
      ),
    ).toEqual({ open: 0, closed: 3, restricted: 0, unknown: 1 });
    expect(availabilityCounts([], "pedestrian", "entry", noon)).toEqual({
      open: 0,
      closed: 0,
      restricted: 0,
      unknown: 0,
    });
  });
  it("retains known denied gates in All gates so their red pins are visible", () => {
    const g = fixture();
    expect(
      filterGates([g], { ...defaultFilters, mode: "car" }, null, noon, true),
    ).toEqual([g]);
    expect(
      filterGates([g], { ...defaultFilters, mode: "car" }, null, noon),
    ).toEqual([]);
  });
});

describe("concise today's hours and next change", () => {
  it("shows today's closed day and the next opening in Bangkok", () =>
    expect(
      scheduleSummary(weekly, new Date("2026-11-01T05:00:00Z"), "th"),
    ).toEqual({ today: "ปิดทั้งวัน", next: "เปิด พรุ่งนี้ 06:00" }));
  it("shows next opening after today's hours", () =>
    expect(
      scheduleSummary(weekly, new Date("2026-11-02T14:00:00Z"), "en"),
    ).toEqual({ today: "06:00–20:00", next: "Opens tomorrow 06:00" }));
  it("includes the previous day's overnight tail", () => {
    const s = {
      ...weekly,
      intervals: [{ days: [1], open: "22:00", close: "02:00" }],
    };
    expect(scheduleSummary(s, new Date("2026-11-02T18:00:00Z"), "th")).toEqual({
      today: "00:00–02:00",
      next: "ปิด 02:00",
    });
    expect(scheduleSummary(s, new Date("2026-11-02T16:00:00Z"), "en")).toEqual({
      today: "22:00–24:00",
      next: "Closes tomorrow 02:00",
    });
  });
  it("merges touching hours rather than inventing a closing event", () => {
    const s = {
      ...weekly,
      intervals: [
        { days: [1], open: "06:00", close: "12:00" },
        { days: [1], open: "12:00", close: "20:00" },
      ],
    };
    expect(scheduleSummary(s, noon, "en")).toEqual({
      today: "06:00–20:00",
      next: "Closes 20:00",
    });
  });
  it("shows multiple shifts and the next opening during a break", () => {
    const s = {
      ...weekly,
      intervals: [
        { days: [1], open: "06:00", close: "10:00" },
        { days: [1], open: "16:00", close: "20:00" },
      ],
    };
    expect(scheduleSummary(s, noon, "th")).toEqual({
      today: "06:00–10:00 / 16:00–20:00",
      next: "เปิด 16:00",
    });
  });
  it("supports 24-hour daily operation without an artificial next-week closing", () => {
    const s = {
      ...weekly,
      intervals: [
        { days: [0, 1, 2, 3, 4, 5, 6], open: "00:00", close: "24:00" },
      ],
    };
    expect(scheduleSummary(s, noon, "th")).toEqual({
      today: "เปิด 24 ชั่วโมง",
      next: null,
    });
  });
  it("distinguishes evidence expiry from real-world closure", () => {
    const s = {
      ...weekly,
      validThrough: "2026-11-02",
      intervals: [
        { days: [0, 1, 2, 3, 4, 5, 6], open: "00:00", close: "24:00" },
      ],
    };
    expect(scheduleSummary(s, noon, "th").next).toBe("ตารางหมดอายุหลังวันนี้");
  });
  it("never shows historical, missing or future hours as today's hours", () => {
    for (const s of [
      null,
      { ...weekly, verificationStatus: "HISTORICAL" as const },
      { ...weekly, validFrom: "2027-01-01" },
    ])
      expect(scheduleSummary(s, noon, "th")).toEqual({
        today: "ไม่มีข้อมูลเวลา",
        next: null,
      });
  });
});
