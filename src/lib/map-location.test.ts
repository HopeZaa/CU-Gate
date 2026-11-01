import { describe, it, expect } from "vitest";
import { dataset } from "./data";
import {
  withinCampusMap,
  nearestSuggestion,
  clampDetailHeight,
} from "./map-location";
const now = new Date("2026-11-01T05:00:00Z");
describe("live map helpers", () => {
  it("does not plot device location outside the campus coverage", () => {
    expect(withinCampusMap({ latitude: 13.738, longitude: 100.53 })).toBe(true);
    expect(withinCampusMap({ latitude: 14, longitude: 100.53 })).toBe(false);
  });
  it("chooses exactly one nearest scheduled-open gate", () => {
    const c = dataset!.gates.find((g) => g.id === "phayathai-3")!;
    expect(
      nearestSuggestion(
        dataset!.gates,
        { latitude: c.latitude!, longitude: c.longitude! },
        "motorcycle",
        "entry",
        now,
      ),
    ).toMatchObject({ gate: { id: c.id }, open: true, distance: 0 });
  });
  it("does not prefer a closed gate over a nearby open option", () => {
    const b = dataset!.gates.find((g) => g.id === "phayathai-2")!;
    const result = nearestSuggestion(
      dataset!.gates,
      { latitude: b.latitude!, longitude: b.longitude! },
      "car",
      "entry",
      now,
    );
    expect(result?.open).toBe(true);
    expect(result?.gate.id).not.toBe(b.id);
  });
  it("can identify the nearest fallback without claiming open access", () => {
    const g = dataset!.gates.find((g) => g.id === "science")!;
    expect(
      nearestSuggestion(
        [g],
        { latitude: g.latitude!, longitude: g.longitude! },
        "car",
        "entry",
        now,
      )?.open,
    ).toBe(false);
  });
  it("clamps drag-resized detail panels to usable screen bounds", () => {
    expect(clampDetailHeight(100, 844)).toBe(160);
    expect(clampDetailHeight(1000, 844)).toBe(754);
    expect(clampDetailHeight(320, 844)).toBe(320);
  });
});
