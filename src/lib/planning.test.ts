import { describe, expect, it } from "vitest";
import { dataset } from "./data";
import type { Gate } from "./data";
import {
  matchingReferences,
  planningLabel,
  planGateOrder,
  referenceFor,
  referenceYear,
} from "./planning";
import {
  accessState,
  defaultFilters,
  filterGates,
  hasCoordinates,
  haversine,
} from "./gates";
import { origins } from "./origins";
import {
  coordinateLabel,
  dateLabel,
  gateName,
  metricCopy,
  statusLabel,
} from "./i18n";
const data = dataset!,
  now = new Date("2026-11-01T05:00:00Z");
const gate = (id: string) => data.gates.find((g) => g.id === id)!;
describe("dated operating references", () => {
  it("keeps every operating reference separate from current permissions", () => {
    expect(data.gates.some((g) => g.referenceAccess.length > 0)).toBe(true);
    for (const g of data.gates)
      for (const r of g.referenceAccess) {
        expect(r.verificationStatus).toBe("HISTORICAL");
        expect(data.sources.some((s) => s.id === r.source)).toBe(true);
        expect(g.sources).toContain(r.source);
        expect(accessState(g, "car", "entry", now)).not.toBe("confirmed");
      }
  });
  it("includes a car source for motorcycle under the owner hierarchy", () => {
    const sasin = gate("sasin");
    expect(referenceFor(sasin, "car")?.appliesTo).toBe("car");
    expect(referenceFor(sasin, "motorcycle")?.appliesTo).toBe("car");
    expect(accessState(sasin, "motorcycle", "entry", now)).toBe("unknown");
  });
  it("includes a vehicle source for walking under the owner hierarchy", () => {
    expect(referenceFor(gate("phayathai-3"), "pedestrian")?.appliesTo).toBe("vehicle");
  });
  it("retains generic vehicle scope without asserting mode permission", () => {
    const g = gate("phayathai-3");
    expect(referenceFor(g, "motorcycle")?.appliesTo).toBe("vehicle");
    expect(g.permissions.motorcycle).toBeNull();
    expect(planningLabel(g, "car", "entry", now, "th").tone).toBe("caution");
  });
  it("uses explicit exit-only wording and excludes that gate from preferred entry ordering", () => {
    const g = gate("science"),
      others = [g, gate("phayathai-3")];
    expect(planningLabel(g, "car", "entry", now, "th").label).toContain(
      "ทางออกเท่านั้น",
    );
    expect(
      planGateOrder(
        others,
        "car",
        "entry",
        now,
        { latitude: g.latitude!, longitude: g.longitude! },
        "recommended",
        "th",
      )[0].id,
    ).toBe("phayathai-3");
  });
  it("allows exit ordering to use the same recorded exit evidence", () => {
    const g = gate("science");
    expect(planningLabel(g, "car", "exit", now, "th").tone).toBe("reference");
  });
  it("excludes event-only references from normal planning", () => {
    const g = {
      ...gate("science"),
      referenceAccess: [
        {
          ...gate("science").referenceAccess[0],
          context: "event-only" as const,
        },
      ],
    };
    expect(matchingReferences(g, "car")).toHaveLength(0);
    expect(matchingReferences(g, "car", true)).toHaveLength(1);
  });
  it("shows a source year in the chosen calendar", () => {
    const r = referenceFor(gate("henri-dunant-2"), "pedestrian")!;
    expect(referenceYear(r, data, "th")).toBe("2564");
    expect(referenceYear(r, data, "en")).toBe("2021");
  });
  it("keeps a verified closure above any historical planning label", () => {
    const g: Gate = {
      ...gate("science"),
      accessVerificationStatus: "VERIFIED",
      permissions: { car: false, motorcycle: null, pedestrian: null },
    };
    expect(planningLabel(g, "car", "entry", now, "th").state).toBe(
      "not-permitted",
    );
  });
});
describe("simpler discovery and public starting point", () => {
  it("finds Thai short names and nearby descriptions", () => {
    expect(
      filterGates(
        data.gates,
        { ...defaultFilters, query: "ตลาดสามย่าน" },
        null,
        now,
      ).some((g) => g.id === "stadium"),
    ).toBe(true);
    expect(
      filterGates(
        data.gates,
        { ...defaultFilters, query: "ประตูบัญชี" },
        null,
        now,
      ).map((g) => g.id),
    ).toEqual(["phayathai-3"]);
  });
  it("starts with main gate A when no origin is supplied", () => {
    expect(
      planGateOrder(
        data.gates.filter(hasCoordinates),
        "pedestrian",
        "entry",
        now,
        null,
        "recommended",
        "th",
      )[0].mapLetter,
    ).toBe("A");
  });
  it("sorts walking candidates from a sourced public landmark without device GPS", () => {
    expect(origins[0].type).toBe("public-landmark");
    expect(origins[0].source).toMatch(
      /^https:\/\/www.openstreetmap.org\/node\//,
    );
    const sorted = planGateOrder(
      data.gates.filter(hasCoordinates),
      "pedestrian",
      "entry",
      now,
      origins[0],
      "distance",
      "th",
    );
    expect(sorted[0].id).toBe("phayathai-3");
    expect(
      haversine(
        origins[0],
        sorted[0] as { latitude: number; longitude: number },
      ),
    ).toBeGreaterThan(0);
  });
});
describe("Thai and English copy", () => {
  it("has Thai names, descriptions and notes for every actual gate", () => {
    for (const g of data.gates) {
      expect(gateName(g, "th")).toMatch(/[ก-๙]/);
      expect(g.nearbyTh).toMatch(/[ก-๙]/);
      expect(g.notesTh).toMatch(/[ก-๙]/);
    }
  });
  it("translates dates, coordinate evidence and status without changing their meaning", () => {
    expect(dateLabel("2021-10-29", "th")).toContain("2564");
    expect(dateLabel("2021-10-29", "en")).toContain("2021");
    expect(coordinateLabel(gate("science"), "th")).toContain("โดยประมาณ");
    expect(statusLabel("HISTORICAL", "th")).toBe("ข้อมูลจากอดีต");
  });
  it("keeps data-quality labels localized", () => {
    expect(metricCopy("vehiclesUnknown", "th").label).toMatch(/[ก-๙]/);
    expect(metricCopy("vehiclesUnknown", "en").label).toContain("Vehicle");
  });
});

it('hands the selected public origin to Google Maps without changing the gate destination',async()=>{
 const {directionsUrl}=await import('./gates');
 const g=data.gates.find(g=>g.id==='phayathai-3')!;
 const url=new URL(directionsUrl(g,'car',origins[0])!);
 expect(url.searchParams.get('origin')).toBe(`${origins[0].latitude},${origins[0].longitude}`);
 expect(url.searchParams.get('destination')).toBe(`${g.latitude},${g.longitude}`);
 expect(new URL(directionsUrl(g,'car')!).searchParams.has('origin')).toBe(false);
});
