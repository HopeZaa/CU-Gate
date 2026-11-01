import { Marker } from "maplibre-gl";
import type { Map as CampusMap } from "maplibre-gl";
import type { Gate, TravelMode } from "./data";
import { gateAvailability } from "./availability";
import { gateName } from "./i18n";
import type { Language } from "./i18n";

export type GatePin = {
  marker: Marker;
  button: HTMLButtonElement;
  code: HTMLElement;
  status: HTMLElement;
  recommendation: HTMLElement;
};
// MapLibre owns the outer element's classes and transform for its entire lifetime.
// All application styling, selection and animation belongs to the inner button.
export function createGatePin(
  map: CampusMap,
  gate: Gate & { latitude: number; longitude: number },
  onSelect: (id: string) => void,
): GatePin {
  const anchor = document.createElement("div");
  anchor.className = "gate-map-anchor";
  anchor.dataset.gateAnchor = gate.id;
  const button = document.createElement("button");
  button.type = "button";
  const code = document.createElement("span");
  code.className = "marker-code";
  const status = document.createElement("span");
  status.className = "marker-state";
  status.setAttribute("aria-hidden", "true");
  const recommendation = document.createElement("span");
  recommendation.className = "marker-recommendation";
  recommendation.textContent = "★";
  recommendation.setAttribute("aria-hidden", "true");
  button.append(code, status, recommendation);
  button.addEventListener("click", () => onSelect(gate.id));
  anchor.append(button);
  const marker = new Marker({
    element: anchor,
    anchor: "center",
    subpixelPositioning: true,
  })
    .setLngLat([gate.longitude, gate.latitude])
    .addTo(map);
  anchor.removeAttribute("role");
  anchor.removeAttribute("tabindex");
  anchor.removeAttribute("aria-label");
  return { marker, button, code, status, recommendation };
}
export function updateGatePin(
  pin: GatePin,
  gate: Gate,
  mode: TravelMode | "all",
  direction: "entry" | "exit",
  now: Date,
  lang: Language,
  selected: boolean,
  suggested: boolean,
) {
  const availability = gateAvailability(gate, mode, direction, now, lang);
  pin.button.className = `gate-marker availability-${availability.state} ${gate.category} ${gate.coordinateConfidence === "HIGH" ? "" : "approximate"} ${selected ? "selected" : ""} ${suggested ? "is-suggested" : ""}`;
  pin.code.textContent = gate.mapCode || gate.mapLetter || "•";
  pin.status.textContent = {
    open: "✓",
    closed: "×",
    restricted: "!",
    unknown: "?",
  }[availability.state];
  pin.recommendation.hidden = !suggested;
  pin.button.title = `${gateName(gate, lang)} · ${availability.label}${suggested ? (lang === "th" ? " · แนะนำใกล้สุด" : " · Nearest suggestion") : ""}`;
  pin.button.setAttribute(
    "aria-label",
    `${lang === "th" ? "หมุดประตู" : "Map gate:"} ${pin.button.title}`,
  );
  pin.button.setAttribute("aria-pressed", String(selected));
  pin.button.dataset.gateId = gate.id;
  pin.button.dataset.status = availability.state;
  pin.button.dataset.suggested = String(suggested);
  pin.marker.getElement().style.zIndex = selected ? "5" : suggested ? "4" : "2";
}
export function createPointPin(map: CampusMap, kind: "device" | "reference") {
  const anchor = document.createElement("div");
  anchor.className = `${kind}-map-anchor`;
  const content = document.createElement("div");
  content.className =
    kind === "device" ? "user-location" : "reference-location";
  anchor.append(content);
  const marker = new Marker({
    element: anchor,
    anchor: "center",
    subpixelPositioning: true,
  });
  marker.setLngLat([0, 0]).addTo(map);
  anchor.removeAttribute("role");
  anchor.removeAttribute("tabindex");
  anchor.removeAttribute("aria-label");
  content.setAttribute("role", "img");
  return { marker, content };
}
