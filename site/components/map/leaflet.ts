import type * as Leaflet from "leaflet";
import { imageSrc } from "@/lib/format";
import type { RouteSegment } from "@/lib/types";

export type LeafletLib = typeof Leaflet;
export type LineState = "normal" | "active" | "muted";

export const LAYERS = [
  { id: "route", label: "Rota", color: "--accent" },
  { id: "days", label: "Dias", color: "--ink" },
  { id: "places", label: "Lugares", color: "--accent" },
  { id: "tips", label: "Dicas", color: "--muted" },
  { id: "food", label: "Café e comida", color: "--food" },
  { id: "hotels", label: "Hotéis", color: "--hotel" },
] as const;
export type LayerId = (typeof LAYERS)[number]["id"];
export const DEFAULT_LAYERS: Record<string, boolean> = { route: true, days: true, places: true, tips: false, food: true, hotels: true };

export interface MapHandle {
  L: LeafletLib;
  map: Leaflet.Map;
  layers: Record<LayerId, Leaflet.LayerGroup>;
  lines: Record<string, Leaflet.Polyline[]>;
  markers: Record<string, Leaflet.Marker>;
}

export type LineOptions = Leaflet.PolylineOptions & { mode: RouteSegment["modo"] };

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function lineStyle(mode: RouteSegment["modo"], state: LineState): Leaflet.PathOptions {
  const base: Leaflet.PathOptions =
    mode === "balsa" ? { color: cssVar("--info"), weight: 3, dashArray: "6 8" }
    : mode === "bike" ? { color: cssVar("--warm"), weight: 3, dashArray: "2 7" }
    : { color: cssVar("--accent"), weight: 4 };
  if (state === "active") return { ...base, color: mode === "carro" ? cssVar("--warm") : base.color, weight: (base.weight ?? 3) + 2, opacity: 1 };
  if (state === "muted") return { ...base, opacity: 0.3 };
  return { ...base, opacity: 0.85 };
}

export const outlineStyle = (): Leaflet.PathOptions => ({ color: cssVar("--line"), weight: 1, fillColor: cssVar("--land"), fillOpacity: 1 });

export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const pinIcon = (L: LeafletLib, className: string, html = "") =>
  L.divIcon({ className: "pin-host", html: `<div class="pin ${className}">${html}</div>`, iconSize: [0, 0], popupAnchor: [0, -12] });

export const iconSvg = (name: string) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

export interface PopupContent {
  title: string;
  subtitle?: string;
  image?: string;
  href?: string;
  gmapsUrl: string;
}

// Links com `data-nav` são tratados pelo router (ver createMap).
export function popupHtml({ title, subtitle, image, href, gmapsUrl }: PopupContent) {
  return `<div class="pop">${image ? `<img src="${escapeHtml(imageSrc(image))}" alt="">` : ""}<b>${escapeHtml(title)}</b>${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ""}
    <div class="pop-links">${href ? `<a href="${escapeHtml(href)}" data-nav>Abrir página</a>` : ""}<a href="${escapeHtml(gmapsUrl)}" target="_blank" rel="noopener">Google Maps</a></div></div>`;
}
