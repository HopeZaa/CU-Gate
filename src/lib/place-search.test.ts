import { describe, it, expect } from "vitest";
import {
  coordinatePlace,
  searchLocalPlaces,
  parsePhotonPlaces,
} from "./place-search";
describe("typed starting points", () => {
  it("accepts user coordinates and rejects invalid ranges", () => {
    expect(coordinatePlace("13.738, 100.53")).toMatchObject({
      latitude: 13.738,
      longitude: 100.53,
      type: "selected-place",
    });
    expect(coordinatePlace("91,100")).toBeNull();
    expect(coordinatePlace("13,181")).toBeNull();
    expect(coordinatePlace("random place")).toBeNull();
  });
  it("finds local bilingual landmarks without an online request", () => {
    expect(searchLocalPlaces("Sam Yan").some((p) => p.id === "sam-yan")).toBe(
      true,
    );
    expect(searchLocalPlaces("สามย่าน").length).toBeGreaterThan(0);
  });
  it("validates online geometry and keeps results separate from device GPS", () => {
    const data = {
      features: [
        {
          geometry: { type: "Point", coordinates: [100.53, 13.738] },
          properties: { name: "Public test place", osm_type: "N", osm_id: 123 },
        },
        {
          geometry: { type: "Point", coordinates: [200, 13] },
          properties: { name: "Invalid" },
        },
      ],
    };
    expect(parsePhotonPlaces(data)).toHaveLength(1);
    expect(parsePhotonPlaces(data)[0]).toMatchObject({
      type: "selected-place",
      latitude: 13.738,
      longitude: 100.53,
      source: "https://www.openstreetmap.org/node/123",
    });
    expect(parsePhotonPlaces({ features: "broken" })).toEqual([]);
  });
});
