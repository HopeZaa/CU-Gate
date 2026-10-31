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
  it("unions car access with the later pedestrian schedule", () => {
    const g = gate("sasin");
    expect(operatingRule(g, "pedestrian", sunday)?.source).toBe("cu-dec-2021");
    expect(
      gateAvailability(g, "pedestrian", "entry", monday, "th"),
    ).toMatchObject({
      state: "open",
      today: "05:00–24:00",
      basis: "reference",
    });
    expect(
      gateAvailability(g, "pedestrian", "entry", sunday, "th"),
    ).toMatchObject({ state: "open", today: "06:00–18:00" });
  });
  it("changes from open to closed at the exact weekend boundary", () => {
    const g = gate("education-foot");
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
  it("uses the supplied Sasin rule for car and motorcycle without a 24h fallback", () => {
    const g = gate("sasin");
    expect(gateAvailability(g, "car", "entry", sunday, "th").state).toBe(
      "closed",
    );
    expect(operatingRule(g, "car", sunday)?.source).toBe("cu-sasin-2018");
    expect(operatingRule(g, "motorcycle", sunday)?.source).toBe(
      "cu-sasin-2018",
    );
    expect(gateAvailability(g, "motorcycle", "entry", sunday, "th").state).toBe(
      "closed",
    );
    expect(gateAvailability(g, "motorcycle", "entry", monday, "th").today).toBe(
      "05:00–24:00",
    );
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
  it("uses the owner-adopted pharmacy daily baseline for lower modes", () => {
    expect(
      gateAvailability(gate("pharmacy"), "car", "entry", sunday, "th").state,
    ).toBe("open");
    expect(
      gateAvailability(gate("pharmacy"), "pedestrian", "entry", sunday, "th"),
    ).toMatchObject({ state: "open", today: "05:00–22:00" });
  });
  it("renders a seven-day schedule with the current day highlighted", () => {
    const rows = weeklyHours(gate("phayathai-3"), "pedestrian", sunday, "th");
    expect(rows.map((r) => r.day)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(rows.find((r) => r.day === 1)?.hours).toBe("เปิด 24 ชั่วโมง");
    expect(rows.find((r) => r.day === 0)).toMatchObject({
      hours: "เปิด 24 ชั่วโมง",
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
    const r = operatingRule(gate("science"), "car", monday, "exit")!;
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

describe("owner mode hierarchy and expanded inventory", () => {
  it("keeps all lower modes open for 24h car access at night", () => {
    const night = new Date("2026-11-02T19:30:00Z");
    for (const m of ["pedestrian", "motorcycle", "car"] as const)
      expect(
        gateAvailability(gate("phayathai-3"), m, "entry", night, "th"),
      ).toMatchObject({ state: "open", today: "เปิด 24 ชั่วโมง" });
    expect(
      gateAvailability(gate("phayathai-3"), "pedestrian", "entry", night, "th")
        .condition,
    ).toContain("ผู้ได้รับอนุญาต");
  });
  it("preserves exit-only access when inherited from a car rule", () => {
    for (const m of ["motorcycle", "car"] as const) {
      expect(
        gateAvailability(gate("indoor-stadium-exit"), m, "entry", monday, "th")
          .state,
      ).toBe("closed");
      expect(
        gateAvailability(gate("indoor-stadium-exit"), m, "exit", monday, "th")
          .state,
      ).toBe("open");
    }
    expect(
      gateAvailability(gate("science"), "pedestrian", "entry", monday, "th")
        .state,
    ).toBe("open");
  });
  it("does not infer vehicles from a walking-only dental entrance", () => {
    for (const id of ["dentistry", "dentistry-henri"]) {
      expect(
        gateAvailability(gate(id), "car", "entry", monday, "th").state,
      ).toBe("closed");
      expect(
        gateAvailability(gate(id), "pedestrian", "entry", monday, "th"),
      ).toMatchObject({
        state: "unknown",
        basis: "recorded",
        access: "รองรับวิธีเดินทางที่เลือก",
      });
    }
  });
  it("clips conditional exit hours and reports its next actual opening", () => {
    const status = gateAvailability(
      gate("dhamma"),
      "car",
      "exit",
      monday,
      "th",
    );
    expect(status).toMatchObject({
      state: "closed",
      today: "00:00–06:00 / 20:00–24:00",
      next: "เปิด 20:00",
    });
  });
  it("maps each supplied item to an existing gate and marks the provisional alias", () => {
    expect(data.ownerInventory?.map((x) => x.item)).toEqual(
      Array.from({ length: 28 }, (_, i) => i + 1),
    );
    for (const x of data.ownerInventory!) expect(gate(x.gateId)).toBeDefined();
    expect(data.ownerInventory?.find((x) => x.item === 15)).toMatchObject({
      gateId: "health-5",
      provisionalAlias: true,
    });
    expect(gate("dentistry").latitude).not.toBe(
      gate("dentistry-henri").latitude,
    );
    expect(gate("stadium").latitude).not.toBe(
      gate("indoor-stadium-exit").latitude,
    );
  });
  it("keeps new health gates without supplied hours out of Open now", () => {
    for (const id of ["health-1", "health-2", "health-3", "health-4"]) {
      expect(gate(id).latitude).not.toBeNull();
      expect(
        gateAvailability(gate(id), "pedestrian", "entry", monday, "th"),
      ).toMatchObject({
        state: "unknown",
        basis: "recorded",
        access: "รองรับวิธีเดินทางที่เลือก",
      });
    }
  });
});
