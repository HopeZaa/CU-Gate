import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import type { Feature, Polygon } from "geojson";
import { Crosshair, Maximize, RefreshCw, Palette, X } from "lucide-react";
import type { Gate, TravelMode } from "../lib/data";
import { hasCoordinates } from "../lib/gates";
import type { StartingPoint } from "../lib/origins";
import type { Position } from "../lib/gates";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCopy } from "../lib/i18n";
import { createGatePin, updateGatePin, createPointPin } from "../lib/map-pins";
import type { GatePin } from "../lib/map-pins";
import { withinCampusMap } from "../lib/map-location";
import type { Language } from "../lib/i18n";
type Props = {
  gates: Gate[];
  selected: string | null;
  onSelect: (id: string) => void;
  position: Position | null;
  referencePoint: StartingPoint | null;
  focusLocation: number;
  dark: boolean;
  mode: TravelMode | "all";
  direction: "entry" | "exit";
  now: Date;
  overview: number;
  expanded: boolean;
  legendVisible: boolean;
  onToggleLegend: () => void;
  heading: number | null;
  headingIsCourse: boolean;
  suggestedId: string | null;
  selectionFocus: number;
  detailHeight: number;
};
const bounds: maplibregl.LngLatBoundsLike = [
  [100.5235, 13.733],
  [100.5355, 13.7474],
];
function mapStyle(dark: boolean): StyleSpecification {
  const colors = dark
    ? {
        bg: "#202a2c",
        green: "#30423b",
        water: "#33545d",
        building: "#3a4246",
        outline: "#455054",
        road: "#5a6264",
        path: "#747a73",
      }
    : {
        bg: "#f0efe9",
        green: "#dce7d4",
        water: "#c3dfe1",
        building: "#e0ddd9",
        outline: "#d5d2cc",
        road: "#fffefb",
        path: "#d7d4c9",
      };
  return {
    version: 8,
    sources: {
      campus: {
        type: "geojson",
        data: new URL(
          "campus.geojson",
          new URL(import.meta.env.BASE_URL, document.baseURI),
        ).href,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> · local extract 1 Nov 2026',
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": colors.bg },
      },
      {
        id: "greens",
        type: "fill",
        source: "campus",
        filter: ["==", ["get", "kind"], "green"],
        paint: { "fill-color": colors.green },
      },
      {
        id: "water",
        type: "fill",
        source: "campus",
        filter: ["==", ["get", "kind"], "water"],
        paint: { "fill-color": colors.water },
      },
      {
        id: "buildings",
        type: "fill",
        source: "campus",
        filter: ["==", ["get", "kind"], "building"],
        paint: {
          "fill-color": colors.building,
          "fill-outline-color": colors.outline,
        },
      },
      {
        id: "roads",
        type: "line",
        source: "campus",
        filter: [
          "all",
          ["==", ["get", "kind"], "road"],
          [
            "!",
            [
              "in",
              ["get", "road"],
              [
                "literal",
                ["footway", "path", "steps", "cycleway", "pedestrian"],
              ],
            ],
          ],
        ],
        paint: {
          "line-color": colors.road,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13,
            1,
            17,
            [
              "match",
              ["get", "road"],
              ["primary", "secondary", "tertiary"],
              17,
              ["residential", "unclassified"],
              10,
              5,
            ],
          ],
          "line-opacity": 0.97,
        },
        layout: { "line-join": "round", "line-cap": "round" },
      },
      {
        id: "paths",
        type: "line",
        source: "campus",
        filter: [
          "all",
          ["==", ["get", "kind"], "road"],
          [
            "in",
            ["get", "road"],
            ["literal", ["footway", "path", "steps", "cycleway", "pedestrian"]],
          ],
        ],
        paint: {
          "line-color": colors.path,
          "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.6, 18, 3],
          "line-dasharray": [2, 1.5],
        },
      },
    ],
  };
}
const labels: [number, number, string, string][] = [
  [100.5319, 13.73855, "CHULALONGKORN", "campus-label"],
  [100.5319, 13.73823, "UNIVERSITY", "campus-sub-label"],
  [100.5327, 13.7389, "CU Auditorium", "place-label"],
  [100.5314, 13.7375, "Science", "place-label"],
  [100.5331, 13.7387, "Arts", "place-label"],
  [100.5334, 13.7354, "Engineering", "place-label"],
  [100.5311, 13.7343, "Commerce & Accountancy", "place-label"],
  [100.5333, 13.734, "Political Science", "place-label"],
  [100.5261, 13.7374, "CU Stadium", "place-label"],
  [100.5265, 13.7399, "Dhamma Center", "place-label"],
  [100.5273, 13.7428, "Sasin", "place-label"],
  [100.5285, 13.736, "Communication Arts", "place-label"],
  [100.528, 13.738, "Education", "place-label"],
  [100.5312, 13.7429, "Pharmacy", "place-label"],
  [100.5326, 13.7403, "Veterinary Science", "place-label"],
  [100.5335, 13.7432, "Dentistry", "place-label"],
  [100.5276, 13.7442, "Health Sciences", "place-label"],
  [100.5277, 13.7471, "BTS National Stadium", "station-label"],
  [100.5258, 13.7471, "RAMA I ROAD", "road-label"],
  [100.5317, 13.744, "SIAM SQUARE", "district-label"],
  [100.5294, 13.7409, "PHAYATHAI ROAD", "road-label vertical"],
  [100.53465, 13.7372, "HENRI DUNANT ROAD", "road-label vertical"],
  [100.5287, 13.7319, "RAMA IV ROAD", "road-label"],
  [100.5236, 13.7395, "Centenary Park", "place-label"],
  [100.5294, 13.733, "M  Sam Yan", "station-label"],
  [100.5253, 13.7358, "Sam Yan Market", "place-label"],
];
export default function CampusMap({
  gates,
  selected,
  onSelect,
  position,
  referencePoint,
  focusLocation,
  dark,
  mode,
  direction,
  now,
  overview,
  expanded,
  legendVisible,
  onToggleLegend,
  heading,
  headingIsCourse,
  suggestedId,
  selectionFocus,
  detailHeight,
}: Props) {
  const { lang, t } = useCopy();
  const container = useRef<HTMLDivElement>(null),
    map = useRef<maplibregl.Map | null>(null);
  const pins = useRef(new Map<string, GatePin>());
  const labelHandles = useRef<maplibregl.Marker[]>([]);
  const device = useRef<ReturnType<typeof createPointPin> | null>(null),
    reference = useRef<ReturnType<typeof createPointPin> | null>(null);
  const followGps = useRef(false),
    lastFocus = useRef(0);
  const live = useRef({
    gates,
    onSelect,
    dark,
    lang,
    position,
    referencePoint,
    detailHeight,
  });
  useEffect(() => {
    live.current = {
      gates,
      onSelect,
      dark,
      lang,
      position,
      referencePoint,
      detailHeight,
    };
  });
  const [ready, setReady] = useState(false),
    [error, setError] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!container.current) return;
    const store = pins.current;
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({
        container: container.current,
        style: mapStyle(live.current.dark),
        bounds,
        fitBoundsOptions: { padding: 40 },
        minZoom: 14,
        maxZoom: 19,
        maxBounds: [
          [100.5, 13.7],
          [100.56, 13.78],
        ],
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: false,
        locale: mapLocale(live.current.lang),
      });
    } catch {
      queueMicrotask(() => setError("unsupported"));
      return;
    }
    map.current = m;
    m.touchZoomRotate.disableRotation();
    m.on("dragstart", () => {
      followGps.current = false;
    });
    m.on("zoomstart", (e) => {
      if (e.originalEvent) followGps.current = false;
    });
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right",
    );
    m.addControl(
      new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }),
      "top-left",
    );
    m.on("load", () => {
      labels.forEach(([lon, lat, text, cls]) => {
        const el = document.createElement("span");
        el.className = `map-label ${cls}`;
        el.dataset.labelText = text;
        el.textContent = mapLabel(text, live.current.lang);
        labelHandles.current.push(
          new maplibregl.Marker({ element: el, subpixelPositioning: true })
            .setLngLat([lon, lat])
            .addTo(m),
        );
        el.setAttribute("aria-hidden", "true");
        el.setAttribute("tabindex", "-1");
        el.removeAttribute("role");
      });
      setReady(true);
      setError(null);
      // Development integration fixture only; removed by Vite in production.
      if (import.meta.env.DEV)
        window.dispatchEvent(new CustomEvent("cu-map-ready", { detail: m }));
    });
    m.on("error", (e) => {
      if ("sourceId" in e && e.sourceId === "campus") setError("source");
    });
    m.on("webglcontextlost", () => setError("graphics"));
    // Resizing adjusts the viewport only. It never resets a user-selected zoom/centre.
    const observer = new ResizeObserver(() => m.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      store.forEach((pin) => pin.marker.remove());
      store.clear();
      labelHandles.current.forEach((marker) => marker.remove());
      labelHandles.current = [];
      device.current?.marker.remove();
      device.current = null;
      reference.current?.marker.remove();
      reference.current = null;
      m.remove();
      map.current = null;
    };
  }, [retry]);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    for (const layer of mapStyle(dark).layers)
      if (layer.paint)
        for (const [key, value] of Object.entries(layer.paint))
          if (m.getLayer(layer.id)) m.setPaintProperty(layer.id, key, value);
  }, [dark, ready]);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const mapped = gates.filter(hasCoordinates),
      ids = new Set(mapped.map((g) => g.id));
    for (const [id, pin] of pins.current)
      if (!ids.has(id)) {
        pin.marker.remove();
        pins.current.delete(id);
      }
    for (const gate of mapped) {
      let pin = pins.current.get(gate.id);
      if (!pin) {
        pin = createGatePin(m, gate, (id) => live.current.onSelect(id));
        pins.current.set(gate.id, pin);
      }
      const at = pin.marker.getLngLat();
      if (at.lng !== gate.longitude || at.lat !== gate.latitude)
        pin.marker.setLngLat([gate.longitude, gate.latitude]);
      updateGatePin(
        pin,
        gate,
        mode,
        direction,
        now,
        lang,
        gate.id === selected,
        gate.id === suggestedId,
      );
    }
  }, [gates, mode, direction, now, lang, selected, suggestedId, ready]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !selected) return;
    const gate = live.current.gates.find((g) => g.id === selected);
    if (!gate || !hasCoordinates(gate)) return;
    followGps.current = false;
    // Camera movement is an explicit selection action, never a side effect of
    // location fixes, heading updates, status rendering or resizing details.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        m.resize();
        const height =
          document.querySelector(".gate-details")?.getBoundingClientRect()
            .height || live.current.detailHeight;
        const mobile = innerWidth <= 760;
        m.easeTo({
          center: [gate.longitude, gate.latitude],
          zoom: Math.max(m.getZoom(), 17.2),
          duration: 350,
          offset: mobile
            ? [
                0,
                -Math.min(
                  height / 2,
                  Math.max(0, m.getContainer().clientHeight / 2 - 80),
                ),
              ]
            : [-115, 0],
        });
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [selected, selectionFocus, ready]);
  useEffect(() => {
    const m = map.current;
    if (ready && m && overview) {
      followGps.current = false;
      m.fitBounds(bounds, { padding: 40, duration: 300 });
    }
  }, [overview, ready]);
  useEffect(() => {
    if (ready) map.current?.resize();
  }, [expanded, ready]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    if (!position) {
      device.current?.marker.remove();
      device.current = null;
      if (m.getLayer("accuracy")) m.removeLayer("accuracy");
      if (m.getSource("accuracy")) m.removeSource("accuracy");
      return;
    }
    if (!device.current) {
      device.current = createPointPin(m, "device");
      const cone = document.createElement("span");
      cone.className = "user-heading";
      device.current.content.append(cone);
    }
    const { marker, content } = device.current;
    marker.setLngLat([position.longitude, position.latitude]);
    content.dataset.heading =
      heading === null ? "" : String(Math.round(heading));
    content.dataset.headingKind = headingIsCourse ? "course" : "compass";
    const cone = content.querySelector(".user-heading") as HTMLElement;
    cone.hidden = heading === null;
    cone.style.setProperty("--heading", `${heading ?? 0}deg`);
    const kind =
      lang === "th"
        ? headingIsCourse
          ? "ทิศการเคลื่อนที่"
          : "ทิศอุปกรณ์"
        : headingIsCourse
          ? "Travel direction"
          : "Device compass";
    content.title = `${lang === "th" ? "ตำแหน่งของคุณ" : "Your location"} ±${Math.round(position.accuracy ?? 0)} m${heading === null ? "" : ` · ${kind} ${Math.round(heading)}°`}`;
    content.setAttribute("aria-label", content.title);
    const radius = Math.min(position.accuracy ?? 0, 5000),
      coords: number[][] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * 2 * Math.PI;
      coords.push([
        position.longitude +
          (radius * Math.cos(a)) /
            (111320 * Math.cos((position.latitude * Math.PI) / 180)),
        position.latitude + (radius * Math.sin(a)) / 111320,
      ]);
    }
    const geo: Feature<Polygon> = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [coords] },
    };
    const source = m.getSource("accuracy") as GeoJSONSource | undefined;
    if (source) source.setData(geo);
    else {
      m.addSource("accuracy", { type: "geojson", data: geo });
      m.addLayer({
        id: "accuracy",
        type: "fill",
        source: "accuracy",
        paint: {
          "fill-color": "#3988db",
          "fill-opacity": 0.12,
          "fill-outline-color": "#3988db",
        },
      });
    }
  }, [position, heading, headingIsCourse, ready, lang]);
  useEffect(() => {
    const m = map.current;
    if (ready && m && position && followGps.current && !m.isMoving())
      m.easeTo({
        center: [position.longitude, position.latitude],
        duration: 250,
      });
  }, [position, ready]);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    if (!referencePoint) {
      reference.current?.marker.remove();
      reference.current = null;
      return;
    }
    if (!reference.current) reference.current = createPointPin(m, "reference");
    reference.current.marker.setLngLat([
      referencePoint.longitude,
      referencePoint.latitude,
    ]);
    reference.current.content.textContent =
      referencePoint.id === "sam-yan" ? "M" : "S";
    reference.current.content.title = t(
      "จุดเริ่มต้นที่เลือก ไม่ใช่ GPS ของคุณ",
      "Selected starting point, not your GPS location",
    );
    reference.current.content.setAttribute(
      "aria-label",
      reference.current.content.title,
    );
  }, [referencePoint, ready, lang, t]);
  useEffect(() => {
    const m = map.current,
      point = referencePoint || position;
    if (
      !ready ||
      !m ||
      !point ||
      !focusLocation ||
      lastFocus.current === focusLocation
    )
      return;
    lastFocus.current = focusLocation;
    if (withinCampusMap(point)) {
      followGps.current = !!position && !referencePoint;
      m.easeTo({
        center: [point.longitude, point.latitude],
        zoom: 16.3,
        duration: 400,
      });
    }
  }, [focusLocation, position, referencePoint, ready]);
  useEffect(() => {
    if (!ready) return;
    labelHandles.current.forEach((marker) => {
      const el = marker.getElement();
      el.textContent = mapLabel(el.dataset.labelText || "", lang);
    });
    const controls: [string, string][] = [
      [".maplibregl-ctrl-zoom-in", t("ขยายแผนที่", "Zoom in")],
      [".maplibregl-ctrl-zoom-out", t("ย่อแผนที่", "Zoom out")],
      [".maplibregl-ctrl-compass", t("หันทิศเหนือ", "Reset north")],
    ];
    for (const [selector, label] of controls) {
      const el = container.current?.querySelector(selector);
      el?.setAttribute("aria-label", label);
      el?.setAttribute("title", label);
    }
    map.current
      ?.getCanvas()
      .setAttribute("aria-label", t("แผนที่มหาวิทยาลัย", "Campus map"));
  }, [lang, ready, t]);
  return (
    <div
      className="map-stage"
      data-map-ready={ready && !error}
      aria-label={t("แผนที่แบบโต้ตอบ", "Interactive campus map")}
    >
      <div ref={container} className="map-canvas" />
      {!ready && !error && (
        <div className="map-loading">
          <span className="spinner" />
          {t("กำลังวาดแผนที่…", "Drawing campus map…")}
        </div>
      )}
      {error && (
        <div className="map-error" role="alert">
          <strong>{t("แผนที่ยังไม่พร้อม", "Map unavailable")}</strong>
          <p>
            {error === "unsupported"
              ? t(
                  "อุปกรณ์นี้เปิดแผนที่ไม่ได้ ยังเลือกประตูและนำทางจากรายการได้",
                  "This device could not start the map. Use the gate list and directions instead.",
                )
              : error === "source"
                ? t(
                    "โหลดข้อมูลแผนที่ไม่สำเร็จ ลองใหม่หรือใช้รายการประตู",
                    "The map data could not load. Retry or use the gate list.",
                  )
                : t(
                    "การแสดงแผนที่ขัดข้อง ลองเปิดแผนที่ใหม่",
                    "The map graphics connection was interrupted. Retry the map.",
                  )}
          </p>
          <button
            onClick={() => {
              setReady(false);
              setError(null);
              setRetry((x) => x + 1);
            }}
          >
            <RefreshCw size={16} />
            {t("ลองเปิดแผนที่อีกครั้ง", "Retry map")}
          </button>
        </div>
      )}
      <div className="map-tools">
        <button
          title={t("ดูมหาวิทยาลัยทั้งหมด", "Fit campus")}
          aria-label={t("ดูมหาวิทยาลัยทั้งหมด", "Fit campus")}
          onClick={() => {
            followGps.current = false;
            map.current?.fitBounds(bounds, { padding: 35, duration: 350 });
          }}
        >
          <Maximize size={18} />
        </button>
        <button
          title={t("กลับไปจุดเริ่มต้น", "Center on starting point")}
          aria-label={t("กลับไปจุดเริ่มต้น", "Center on starting point")}
          disabled={!position && !referencePoint}
          onClick={() => {
            const point = referencePoint || position;
            if (point) {
              followGps.current = !!position && !referencePoint;
              map.current?.easeTo({
                center: [point.longitude, point.latitude],
                zoom: 17,
              });
            }
          }}
        >
          <Crosshair size={18} />
        </button>
      </div>
      <div className="map-footer">
        <div
          className={`map-legend status-legend ${legendVisible ? "" : "collapsed"}`}
          aria-label={t("ความหมายสีหมุด", "Marker status legend")}
        >
          <div
            id="map-legend-content"
            className="map-legend-content"
            hidden={!legendVisible}
          >
            <span>
              <i className="status-dot availability-open" />
              {t("เปิด", "Open")}
            </span>
            <span>
              <i className="status-dot availability-closed" />
              {t("ปิด/ไม่อนุญาต", "Closed")}
            </span>
            <span>
              <i className="status-dot availability-restricted" />
              {t("มีเงื่อนไข", "Restricted")}
            </span>
            <span>
              <i className="status-dot availability-unknown" />
              {t("ไม่มีตาราง", "No schedule")}
            </span>
          </div>
          <button
            className={`map-overlay-toggle ${legendVisible ? "overlay-close" : "overlay-restore"}`}
            aria-label={
              legendVisible
                ? t("ซ่อนคำอธิบายสีหมุด", "Hide marker legend")
                : t("แสดงคำอธิบายสีหมุด", "Show marker legend")
            }
            title={
              legendVisible
                ? t("ซ่อนคำอธิบายสีหมุด", "Hide marker legend")
                : t("แสดงคำอธิบายสีหมุด", "Show marker legend")
            }
            aria-expanded={legendVisible}
            aria-controls="map-legend-content"
            onClick={onToggleLegend}
          >
            {legendVisible ? (
              <X size={15} />
            ) : (
              <>
                <Palette size={15} />
                <span>{t("สีหมุด", "Map legend")}</span>
              </>
            )}
          </button>
        </div>
        <a
          className="map-credits"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          title="Map data © OpenStreetMap contributors"
        >
          © OpenStreetMap
        </a>
      </div>
    </div>
  );
}

function mapLocale(lang: Language): Record<string, string> {
  return lang === "th"
    ? {
        "NavigationControl.ZoomIn": "ขยายแผนที่",
        "NavigationControl.ZoomOut": "ย่อแผนที่",
        "NavigationControl.ResetBearing": "หันทิศเหนือ",
        "Map.Title": "แผนที่มหาวิทยาลัย",
      }
    : {
        "NavigationControl.ZoomIn": "Zoom in",
        "NavigationControl.ZoomOut": "Zoom out",
        "NavigationControl.ResetBearing": "Reset north",
      };
}
function mapLabel(text: string, lang: Language) {
  const th: Record<string, string> = {
    CHULALONGKORN: "จุฬาลงกรณ์\nมหาวิทยาลัย",
    UNIVERSITY: "",
    "CU Auditorium": "หอประชุมจุฬาฯ",
    Science: "วิทยาศาสตร์",
    Arts: "อักษรศาสตร์",
    Engineering: "วิศวกรรมศาสตร์",
    "Commerce & Accountancy": "พาณิชย์–บัญชี",
    "Political Science": "รัฐศาสตร์",
    "CU Stadium": "สนามกีฬาจุฬาฯ",
    "Dhamma Center": "ธรรมสถาน",
    Sasin: "ศศินทร์",
    "Communication Arts": "นิเทศศาสตร์",
    Education: "ครุศาสตร์",
    Pharmacy: "เภสัชศาสตร์",
    Dentistry: "ทันตแพทยศาสตร์",
    "Health Sciences": "เขตวิทยาศาสตร์สุขภาพ",
    "BTS National Stadium": "BTS สนามกีฬาแห่งชาติ",
    "RAMA I ROAD": "ถนนพระราม 1",
    "Veterinary Science": "สัตวแพทยศาสตร์",
    "SIAM SQUARE": "สยามสแควร์",
    "PHAYATHAI ROAD": "ถนนพญาไท",
    "HENRI DUNANT ROAD": "ถนนอังรีดูนังต์",
    "RAMA IV ROAD": "ถนนพระราม 4",
    "Centenary Park": "อุทยาน 100 ปี",
    "M  Sam Yan": "M  สามย่าน",
    "Sam Yan Market": "ตลาดสามย่าน",
  };
  return lang === "th" ? (th[text] ?? text) : text;
}
