import type * as Leaflet from "leaflet";
import { LAYERS, outlineStyle, type LeafletLib, type MapHandle } from "./leaflet";

const TILE_ERRORS_BEFORE_FALLBACK = 3;
const TILE_TIMEOUT_MS = 5000;
const esri = (layer: string) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${layer}/MapServer/tile/{z}/{y}/{x}`;

const loadOutline = async () => (await import("@/data/mapa-base.json")).default as unknown as GeoJSON.GeoJsonObject;

// Se os tiles do Esri não carregarem, troca por um contorno vetorial local.
function useOutlineWhenTilesFail(L: LeafletLib, map: Leaflet.Map, tiles: Leaflet.TileLayer[]) {
  let loaded = false;
  let errors = 0;
  let fellBack = false;
  const fallBack = async () => {
    if (loaded || fellBack) return;
    fellBack = true;
    tiles.forEach((layer) => map.removeLayer(layer));
    try {
      L.geoJSON(await loadOutline(), { interactive: false, style: outlineStyle() }).addTo(map).bringToBack();
      map.attributionControl.addAttribution("Contornos: Natural Earth");
    } catch {}
  };
  tiles[0].on("tileload", () => { loaded = true; });
  tiles[0].on("tileerror", () => { if (++errors >= TILE_ERRORS_BEFORE_FALLBACK) fallBack(); });
  return setTimeout(fallBack, TILE_TIMEOUT_MS);
}

export async function createMap(element: HTMLElement, navigate: (path: string) => void, signal: AbortSignal) {
  const L = (await import("leaflet")).default as unknown as LeafletLib;
  if (signal.aborted) return null; // o Leaflet não aceita dois mapas no mesmo elemento
  const map = L.map(element, { zoomControl: false, zoomSnap: 0.5 });
  L.control.zoom({ position: "bottomright" }).addTo(map);
  map.attributionControl.setPrefix(false);
  map.setView([36.4, -119.4], 6);

  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  const base = L.tileLayer(esri(dark ? "World_Dark_Gray_Base" : "World_Light_Gray_Base"), {
    maxZoom: 16,
    attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const labels = L.tileLayer(esri(dark ? "World_Dark_Gray_Reference" : "World_Light_Gray_Reference"), { maxZoom: 16, pane: "shadowPane" }).addTo(map);
  const fallbackTimer = useOutlineWhenTilesFail(L, map, [base, labels]);

  // Captura antes de o Leaflet barrar o clique dentro dos popups.
  const onClick = (event: MouseEvent) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-nav]");
    if (!link) return;
    event.preventDefault();
    navigate(link.getAttribute("href")!);
  };
  element.addEventListener("click", onClick, true);

  const layers = Object.fromEntries(LAYERS.map(({ id }) => [id, L.layerGroup()])) as MapHandle["layers"];
  const handle: MapHandle = { L, map, layers, lines: {}, markers: {} };
  const destroy = () => {
    clearTimeout(fallbackTimer);
    element.removeEventListener("click", onClick, true);
    map.remove();
  };
  return { handle, destroy };
}
