import { useEffect, useRef, useState } from "react";
import type { PointerEvent, KeyboardEvent } from "react";
import { clampDetailHeight } from "./map-location";
export function useResizableDetails(onHeightChange: (height: number) => void) {
  const panel = useRef<HTMLElement>(null);
  const [height, setHeight] = useState<number | null>(null),
    [measured, setMeasured] = useState(360);
  const drag = useRef<{ y: number; height: number } | null>(null),
    moved = useRef(false);
  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const next = Math.round(element.getBoundingClientRect().height);
      setMeasured(next);
      onHeightChange(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeightChange]);
  useEffect(() => {
    const resize = () =>
      setHeight((current) =>
        current === null ? null : clampDetailHeight(current, innerHeight),
      );
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return {
    panel,
    height,
    value: height ?? measured,
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (event.button !== 0) return;
      drag.current = {
        y: event.clientY,
        height: panel.current?.getBoundingClientRect().height || measured,
      };
      moved.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove(event: PointerEvent<HTMLButtonElement>) {
      if (!drag.current) return;
      const delta = drag.current.y - event.clientY;
      if (Math.abs(delta) > 3) moved.current = true;
      if (moved.current)
        setHeight(clampDetailHeight(drag.current.height + delta, innerHeight));
    },
    onPointerUp(event: PointerEvent<HTMLButtonElement>) {
      drag.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
    },
    onClick() {
      if (moved.current) {
        moved.current = false;
        return;
      }
      setHeight(
        (height ?? measured) > 260
          ? 190
          : clampDetailHeight(innerHeight * 0.62, innerHeight),
      );
    },
    onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      setHeight(
        clampDetailHeight(
          event.key === "Home"
            ? 160
            : event.key === "End"
              ? innerHeight
              : measured + (event.key === "ArrowUp" ? 32 : -32),
          innerHeight,
        ),
      );
    },
  };
}
