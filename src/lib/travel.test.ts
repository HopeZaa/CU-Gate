import { describe, it, expect } from "vitest";
import { dataset } from "./data";
import { includesMode, recordedMode, travelModes } from "./travel";
import { defaultFilters, filterGates } from "./gates";
const now = new Date("2026-11-02T05:00:00Z");
describe("travel filter hierarchy", () => {
  it("includes lower modes without inferring upwards", () => {
    expect(travelModes.map((m) => includesMode("car", m))).toEqual([
      true,
      true,
      true,
    ]);
    expect(travelModes.map((m) => includesMode("motorcycle", m))).toEqual([
      true,
      true,
      false,
    ]);
    expect(travelModes.map((m) => includesMode("pedestrian", m))).toEqual([
      true,
      false,
      false,
    ]);
  });
  it("updates list and map candidates from the same filter", () => {
    for (const mode of ["motorcycle", "car"] as const) {
      const found = filterGates(
        dataset!.gates,
        { ...defaultFilters, mode },
        null,
        now,
        true,
      );
      expect(found.every((g) => recordedMode(g, mode) !== false)).toBe(true);
      expect(found.some((g) => g.id === "phayathai-3")).toBe(true);
      expect(found.some((g) => g.id === "health-2")).toBe(false);
    }
  });
});
