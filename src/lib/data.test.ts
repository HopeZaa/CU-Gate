import { describe, expect, it } from "vitest";
import raw from "../data/gates.json";
import { dataset, datasetSchema, gateSchema } from "./data";
import { hasCoordinates, qualityRows, qualityStats } from "./gates";
const now = new Date("2026-11-01T05:00:00Z");
describe("researched gate data", () => {
  it("parses the actual JSON and resolves all sources", () => {
    expect(datasetSchema.safeParse(raw).success).toBe(true);
  });
  it("has distinct IDs and coordinates", () => {
    const d = dataset!;
    expect(new Set(d.gates.map((g) => g.id)).size).toBe(d.gates.length);
    const coords = d.gates
      .filter(hasCoordinates)
      .map((g) => `${g.latitude},${g.longitude}`);
    expect(new Set(coords).size).toBe(coords.length);
  });
  it("never stores a building centroid as an entrance", () => {
    dataset!.gates
      .filter(hasCoordinates)
      .forEach((g) =>
        expect(g.coordinateSource).toMatch(
          /^https:\/\/www.openstreetmap.org\/node\/\d+$/,
        ),
      );
  });
  it("has no current access or schedules invented from historical notices", () => {
    for (const g of dataset!.gates) {
      expect(g.verificationStatus).toBe("HISTORICAL");
      expect(g.accessVerificationStatus).toBe("UNKNOWN");
      expect(g.entryAllowed).toBeNull();
      expect(g.exitAllowed).toBeNull();
      expect(Object.values(g.permissions).every((p) => p === null)).toBe(true);
      expect(g.schedule).toBeNull();
    }
  });
  it("rejects malformed JSON shape", () => {
    expect(datasetSchema.safeParse({ gates: "not an array" }).success).toBe(
      false,
    );
  });
  it("rejects out-of-range coordinates", () => {
    expect(
      gateSchema.safeParse({ ...dataset!.gates[0], latitude: 100 }).success,
    ).toBe(false);
  });
  it("rejects incomplete coordinate pairs", () => {
    expect(
      gateSchema.safeParse({ ...dataset!.gates[0], longitude: null }).success,
    ).toBe(false);
  });
  it("requires UNKNOWN status for null coordinates", () => {
    expect(
      gateSchema.safeParse({
        ...dataset!.gates[0],
        latitude: null,
        longitude: null,
      }).success,
    ).toBe(false);
  });
  it("requires provenance for a coordinate", () => {
    expect(
      gateSchema.safeParse({ ...dataset!.gates[0], coordinateSource: null })
        .success,
    ).toBe(false);
  });
  it("requires dates for verified coordinates", () => {
    expect(
      gateSchema.safeParse({
        ...dataset!.gates[0],
        coordinateLastVerified: null,
      }).success,
    ).toBe(false);
  });
  it("rejects impossible dates", () => {
    expect(
      gateSchema.safeParse({ ...dataset!.gates[0], lastReviewed: "2026-02-31" })
        .success,
    ).toBe(false);
  });
  it("rejects executable source URLs", () => {
    expect(
      gateSchema.safeParse({
        ...dataset!.gates[0],
        coordinateSource: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
  it("rejects duplicates and broken source references", () => {
    const d = structuredClone(dataset!);
    d.gates.push(d.gates[0]);
    expect(datasetSchema.safeParse(d).success).toBe(false);
    d.gates.pop();
    d.gates[0].sources.push("missing-source");
    expect(datasetSchema.safeParse(d).success).toBe(false);
  });
  it("reconciles dashboard partitions against every real record", () => {
    const d = dataset!,
      s = qualityStats(d.gates, now);
    expect(s.total).toBe(d.gates.length);
    expect(s.VERIFIED + s.HISTORICAL + s.UNVERIFIED + s.UNKNOWN).toBe(s.total);
    expect(s.gpsVerified + s.gpsApproximate + s.gpsUnknown).toBe(s.total);
    expect(s.vehiclesUnknown).toBe(s.total);
    expect(s.schedulesUnknown).toBe(s.total);
  });
  it("uses computed drilldowns for every dashboard metric", () => {
    const d = dataset!,
      s = qualityStats(d.gates, now);
    for (const key of Object.keys(s) as (keyof typeof s)[])
      expect(qualityRows(d.gates, key, now).length).toBe(s[key]);
  });
  it("recalculates when records change; it does not use fixed demonstration counts", () => {
    const g = structuredClone(dataset!.gates[0]);
    g.verificationStatus = "UNVERIFIED";
    const s = qualityStats([g], now);
    expect(s.total).toBe(1);
    expect(s.UNVERIFIED).toBe(1);
    expect(s.HISTORICAL).toBe(0);
    expect(s.gpsVerified).toBe(1);
  });
});

it("rejects malformed source dates and unmatched reference sources", () => {
  const d = structuredClone(dataset!);
  d.sources[0].publishedAt = "not-a-date";
  expect(datasetSchema.safeParse(d).success).toBe(false);
  const other = structuredClone(dataset!);
  const g = other.gates.find((g) => g.referenceAccess.length > 0)!;
  g.referenceAccess[0].source = "unresolved-reference";
  expect(datasetSchema.safeParse(other).success).toBe(false);
});

it("accepts the inspectable owner source but rejects unsafe local source paths", () => {
  const d = structuredClone(dataset!);
  const owner = d.sources.find((s) => s.id === "owner-gates-2026-11-01")!;
  expect(owner.url).toBe("research/owner-gates-2026-11-01.txt");
  owner.url = "research/../private.txt";
  expect(datasetSchema.safeParse(d).success).toBe(false);
});
it("rejects a broken owner-item link", () => {
  const d = structuredClone(dataset!);
  d.ownerInventory![0].gateId = "missing-gate";
  expect(datasetSchema.safeParse(d).success).toBe(false);
});

it("contains only main vehicle entrances and no pedestrian operating schedules", () => {
  expect(dataset!.mapScope).toBe("vehicle-main");
  for (const g of dataset!.gates) {
    expect(g.gateUse).toBe("vehicle");
    expect(
      g.operatingRules.every((r) => r.modes.every((m) => m !== "pedestrian")),
    ).toBe(true);
  }
  const d = structuredClone(dataset!);
  d.gates[0].gateUse = "pedestrian";
  expect(datasetSchema.safeParse(d).success).toBe(false);
});
