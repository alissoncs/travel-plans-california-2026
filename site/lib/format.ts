const dt = (iso: string) => new Date(iso + "T12:00:00Z");
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  dt(iso).toLocaleDateString("pt-BR", { timeZone: "UTC", ...o }).replace(/\./g, "");

export const semana = (iso: string) => fmt(iso, { weekday: "short" });
export const diaMes = (iso: string) => fmt(iso, { day: "numeric", month: "short" }).replace(" de ", " ");
export const diaMesNum = (iso: string) => fmt(iso, { day: "2-digit", month: "2-digit" });
export const quando = (d: { data: string; data_fim?: string }) =>
  d.data_fim ? `${diaMes(d.data)} – ${diaMes(d.data_fim)}` : `${semana(d.data)}, ${diaMes(d.data)}`;
export const usd = (v: number) => "US$ " + Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export const brl = (v: number) => "R$ " + Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
export const noites = (a: string, b: string) => Math.round((dt(b).getTime() - dt(a).getTime()) / 864e5);
export const fmtH = (h: number) => `${(Math.round(h * 2) / 2).toLocaleString("pt-BR")}h`;
export const minutos = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m} min`);
export const dataBr = (iso: string) => iso.split("-").reverse().join("/");
export const meioDia = dt;

export const gmaps = (nome: string, ctx?: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([nome, ctx].filter(Boolean).join(", "))}`;
export const gimagens = (q: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;

// "Alternativa: Anza-Borrego" → "Anza-Borrego"
export const semPrefixo = (n: string) =>
  n.replace(/^(Alternativa|Plano reserva|Opção|Ceia|Na volta|Se sobrar tempo|Outro ângulo)\s*:\s*/i, "");

// As imagens do JSON vêm como "img/x.jpg"; no Next ficam em /img/x.jpg.
export const src = (p?: string) => (p ? (p.startsWith("/") || p.startsWith("http") ? p : "/" + p) : undefined);
