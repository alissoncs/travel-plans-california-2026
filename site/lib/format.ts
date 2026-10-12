export const parseDate = (iso: string) => new Date(iso + "T12:00:00Z");
const formatDate = (iso: string, options: Intl.DateTimeFormatOptions) =>
  parseDate(iso).toLocaleDateString("pt-BR", { timeZone: "UTC", ...options }).replace(/\./g, "");

export const weekday = (iso: string) => formatDate(iso, { weekday: "short" });
export const dayMonth = (iso: string) => formatDate(iso, { day: "numeric", month: "short" }).replace(" de ", " ");
export const dayMonthNumeric = (iso: string) => formatDate(iso, { day: "2-digit", month: "2-digit" });
export const brDate = (iso: string) => iso.split("-").reverse().join("/");
export const whenOf = (day: { data: string; data_fim?: string }) =>
  day.data_fim ? `${dayMonth(day.data)} – ${dayMonth(day.data_fim)}` : `${weekday(day.data)}, ${dayMonth(day.data)}`;
export const nightsBetween = (from: string, to: string) => Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 864e5);

export const usd = (value: number) => "US$ " + value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export const brl = (value: number) => "R$ " + value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
export const formatHours = (hours: number) => `${(Math.round(hours * 2) / 2).toLocaleString("pt-BR")}h`;
export const formatMinutes = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}` : `${minutes} min`);

export const gmaps = (name: string, context?: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, context].filter(Boolean).join(", "))}`;
export const bookingSearch = (query: string, checkin: string, checkout: string) =>
  `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}&checkin=${checkin}&checkout=${checkout}&group_adults=2&no_rooms=1`;
export const airbnbSearch = (place: string, checkin: string, checkout: string) =>
  `https://www.airbnb.com/s/${encodeURIComponent(place)}/homes?checkin=${checkin}&checkout=${checkout}&adults=2`;
export const gmapsInCalifornia = (name: string) => gmaps(name, "California");
export const googleImages = (query: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

// "Alternativa: Anza-Borrego" → "Anza-Borrego"
export const withoutPrefix = (name: string) =>
  name.replace(/^(Alternativa|Plano reserva|Opção|Ceia|Na volta|Se sobrar tempo|Outro ângulo)\s*:\s*/i, "");

// `maps` no item substitui a busca quando o nome é descritivo demais para o Google Maps.
export const searchQuery = (item: { nome?: string; titulo?: string; onde?: string; maps?: string }) =>
  item.maps || [withoutPrefix(item.nome || item.titulo || ""), item.onde].filter(Boolean).join(", ");

export const cityOf = (lodging: { cidade: string }) => lodging.cidade.split(" · ")[0];

// O JSON guarda "img/x.jpg"; o Next serve de /img/x.jpg.
export const imageSrc = (path?: string) => (path ? (path.startsWith("/") || path.startsWith("http") ? path : "/" + path) : undefined);
