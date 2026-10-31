import { describe, expect, it } from "vitest";
import { dataset, scheduleSchema } from "./data";
import type { Gate, Schedule } from "./data";
import {
  accessState,
  bangkokParts,
  defaultFilters,
  directionsUrl,
  filterGates,
  haversine,
  qualityStats,
  scheduleState,
} from "./gates";
const now = new Date("2026-11-02T05:00:00Z"); // Monday, noon in Bangkok.
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
    permissions: { pedestrian: true, motorcycle: null, car: false },
    entryAllowed: true,
    exitAllowed: false,
    schedule: weekly,
  };
}
describe("geographic calculations", () => {
  it("returns zero for identical points", () =>
    expect(
      haversine(
        { latitude: 13.7, longitude: 100.5 },
        { latitude: 13.7, longitude: 100.5 },
      ),
    ).toBe(0));
  it("matches the known equatorial great-circle distance", () =>
    expect(
      haversine({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }),
    ).toBeCloseTo(111195.08, 0));
  it("handles antipodal points without NaN", () =>
    expect(
      haversine({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 }),
    ).toBeCloseTo(20015114.44, 0));
  it("is symmetric for campus coordinates", () => {
    const [a, b] = dataset!.gates;
    expect(
      haversine(
        a as { latitude: number; longitude: number },
        b as { latitude: number; longitude: number },
      ),
    ).toBeCloseTo(
      haversine(
        b as { latitude: number; longitude: number },
        a as { latitude: number; longitude: number },
      ),
      8,
    );
  });
});
describe("Asia/Bangkok schedule calculations", () => {
  it("converts UTC to the next Bangkok day", () =>
    expect(bangkokParts(new Date("2026-11-01T18:30:00Z"))).toEqual({
      date: "2026-11-02",
      day: 1,
      minute: 90,
    }));
  it("opens at the inclusive boundary", () =>
    expect(scheduleState(weekly, new Date("2026-11-01T23:00:00Z"))).toBe(
      "open",
    ));
  it("closes at the exclusive boundary", () =>
    expect(scheduleState(weekly, new Date("2026-11-02T13:00:00Z"))).toBe(
      "closed",
    ));
  it("closes on a non-operating day", () =>
    expect(scheduleState(weekly, new Date("2026-11-01T05:00:00Z"))).toBe(
      "closed",
    ));
  it("supports 24:00 as end-of-day", () =>
    expect(
      scheduleState(
        {
          ...weekly,
          intervals: [{ days: [1], open: "00:00", close: "24:00" }],
        },
        now,
      ),
    ).toBe("open"));
  it("supports the next-day tail of a midnight-crossing interval", () => {
    const s = {
      ...weekly,
      intervals: [{ days: [1], open: "22:00", close: "02:00" }],
    };
    expect(scheduleState(s, new Date("2026-11-02T16:00:00Z"))).toBe("open");
    expect(scheduleState(s, new Date("2026-11-02T18:00:00Z"))).toBe("open");
    expect(scheduleState(s, new Date("2026-11-02T19:00:00Z"))).toBe("closed");
    expect(scheduleState(s, new Date("2026-11-03T16:00:00Z"))).toBe("closed");
  });
  it("does not apply historical hours", () =>
    expect(
      scheduleState({ ...weekly, verificationStatus: "HISTORICAL" }, now),
    ).toBe("unknown"));
  it("does not apply expired or future schedules", () => {
    expect(scheduleState({ ...weekly, validThrough: "2025-12-31" }, now)).toBe(
      "unknown",
    );
    expect(scheduleState({ ...weekly, validFrom: "2027-01-01" }, now)).toBe(
      "unknown",
    );
  });
  it("handles missing schedules and unknown holiday rules", () => {
    expect(scheduleState(null, now)).toBe("unknown");
    expect(scheduleState({ ...weekly, holidayPolicy: "unknown" }, now)).toBe(
      "unknown",
    );
    expect(scheduleState({ ...weekly, holidayPolicy: "closed" }, now)).toBe(
      "unknown",
    );
  });
  it("handles explicitly known holidays", () => {
    expect(
      scheduleState({ ...weekly, holidayPolicy: "closed" }, now, true),
    ).toBe("closed");
    expect(
      scheduleState({ ...weekly, holidayPolicy: "closed" }, now, false),
    ).toBe("open");
  });
  it("rejects ambiguous equal endpoints and invalid time values", () => {
    expect(
      scheduleSchema.safeParse({
        ...weekly,
        intervals: [{ days: [1], open: "06:00", close: "06:00" }],
      }).success,
    ).toBe(false);
    expect(
      scheduleSchema.safeParse({
        ...weekly,
        intervals: [{ days: [7], open: "25:00", close: "27:00" }],
      }).success,
    ).toBe(false);
  });
});
describe("access evidence and filters", () => {
  it("only confirms access with current permission, direction, schedule and coordinates", () => {
    expect(accessState(fixture(), "pedestrian", "entry", now)).toBe(
      "confirmed",
    );
  });
  it("never derives motorcycle permission from walking or cars", () => {
    const g = fixture();
    expect(accessState(g, "motorcycle", "entry", now)).toBe("possible");
    expect(accessState(g, "car", "entry", now)).toBe("not-permitted");
  });
  it("respects entry and exit separately", () =>
    expect(accessState(fixture(), "pedestrian", "exit", now)).toBe(
      "not-permitted",
    ));
  it("does not confirm restricted or unknown schedules", () => {
    const g = fixture();
    expect(
      accessState(
        { ...g, accessType: "restricted" },
        "pedestrian",
        "entry",
        now,
      ),
    ).toBe("possible");
    expect(
      accessState({ ...g, schedule: null }, "pedestrian", "entry", now),
    ).toBe("possible");
  });
  it("reports verified closures", () =>
    expect(
      accessState(
        fixture(),
        "pedestrian",
        "entry",
        new Date("2026-11-02T14:00:00Z"),
      ),
    ).toBe("closed"));
  it("does not confirm gates with unverified coordinates or historical record status", () => {
    const g = fixture();
    expect(
      accessState(
        { ...g, coordinateVerificationStatus: "UNVERIFIED" },
        "pedestrian",
        "entry",
        now,
      ),
    ).toBe("possible");
    expect(
      accessState(
        { ...g, verificationStatus: "HISTORICAL" },
        "pedestrian",
        "entry",
        now,
      ),
    ).toBe("possible");
  });
  it("treats unverified permission flags as unknown", () => {
    const g = fixture();
    expect(
      accessState(
        { ...g, accessVerificationStatus: "UNVERIFIED" },
        "pedestrian",
        "entry",
        now,
      ),
    ).toBe("unknown");
  });
  it("matches Thai aliases and nearby faculties", () => {
    expect(
      filterGates(
        dataset!.gates,
        { ...defaultFilters, query: "  บัญชี  " },
        null,
        now,
      ).some((g) => g.id === "phayathai-3"),
    ).toBe(true);
    expect(
      filterGates(
        dataset!.gates,
        { ...defaultFilters, query: "political science" },
        null,
        now,
      ).some((g) => g.id === "henri-dunant-2"),
    ).toBe(true);
  });
  it("gives an honest empty result for strict permissions", () =>
    expect(
      filterGates(
        dataset!.gates,
        { ...defaultFilters, mode: "car", includeUnknown: false },
        null,
        now,
      ),
    ).toHaveLength(0));
  it("retains unknowns only when requested", () => {
    const g = fixture();
    expect(
      filterGates(
        [g],
        { ...defaultFilters, mode: "motorcycle", includeUnknown: true },
        null,
        now,
      ),
    ).toHaveLength(1);
    expect(
      filterGates(
        [g],
        { ...defaultFilters, mode: "motorcycle", includeUnknown: false },
        null,
        now,
      ),
    ).toHaveLength(0);
  });
  it("filters verification and missing coordinates", () => {
    expect(
      filterGates(
        dataset!.gates,
        { ...defaultFilters, verification: "VERIFIED" },
        null,
        now,
      ),
    ).toHaveLength(0);
    expect(
      filterGates(
        dataset!.gates,
        { ...defaultFilters, mappedOnly: true },
        null,
        now,
      ).every((g) => g.latitude !== null),
    ).toBe(true);
  });
  it("sorts distance and keeps missing-coordinate records last", () => {
    const pos = { latitude: 13.7387455, longitude: 100.5298425 };
    const found = filterGates(
      dataset!.gates,
      { ...defaultFilters, sort: "distance" },
      pos,
      now,
    );
    expect(found[0].id).toBe("phayathai-1");
    expect(found.at(-1)?.latitude).toBeNull();
  });
  it("puts supported access before a nearer unknown candidate in recommendations", () => {
    const verified = fixture(),
      unknown = { ...dataset!.gates[1] };
    expect(
      filterGates(
        [unknown, verified],
        { ...defaultFilters, mode: "pedestrian" },
        { latitude: unknown.latitude!, longitude: unknown.longitude! },
        now,
      )[0].id,
    ).toBe(verified.id);
  });
  it("sorts names alphabetically and returns a proper empty search", () => {
    const a = filterGates(
      dataset!.gates,
      { ...defaultFilters, sort: "name" },
      null,
      now,
    );
    expect(a[0].nameEn).toBe("Chamchuri 5 / Education pedestrian gate");
    expect(
      filterGates(
        dataset!.gates,
        { ...defaultFilters, query: "unfindable-test-query" },
        null,
        now,
      ),
    ).toHaveLength(0);
  });
  it("computes vehicle and schedule gaps from current evidence", () => {
    const g = fixture();
    const s = qualityStats(
      [
        {
          ...g,
          permissions: { pedestrian: true, car: true, motorcycle: false },
        },
      ],
      now,
    );
    expect(s.vehiclesUnknown).toBe(0);
    expect(s.schedulesUnknown).toBe(0);
  });
});
describe("external directions", () => {
  it("uses the gate coordinates and correct travel mode", () => {
    const g = fixture();
    const url = new URL(directionsUrl(g, "pedestrian")!);
    expect(url.origin).toBe("https://www.google.com");
    expect(url.searchParams.get("destination")).toBe(
      `${g.latitude},${g.longitude}`,
    );
    expect(url.searchParams.get("travelmode")).toBe("walking");
    expect(
      new URL(directionsUrl(g, "motorcycle")!).searchParams.get("travelmode"),
    ).toBe("two-wheeler");
    expect(
      new URL(directionsUrl(g, "car")!).searchParams.get("travelmode"),
    ).toBe("driving");
  });
  it("disables directions for a missing coordinate", () =>
    expect(
      directionsUrl({ ...fixture(), latitude: null, longitude: null }, "car"),
    ).toBeNull());
  it("does not send device location in the directions URL", () =>
    expect(
      new URL(directionsUrl(fixture(), "car")!).searchParams.has("origin"),
    ).toBe(false));
});
