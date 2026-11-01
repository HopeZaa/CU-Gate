import { describe, it, expect, vi } from "vitest";
import { compassHeading, startHeadingWatch } from "./heading";
describe("device compass", () => {
  it("uses a real vendor compass reading and normalizes screen orientation", () => {
    expect(compassHeading({ webkitCompassHeading: 350 }, 90)).toBe(80);
    expect(compassHeading({ webkitCompassHeading: 0 })).toBe(0);
  });
  it("does not turn relative device angles into a north-facing claim", () => {
    expect(compassHeading({ alpha: 90, absolute: false })).toBeNull();
    expect(compassHeading({ alpha: null, absolute: true })).toBeNull();
    expect(
      compassHeading({ webkitCompassHeading: 40, webkitCompassAccuracy: -1 }),
    ).toBeNull();
  });
  it("converts earth-referenced alpha to clockwise heading", () => {
    expect(compassHeading({ alpha: 90, absolute: true })).toBe(270);
    expect(compassHeading({ alpha: 90, absolute: true }, 90)).toBe(0);
  });
  it("starts only after permission and cleans up listeners", async () => {
    const target = new EventTarget(),
      onHeading = vi.fn(),
      state = vi.fn();
    const stop = startHeadingWatch(
      target,
      { requestPermission: async () => "granted" },
      onHeading,
      state,
    );
    await Promise.resolve();
    const event = new Event("deviceorientation");
    Object.assign(event, { webkitCompassHeading: 90 });
    target.dispatchEvent(event);
    expect(onHeading).toHaveBeenCalledWith(90);
    expect(state).toHaveBeenLastCalledWith("active");
    stop();
    target.dispatchEvent(event);
    expect(onHeading).toHaveBeenCalledTimes(1);
  });
  it("cannot restart a disposed watch after a delayed permission grant", async () => {
    const target = new EventTarget(),
      heading = vi.fn(),
      state = vi.fn();
    let grant!: (value: "granted") => void;
    const stop = startHeadingWatch(
      target,
      {
        requestPermission: () =>
          new Promise((resolve) => {
            grant = resolve;
          }),
      },
      heading,
      state,
    );
    stop();
    grant("granted");
    await Promise.resolve();
    const event = new Event("deviceorientation");
    Object.assign(event, { webkitCompassHeading: 30 });
    target.dispatchEvent(event);
    expect(heading).not.toHaveBeenCalled();
  });
  it("reports denied and unsupported sensors without a fake heading", async () => {
    const heading = vi.fn(),
      state = vi.fn();
    startHeadingWatch(new EventTarget(), undefined, heading, state);
    expect(state).toHaveBeenLastCalledWith("unsupported");
    startHeadingWatch(
      new EventTarget(),
      { requestPermission: async () => "denied" },
      heading,
      state,
    );
    await Promise.resolve();
    expect(state).toHaveBeenLastCalledWith("denied");
    expect(heading).not.toHaveBeenCalled();
  });
});
