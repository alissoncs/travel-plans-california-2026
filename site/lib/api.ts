import { meioDia } from "./format";
import type { Atividade, Dia, Gasto, Guias, ItemGuia, Lugar, PlanoId, Roteiro, SecaoGuia } from "./types";

export const JANELA_H = 12;

export interface LugarDoPlano extends Lugar {
  chave: string;
  dias: Dia[];
  atividades: Atividade[];
  tipos: Set<string>;
}

// Tudo o que depende do roteiro, dos guias e do plano escolhido.
export function criarApi(D: Roteiro, G: Guias, plano: PlanoId) {
  const diasDoPlano = () => D.dias.filter((d) => d.planos.includes(plano));
  const img = (chave: string) => D.lugares[chave]?.imagem;

  const gastosDoPlano = (): Gasto[] => (D.orcamento?.itens || []).filter((g) => g.planos.includes(plano));
  const gastosDoDia = (d: Dia) => gastosDoPlano().filter((g) => g.data && g.data >= d.data && g.data <= (d.data_fim || d.data));
  const soma = (lista: Gasto[]) => lista.filter((g) => g.status !== "opcional").reduce((n, g) => n + g.usd, 0);

  // horas das atividades (sem as opcionais) + estrada, sobre 12h (8h às 20h)
  function ocupacao(d: Dia) {
    if (d.evento) return null;
    const h = d.atividades.filter((a) => !a.opcional).reduce((n, a) => n + (a.horas || 0), 0) + (d.estrada || []).reduce((n, e) => n + (e.horas || 0), 0);
    if (!h) return null;
    const pct = Math.min(100, Math.round((h / JANELA_H) * 100));
    return { h, pct, livres: Math.max(0, JANELA_H - h), nivel: pct <= 50 ? "leve" : pct <= 70 ? "medio" : "cheio" };
  }

  function lugaresDoPlano(): LugarDoPlano[] {
    const mapa = new Map<string, LugarDoPlano>();
    for (const d of diasDoPlano()) {
      for (const a of d.atividades) {
        if (!a.lugar || !D.lugares[a.lugar]) continue;
        const e = mapa.get(a.lugar) || { chave: a.lugar, ...D.lugares[a.lugar], dias: [], atividades: [], tipos: new Set<string>() };
        if (!e.dias.includes(d)) e.dias.push(d);
        e.atividades.push(a);
        e.tipos.add(a.tipo);
        mapa.set(a.lugar, e);
      }
    }
    return [...mapa.values()];
  }

  type Onde = { tipo: "dia"; d: Dia } | { tipo: "lugar"; k: string };
  function todasDicas() {
    const out: { it: ItemGuia; s: SecaoGuia; onde: Onde }[] = [];
    for (const d of diasDoPlano()) for (const s of G.dias[d.id]?.secoes || []) for (const it of s.itens) out.push({ it, s, onde: { tipo: "dia", d } });
    for (const [k, gl] of Object.entries(G.lugares)) for (const s of gl.secoes || []) for (const it of s.itens) out.push({ it, s, onde: { tipo: "lugar", k } });
    return out;
  }

  return { D, G, plano, diasDoPlano, img, gastosDoPlano, gastosDoDia, soma, ocupacao, lugaresDoPlano, todasDicas };
}
export type Api = ReturnType<typeof criarApi>;

export function contagem(D: Roteiro): [number | string, string] {
  const hoje = new Date();
  hoje.setUTCHours(12, 0, 0, 0);
  const ini = meioDia(D.viagem.inicio), fim = meioDia(D.viagem.fim);
  const n = Math.round((ini.getTime() - hoje.getTime()) / 864e5);
  if (n > 1) return [n, "dias para a viagem"];
  if (n === 1) return [1, "dia para a viagem"];
  if (hoje <= fim) return [Math.round((hoje.getTime() - ini.getTime()) / 864e5) + 1, "º dia de viagem"];
  return ["✓", "viagem concluída"];
}
