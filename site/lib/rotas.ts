import type { Roteiro } from "./types";

export const ABAS: [string, string, string][] = [
  ["inicio", "Início", "home"],
  ["roteiro", "Roteiro", "roteiro"],
  ["lugares", "Lugares", "lugares"],
  ["hoteis", "Hotéis", "hotel"],
  ["reservas", "Reservas", "check"],
  ["gastos", "Gastos", "dinheiro"],
];
export const hrefAba = (k: string) => (k === "inicio" ? "/" : `/${k}`);

export interface Rota {
  pagina: "inicio" | "roteiro" | "lugares" | "hoteis" | "reservas" | "gastos" | "comer" | "videos" | "dia" | "lugar" | "mapa";
  arg: string;
  aba: string | null;
  titulo: string;
  voltar?: string;
}

// O foco do mapa é o id de um dia, "lugar-<chave>" ou "comer".
export function caminhoDoFoco(foco: string): string {
  if (foco.startsWith("lugar-")) return `/lugar/${foco.slice(6)}`;
  if (foco === "comer") return "/comer";
  return foco ? `/dia/${foco}` : "/";
}

export function rotaDe(pathname: string, D: Roteiro): Rota {
  const [, p = "", arg = ""] = pathname.split("/").map(decodeURIComponent);
  if (p === "mapa") return { pagina: "mapa", arg, aba: null, titulo: "Mapa", voltar: caminhoDoFoco(arg) };
  if (p === "lugar" && D.lugares[arg]) return { pagina: "lugar", arg, aba: "lugares", titulo: D.lugares[arg].nome, voltar: "/lugares" };
  if (p === "dia") {
    const dia = D.dias.find((d) => d.id === arg);
    if (dia) return { pagina: "dia", arg, aba: "roteiro", titulo: `Dia ${dia.rotulo}`, voltar: "/roteiro" };
  }
  if (p === "comer") return { pagina: "comer", arg: "", aba: "inicio", titulo: "Cafés e restaurantes", voltar: "/" };
  if (p === "videos") return { pagina: "videos", arg: "", aba: "inicio", titulo: "Dicas dos vídeos", voltar: "/" };
  const aba = ABAS.find(([k]) => k === p);
  if (aba && p !== "inicio") return { pagina: p as Rota["pagina"], arg: "", aba: p, titulo: aba[1] };
  return { pagina: "inicio", arg: "", aba: "inicio", titulo: "Início" };
}

export function focoDaRota(r: Rota): string {
  if (r.pagina === "dia") return r.arg;
  if (r.pagina === "lugar") return `lugar-${r.arg}`;
  if (r.pagina === "comer") return "comer";
  return "";
}
