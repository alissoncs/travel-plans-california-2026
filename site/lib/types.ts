// Os campos em português espelham os JSON em data/, que os scripts Python também usam.
export type Coord = [number, number];
export type PlanId = string;

export interface Activity {
  tipo: string;
  titulo: string;
  descricao: string;
  stats?: string;
  lugar?: string;
  onde?: string;
  horas?: number;
  opcional?: boolean;
}

export interface Day {
  id: string;
  rotulo: string;
  data: string;
  data_fim?: string;
  fase: string;
  planos: PlanId[];
  titulo: string;
  regiao: string;
  coord: Coord;
  capa: string;
  resumo: string;
  atividades: Activity[];
  estrada?: { trecho: string; tempo: string; horas?: number }[];
  alertas?: { nivel: "urgente" | "aviso" | "info"; texto: string }[];
  sol?: { nascer: string; por: string };
  evento?: boolean;
}

export interface Place {
  nome: string;
  resumo_wiki?: string;
  wiki_url?: string | null;
  credito?: { autor: string; licenca?: string };
  imagem?: string;
  coord?: Coord;
}

export interface Lodging {
  id: string;
  nome: string;
  cidade: string;
  checkin: string;
  checkout: string;
  status: string;
  planos: PlanId[];
  coord?: Coord;
  precos?: { site: string; diaria: number }[];
  precos_em?: string;
}

export interface HotelSearch {
  id: string;
  titulo: string;
  planos: PlanId[];
  cidade: string;
  checkin: string;
  checkout: string;
  precos_em?: string;
  busca_externa?: { nome: string; url: string }[];
  encontrados?: { nome: string; url: string; tipo: string; nota?: number; avaliacoes?: number; coord?: Coord; localizacao: string; diaria_usd?: number; pros: string[]; contras: string[] }[];
  opcoes?: { nome: string; nota: number; avaliacoes: number; url: string; coord?: Coord; diaria_min: number; site_min: string }[];
}

export interface Booking {
  id: string;
  prioridade: "urgente" | "importante" | "antes" | "feito";
  item: string;
  detalhe: string;
  url?: string;
  planos?: PlanId[];
}

export interface Expense {
  data?: string;
  planos: PlanId[];
  categoria: string;
  item: string;
  usd: number;
  status: "estimado" | "confirmado" | "verificar" | "opcional";
  atividade?: string;
}

export interface Itinerary {
  viagem: { titulo: string; subtitulo: string; inicio: string; fim: string; capa: string; plano_recomendado: PlanId; teto_usd?: number };
  atualizado_em?: string;
  planos: Record<PlanId, { nome: string; resumo: string }>;
  fases: { id: string; nome: string; detalhe: string; inicio: string; fim: string }[];
  dias: Day[];
  lugares: Record<string, Place>;
  hospedagens: Lodging[];
  busca_hoteis?: HotelSearch[];
  reservas: Booking[];
  orcamento?: { taxa_brl: number; itens: Expense[] };
  fontes: { nome: string; url: string }[];
  creditos_api: { nome: string; uso: string }[];
}

export interface GuideItem {
  nome: string;
  texto: string;
  onde?: string;
  maps?: string;
  coord?: Coord;
  stats?: string;
  url?: string;
  verificar?: string | boolean;
  fontes?: string[];
  tempos?: Record<string, number>;
}

export interface GuideSection {
  tipo: string;
  titulo?: string;
  itens: GuideItem[];
}

export interface Guide {
  intro?: string[];
  secoes?: GuideSection[];
}

export interface GuideSource {
  tipo: string;
  titulo: string;
  canal?: string;
  url?: string | null;
}

export interface Guides {
  fontes: Record<string, GuideSource>;
  dias: Record<string, Guide>;
  lugares: Record<string, Guide>;
}

export interface RouteSegment {
  modo: "carro" | "bike" | "balsa";
  linha: Coord[];
  km?: number;
  min?: number;
}
export type DayRoutes = Record<string, RouteSegment[]>;
