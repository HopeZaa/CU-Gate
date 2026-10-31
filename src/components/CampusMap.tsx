import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { GeoJSONSource, StyleSpecification } from "maplibre-gl";
import type { Feature, Polygon } from "geojson";
import { Crosshair, Maximize, RefreshCw } from "lucide-react";
import type { Gate, TravelMode } from "../lib/data";
import { hasCoordinates } from "../lib/gates";
import type { Position } from "../lib/gates";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCopy, gateName } from "../lib/i18n";
import { gateAvailability } from "../lib/availability";
import type { Language } from "../lib/i18n";
type Props = {
  gates: Gate[];
  selected: string | null;
  onSelect: (id: string) => void;
  position: Position | null;
  referencePoint: Position | null;
  focusLocation: number;
  dark: boolean;
  mode: TravelMode | "all";
  direction: "entry" | "exit";
  now: Date;
  overview: number;
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
}: Props) {
  const { lang, t } = useCopy();
  const langRef = useRef(lang),
    labelHandles = useRef<maplibregl.Marker[]>([]),
    referenceMarker = useRef<maplibregl.Marker | null>(null),
    lastFocus = useRef(0),
    gateRef = useRef(gates);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);
  useEffect(() => {
    gateRef.current = gates;
  }, [gates]);
  const container = useRef<HTMLDivElement>(null),
    map = useRef<maplibregl.Map | null>(null),
    user = useRef<maplibregl.Marker | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const darkRef = useRef(dark);
  useEffect(() => {
    darkRef.current = dark;
  }, [dark]);
  useEffect(() => {
    if (!container.current) return;
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({
        container: container.current,
        style: mapStyle(darkRef.current),
        bounds,
        fitBoundsOptions: { padding: 35 },
        minZoom: 14,
        maxZoom: 19,
        maxBounds: [
          [100.518, 13.727],
          [100.538, 13.75],
        ],
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: false,
        locale: mapLocale(langRef.current),
      });
    } catch {
      queueMicrotask(() => {
        setError("unsupported");
        setReady(false);
      });
      return;
    }
    map.current = m;
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right",
    );
    m.addControl(
      new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }),
      "bottom-left",
    );
    m.addControl(
      new maplibregl.AttributionControl({ compact: false }),
      "bottom-right",
    );
    const labelMarkers: maplibregl.Marker[] = [];
    labelHandles.current = labelMarkers;
    m.on("load", () => {
      m.fitBounds(bounds, { padding: 40, duration: 0 });
      setReady(true);
      setError(null);
      labels.forEach(([lon, lat, text, cls]) => {
        const el = document.createElement("span");
        el.textContent = mapLabel(text, langRef.current);
        el.dataset.labelText = text;
        el.className = `map-label ${cls}`;
        el.setAttribute("aria-hidden", "true");
        labelMarkers.push(
          new maplibregl.Marker({ element: el }).setLngLat([lon, lat]).addTo(m),
        );
        el.setAttribute("aria-hidden", "true");
        el.setAttribute("tabindex", "-1");
        el.removeAttribute("role");
      });
    });
    m.on("error", (e) => {
      if ("sourceId" in e && e.sourceId === "campus") {
        setError("source");
      }
    });
    m.on("webglcontextlost", () => {
      setError("graphics");
    });
    let visible =
      container.current.clientWidth > 0 && container.current.clientHeight > 0;
    const resize = new ResizeObserver(() => {
      m.resize();
      const shown =
        !!container.current &&
        container.current.clientWidth > 0 &&
        container.current.clientHeight > 0;
      if (shown && !visible) m.fitBounds(bounds, { padding: 40, duration: 0 });
      visible = shown;
    });
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      labelMarkers.forEach((l) => l.remove());
      labelHandles.current = [];
      referenceMarker.current?.remove();
      referenceMarker.current = null;
      user.current?.remove();
      user.current = null;
      m.remove();
      map.current = null;
    };
  }, [retry]);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const style = mapStyle(dark);
    for (const layer of style.layers)
      if (layer.paint)
        for (const [key, value] of Object.entries(layer.paint))
          if (m.getLayer(layer.id)) m.setPaintProperty(layer.id, key, value);
  }, [dark, ready, retry]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const markers = gates.filter(hasCoordinates).map((g) => {
      const el = document.createElement("button");
      el.type = "button";
      const status = gateAvailability(g, mode, direction, now, lang);
      el.className = `gate-marker availability-${status.state} ${g.category} ${g.coordinateConfidence === "HIGH" ? "" : "approximate"} ${selected === g.id ? "selected" : ""}`;
      const letter = document.createElement("span");
      letter.className = "marker-code";
      letter.textContent = g.mapCode || g.mapLetter || "•";
      const icon = document.createElement("span");
      icon.className = "marker-state";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = {
        open: "✓",
        closed: "×",
        restricted: "!",
        unknown: "?",
      }[status.state];
      el.append(letter, icon);
      el.title = `${gateName(g, lang)} · ${status.label}`;
      el.setAttribute(
        "aria-label",
        `${lang === "th" ? "หมุดประตู" : "Map gate:"} ${gateName(g, lang)} · ${status.label}`,
      );
      el.setAttribute("aria-pressed", String(selected === g.id));
      el.dataset.gateId = g.id;
      el.dataset.status = status.state;
      el.addEventListener("click", () => onSelect(g.id));
      return new maplibregl.Marker({ element: el })
        .setLngLat([g.longitude, g.latitude])
        .addTo(m);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [gates, selected, onSelect, ready, retry, lang, mode, direction, now]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const g = gateRef.current.find((g) => g.id === selected);
    if (g && hasCoordinates(g)) {
      // Wait for the mobile controls to collapse before centering above the card.
      const frame = window.requestAnimationFrame(() => {
        m.resize();
        m.easeTo({
          center: [g.longitude, g.latitude],
          zoom:
            window.innerWidth <= 760 ? Math.max(m.getZoom(), 17) : m.getZoom(),
          duration: 350,
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
          offset:
            window.innerWidth <= 760
              ? [0, -Math.min(window.innerHeight * 0.18, 150)]
              : [-115, 0],
        });
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [selected, ready]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || overview === 0) return;
    const frame = window.requestAnimationFrame(() => {
      m.resize();
      m.fitBounds(bounds, { padding: 40, duration: 300 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [overview, ready]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    user.current?.remove();
    user.current = null;
    if (!position) return;
    const el = document.createElement("div");
    el.className = "user-location";
    el.title = `${lang === "th" ? "ตำแหน่งของคุณ" : "Your location"} ±${Math.round(position.accuracy ?? 0)} ${lang === "th" ? "ม." : "m"}`;
    el.setAttribute("aria-label", el.title);
    user.current = new maplibregl.Marker({ element: el })
      .setLngLat([position.longitude, position.latitude])
      .addTo(m);
    // A map circle uses the same measured accuracy; it is not a route.
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
    return () => {
      if (m.getLayer("accuracy")) m.removeLayer("accuracy");
      if (m.getSource("accuracy")) m.removeSource("accuracy");
    };
  }, [position, ready, retry, lang]);
  useEffect(() => {
    if (!ready || !map.current) return;
    labelHandles.current.forEach((marker) => {
      const el = marker.getElement();
      el.textContent = mapLabel(el.dataset.labelText || "", lang);
    });
    const controls: [string, string][] = [
      [".maplibregl-ctrl-zoom-in", lang === "th" ? "ขยายแผนที่" : "Zoom in"],
      [".maplibregl-ctrl-zoom-out", lang === "th" ? "ย่อแผนที่" : "Zoom out"],
      [
        ".maplibregl-ctrl-compass",
        lang === "th" ? "หันทิศเหนือ" : "Reset north",
      ],
    ];
    controls.forEach(([selector, label]) => {
      const el = container.current?.querySelector(selector);
      el?.setAttribute("aria-label", label);
      el?.setAttribute("title", label);
    });
  }, [lang, ready]);
  useEffect(() => {
    if (!ready || !map.current) return;
    referenceMarker.current?.remove();
    referenceMarker.current = null;
    if (!referencePoint) return;
    const el = document.createElement("div");
    el.className = "reference-location";
    el.textContent = "M";
    el.title =
      lang === "th"
        ? "จุดเริ่มต้นที่เลือก ไม่ใช่ GPS ของคุณ"
        : "Selected starting point, not your GPS location";
    el.setAttribute("aria-label", el.title);
    referenceMarker.current = new maplibregl.Marker({ element: el })
      .setLngLat([referencePoint.longitude, referencePoint.latitude])
      .addTo(map.current);
    return () => {
      referenceMarker.current?.remove();
      referenceMarker.current = null;
    };
  }, [referencePoint, ready, lang]);
  useEffect(() => {
    const point = referencePoint || position;
    if (
      !focusLocation ||
      focusLocation === lastFocus.current ||
      !ready ||
      !point ||
      !map.current
    )
      return;
    lastFocus.current = focusLocation;
    if (
      point.longitude >= 100.518 &&
      point.longitude <= 100.538 &&
      point.latitude >= 13.727 &&
      point.latitude <= 13.75
    )
      map.current.easeTo({
        center: [point.longitude, point.latitude],
        zoom: 16.3,
        duration: 400,
      });
  }, [focusLocation, position, referencePoint, ready]);
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
          onClick={() =>
            map.current?.fitBounds(bounds, { padding: 35, duration: 350 })
          }
        >
          <Maximize size={18} />
        </button>
        <button
          title={t("กลับไปจุดเริ่มต้น", "Center on starting point")}
          aria-label={t("กลับไปจุดเริ่มต้น", "Center on starting point")}
          disabled={!position && !referencePoint}
          onClick={() => {
            const point = referencePoint || position;
            if (point)
              map.current?.easeTo({
                center: [point.longitude, point.latitude],
                zoom: 17,
              });
          }}
        >
          <Crosshair size={18} />
        </button>
      </div>
      <div
        className="map-legend status-legend"
        aria-label={t("ความหมายสีหมุด", "Marker status legend")}
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
        <small>
          {t(
            "อิงตารางเดิม ไม่ใช่สถานะสด · ขอบประ = พิกัดประมาณ",
            "Reference schedules, not live status · dashed = approximate location",
          )}
        </small>
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
