import type { Itinerary } from "./types";

export type Page = "home" | "itinerary" | "places" | "hotels" | "bookings" | "costs" | "eat" | "videos" | "day" | "place" | "map";

export const TABS: { page: Page; label: string; icon: string; href: string }[] = [
  { page: "home", label: "Início", icon: "home", href: "/" },
  { page: "itinerary", label: "Roteiro", icon: "roteiro", href: "/roteiro" },
  { page: "places", label: "Lugares", icon: "lugares", href: "/lugares" },
  { page: "hotels", label: "Hotéis", icon: "hotel", href: "/hoteis" },
  { page: "bookings", label: "Reservas", icon: "check", href: "/reservas" },
  { page: "costs", label: "Gastos", icon: "dinheiro", href: "/gastos" },
];

// O foco do mapa é o id de um dia, "lugar-<chave>" ou "comer".
const PLACE_FOCUS = "lugar-";
const EAT_FOCUS = "comer";

export const hrefs = {
  day: (id: string) => `/dia/${id}`,
  place: (key: string) => `/lugar/${key}`,
  map: (focus = "") => (focus ? `/mapa/${focus}` : "/mapa"),
};
export const placeFocus = (key: string) => PLACE_FOCUS + key;

export function pageOfFocus(focus: string): { page: Page; arg: string } {
  if (focus.startsWith(PLACE_FOCUS)) return { page: "place", arg: focus.slice(PLACE_FOCUS.length) };
  if (focus === EAT_FOCUS) return { page: "eat", arg: "" };
  return focus ? { page: "day", arg: focus } : { page: "home", arg: "" };
}

export function focusPath(focus: string) {
  const { page, arg } = pageOfFocus(focus);
  return page === "place" ? hrefs.place(arg) : page === "eat" ? "/comer" : page === "day" ? hrefs.day(arg) : "/";
}

export interface Route {
  page: Page;
  arg: string;
  tab: Page | null;
  title: string;
  back?: string;
}

const SEGMENT_PAGE: Record<string, Page> = { roteiro: "itinerary", lugares: "places", hoteis: "hotels", reservas: "bookings", gastos: "costs", comer: "eat", videos: "videos" };

export function routeOf(pathname: string, itinerary: Itinerary): Route {
  const [, segment = "", arg = ""] = pathname.split("/").map(decodeURIComponent);
  if (segment === "mapa") return { page: "map", arg, tab: null, title: "Mapa", back: focusPath(arg) };
  if (segment === "lugar" && itinerary.lugares[arg]) return { page: "place", arg, tab: "places", title: itinerary.lugares[arg].nome, back: "/lugares" };
  const day = segment === "dia" && itinerary.dias.find((d) => d.id === arg);
  if (day) return { page: "day", arg, tab: "itinerary", title: `Dia ${day.rotulo}`, back: "/roteiro" };
  const page = SEGMENT_PAGE[segment];
  if (page === "eat") return { page, arg: "", tab: "home", title: "Cafés e restaurantes", back: "/" };
  if (page === "videos") return { page, arg: "", tab: "home", title: "Dicas dos vídeos", back: "/" };
  if (page) return { page, arg: "", tab: page, title: TABS.find((t) => t.page === page)!.label };
  return { page: "home", arg: "", tab: "home", title: "Início" };
}

export function focusOf(route: Route) {
  if (route.page === "day") return route.arg;
  if (route.page === "place") return placeFocus(route.arg);
  if (route.page === "eat") return EAT_FOCUS;
  return "";
}
