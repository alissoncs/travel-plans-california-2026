import type * as Leaflet from "leaflet";
import { lineStyle, type LineOptions, type MapHandle } from "./leaflet";
import { prefersReducedMotion } from "@/lib/env";
import { pageOfFocus, placeFocus, type Route } from "@/lib/routes";
import type { Trip } from "@/lib/trip";
import type { Coord } from "@/lib/types";

const markerPositions = (layer: Leaflet.LayerGroup) => (layer.getLayers() as Leaflet.Marker[]).map((marker) => marker.getLatLng());
const linePoints = (lines: Leaflet.Polyline[]) => lines.flatMap((line) => line.getLatLngs() as Leaflet.LatLng[]);

// Na página /mapa/<foco> o foco equivale à página que ele nomeia.
function effectiveRoute(route: Route, trip: Trip): Pick<Route, "page" | "arg"> {
  if (route.page !== "map") return route;
  const target = pageOfFocus(route.arg);
  if (target.page !== "day") return target;
  const requested = trip.itinerary.dias.find((day) => day.id === target.arg);
  const day = requested && (requested.planos.includes(trip.plan) ? requested : trip.days.find((d) => d.rotulo === requested.rotulo));
  return day ? { page: "day", arg: day.id } : { page: "home", arg: "" };
}

export function focusMap(handle: MapHandle, trip: Trip, route: Route) {
  const { L, map, layers, lines, markers } = handle;
  const animate = !prefersReducedMotion();
  const fit = (points: Leaflet.LatLngExpression[], maxZoom = 12) => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    const options = { padding: [48, 48] as [number, number], maxZoom };
    if (animate) map.flyToBounds(bounds, { ...options, duration: 0.6 });
    else map.fitBounds(bounds, options);
  };

  const target = effectiveRoute(route, trip);
  const activeDay = target.page === "day" ? target.arg : null;
  for (const [dayId, dayLines] of Object.entries(lines)) {
    dayLines.forEach((line) => line.setStyle(lineStyle((line.options as LineOptions).mode, activeDay ? (dayId === activeDay ? "active" : "muted") : "normal")));
  }

  if (activeDay) {
    const day = trip.itinerary.dias.find((d) => d.id === activeDay)!;
    (lines[day.id] ?? []).forEach((line) => line.bringToFront());
    const activityCoords = day.atividades.map((a) => (a.lugar ? trip.itinerary.lugares[a.lugar]?.coord : undefined));
    const tipCoords = (trip.guides.dias[day.id]?.secoes ?? []).flatMap((s) => s.itens.map((item) => item.coord));
    fit([day.coord, ...linePoints(lines[day.id] ?? []), ...[...activityCoords, ...tipCoords].filter((c): c is Coord => !!c)], 13);
  } else if (target.page === "place") {
    const coord = trip.itinerary.lugares[target.arg]?.coord;
    if (!coord) return;
    if (animate) map.flyTo(coord, 13, { duration: 0.8 });
    else map.setView(coord, 13);
    setTimeout(() => markers[placeFocus(target.arg)]?.openPopup(), animate ? 850 : 0);
  } else if (target.page === "eat") {
    fit(markerPositions(layers.food));
  } else if (target.page === "hotels") {
    fit(markerPositions(layers.hotels));
  } else {
    fit([...linePoints(Object.values(lines).flat()), ...markerPositions(layers.days)], 8);
  }
}
