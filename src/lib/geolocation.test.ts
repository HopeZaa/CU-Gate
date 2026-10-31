import { describe, expect, it, vi } from "vitest";
import { startLocationWatch } from "./geolocation";
function mockGeo() {
  let success: PositionCallback = () => {};
  let error: PositionErrorCallback | null = null;
  return {
    geo: {
      watchPosition: vi.fn(
        (s: PositionCallback, e: PositionErrorCallback | null) => {
          success = s;
          error = e;
          return 42;
        },
      ),
      clearWatch: vi.fn(),
    } as unknown as Geolocation,
    success: (p: GeolocationPosition) => success(p),
    error: (code: number) =>
      error?.({ code, message: "test" } as GeolocationPositionError),
  };
}
const pos = {
  coords: { latitude: 13.738, longitude: 100.53, accuracy: 8 },
  timestamp: 1000,
} as GeolocationPosition;
describe("geolocation lifecycle", () => {
  it("does not pretend unsupported or insecure GPS works", () => {
    const state = vi.fn();
    startLocationWatch(undefined, vi.fn(), state);
    expect(state).toHaveBeenCalledWith("unsupported");
    startLocationWatch(undefined, vi.fn(), state, false);
    expect(state).toHaveBeenCalledWith("insecure");
  });
  it("requests permission via watchPosition and only becomes active on a real callback", () => {
    const m = mockGeo(),
      state = vi.fn(),
      position = vi.fn();
    startLocationWatch(m.geo, position, state);
    expect(state).toHaveBeenLastCalledWith("requesting");
    expect(position).not.toHaveBeenCalled();
    m.success(pos);
    expect(state).toHaveBeenLastCalledWith("active");
    expect(position).toHaveBeenLastCalledWith({
      latitude: 13.738,
      longitude: 100.53,
      accuracy: 8,
      timestamp: 1000,
    });
  });
  it.each([
    [1, "denied"],
    [2, "unavailable"],
    [3, "timeout"],
  ])("handles error %s and clears its watch", (code, label) => {
    const m = mockGeo(),
      state = vi.fn();
    startLocationWatch(m.geo, vi.fn(), state);
    m.error(Number(code));
    expect(state).toHaveBeenLastCalledWith(label);
    expect(m.geo.clearWatch).toHaveBeenCalledWith(42);
  });
  it("stops updates after cleanup", () => {
    const m = mockGeo(),
      position = vi.fn(),
      stop = startLocationWatch(m.geo, position, vi.fn());
    stop();
    m.success(pos);
    expect(position).not.toHaveBeenCalled();
    expect(m.geo.clearWatch).toHaveBeenCalledWith(42);
  });
  it("rejects malformed GPS readings", () => {
    const m = mockGeo(),
      state = vi.fn();
    startLocationWatch(m.geo, vi.fn(), state);
    m.success({ ...pos, coords: { ...pos.coords, latitude: NaN } });
    expect(state).toHaveBeenLastCalledWith("unavailable");
  });
  it("handles browsers that throw when requesting a watch", () => {
    const geo = {
      watchPosition: () => {
        throw Error("disabled");
      },
      clearWatch: vi.fn(),
    } as unknown as Geolocation;
    const state = vi.fn();
    startLocationWatch(geo, vi.fn(), state);
    expect(state).toHaveBeenLastCalledWith("unavailable");
  });
});

it("clears a watch only once when cleanup follows an error or a repeated stop", () => {
  const m = mockGeo(),
    state = vi.fn(),
    stop = startLocationWatch(m.geo, vi.fn(), state);
  m.error(1);
  stop();
  stop();
  expect(m.geo.clearWatch).toHaveBeenCalledTimes(1);
});
