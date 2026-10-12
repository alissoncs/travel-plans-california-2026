import type * as Leaflet from "leaflet";
import { escapeHtml, iconSvg, pinIcon, popupHtml, type LayerId, type LineOptions, type MapHandle, type PopupContent } from "./leaflet";
import { isWide } from "@/lib/env";
import { cityOf, formatMinutes, gmaps, gmapsInCalifornia, searchQuery, usd, whenOf } from "@/lib/format";
import { GUIDE_SECTIONS } from "@/lib/labels";
import { hrefs, placeFocus } from "@/lib/routes";
import type { Trip } from "@/lib/trip";
import type { Coord, DayRoutes } from "@/lib/types";

const MODE_LABEL = { balsa: "balsa", bike: "bicicleta", carro: null } as const;

// Redesenha rota, pinos e hotéis do plano escolhido.
export function drawLayers(handle: MapHandle, trip: Trip, routes: DayRoutes, navigate: (path: string) => void) {
  const { L, layers } = handle;
  const { itinerary, guides, plan } = trip;
  Object.values(layers).forEach((layer) => layer.clearLayers());
  handle.lines = {};
  handle.markers = {};

  const seen = new Set<string>();
  const addPin = (layer: LayerId, coord: Coord, icon: Leaflet.DivIcon, popup: PopupContent, markerKey?: string) => {
    const id = `${coord[0].toFixed(4)},${coord[1].toFixed(4)}|${popup.title}`;
    if (seen.has(id)) return;
    seen.add(id);
    const marker = L.marker(coord, { icon, title: popup.title, riseOnHover: true }).bindPopup(popupHtml(popup));
    layers[layer].addLayer(marker);
    if (markerKey) handle.markers[markerKey] = marker;
  };

  for (const day of trip.days) {
    const dayTitle = `Dia ${day.rotulo} · ${day.titulo}`;
    for (const segment of routes[day.id] ?? []) {
      const line = L.polyline(segment.linha, { mode: segment.modo } as LineOptions);
      const info = [MODE_LABEL[segment.modo], segment.km && `${segment.km} km`, segment.min && formatMinutes(segment.min)].filter(Boolean).join(" · ");
      line.bindTooltip(info ? `${dayTitle} · ${info}` : dayTitle, { sticky: true });
      line.on("click", () => navigate(isWide() ? hrefs.day(day.id) : hrefs.map(day.id)));
      layers.route.addLayer(line);
      (handle.lines[day.id] ??= []).push(line);
    }
    addPin("days", day.coord, pinIcon(L, "pin-day", escapeHtml(day.rotulo)), { title: dayTitle, subtitle: whenOf(day), image: trip.imageOf(day.capa), href: hrefs.day(day.id), gmapsUrl: gmapsInCalifornia(day.regiao) });

    for (const section of guides.dias[day.id]?.secoes ?? []) {
      const isFood = section.tipo === "cafe" || section.tipo === "comer";
      for (const item of section.itens) {
        if (!item.coord) continue;
        const icon = pinIcon(L, isFood ? "pin-food" : "pin-tip", iconSvg(isFood ? (section.tipo === "cafe" ? "cafe" : "comida") : "fazer"));
        addPin(isFood ? "food" : "tips", item.coord, icon, { title: item.nome, subtitle: `Dia ${day.rotulo} · ${GUIDE_SECTIONS[section.tipo]?.title ?? ""}`, href: hrefs.day(day.id), gmapsUrl: gmaps(searchQuery(item)) });
      }
    }
  }

  for (const place of trip.places) {
    if (!place.coord) continue;
    addPin("places", place.coord, pinIcon(L, "pin-place", iconSvg([...place.types][0] ?? "pin")),
      { title: place.nome, subtitle: place.days.map((d) => `Dia ${d.rotulo}`).join(", "), image: place.imagem, href: hrefs.place(place.key), gmapsUrl: gmapsInCalifornia(place.nome) }, placeFocus(place.key));
    for (const section of guides.lugares[place.key]?.secoes ?? []) {
      for (const item of section.itens) {
        if (!item.coord) continue;
        const gmapsUrl = item.onde || item.maps ? gmaps(searchQuery(item)) : gmaps(item.nome, place.nome);
        addPin("tips", item.coord, pinIcon(L, "pin-tip", iconSvg("fazer")), { title: item.nome, subtitle: place.nome, href: hrefs.place(place.key), gmapsUrl });
      }
    }
  }

  for (const lodging of itinerary.hospedagens) {
    if (!lodging.planos.includes(plan) || !lodging.coord) continue;
    addPin("hotels", lodging.coord, pinIcon(L, "pin-hotel", iconSvg("hotel")), { title: lodging.nome, subtitle: `${lodging.cidade} · ${lodging.status}`, href: "/hoteis", gmapsUrl: gmaps(lodging.nome, cityOf(lodging)) });
  }
  for (const search of itinerary.busca_hoteis ?? []) {
    if (!search.planos.includes(plan)) continue;
    for (const found of search.encontrados ?? []) {
      if (!found.coord) continue;
      addPin("hotels", found.coord, pinIcon(L, "pin-hotel pin-option", iconSvg("hotel")), { title: found.nome, subtitle: `Sugestão encontrada · ${found.localizacao}`, href: "/hoteis", gmapsUrl: gmaps(found.nome, search.cidade) });
    }
    for (const option of search.opcoes ?? []) {
      if (!option.coord) continue;
      addPin("hotels", option.coord, pinIcon(L, "pin-hotel pin-option", iconSvg("hotel")), { title: option.nome, subtitle: `Opção · ${usd(option.diaria_min)} a diária`, href: "/hoteis", gmapsUrl: gmaps(option.nome, search.cidade) });
    }
  }
}
