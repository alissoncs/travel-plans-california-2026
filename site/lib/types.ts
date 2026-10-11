export type Coord = [number, number];
export type PlanoId = string;

export interface Atividade {
  tipo: string;
  titulo: string;
  descricao: string;
  stats?: string;
  lugar?: string;
  onde?: string;
  horas?: number;
  opcional?: boolean;
}

export interface Dia {
  id: string;
  rotulo: string;
  data: string;
  data_fim?: string;
  fase: string;
  planos: PlanoId[];
  titulo: string;
  regiao: string;
  coord: Coord;
  capa: string;
  resumo: string;
  atividades: Atividade[];
  estrada?: { trecho: string; tempo: string; horas?: number }[];
  alertas?: { nivel: "urgente" | "aviso" | "info"; texto: string }[];
  sol?: { nascer: string; por: string };
  evento?: boolean;
}

export interface Lugar {
  nome: string;
  wiki?: string;
  resumo_wiki?: string;
  wiki_url?: string | null;
  credito?: { autor: string; licenca?: string; url?: string };
  imagem?: string;
  coord?: Coord;
}

export interface Hospedagem {
  id: string;
  nome: string;
  cidade: string;
  checkin: string;
  checkout: string;
  status: string;
  planos: PlanoId[];
  coord?: Coord;
  precos?: { site: string; diaria: number }[];
  precos_em?: string;
}

export interface OpcaoHotel {
  nome: string;
  nota: number;
  avaliacoes: number;
  url: string;
  coord?: Coord;
  diaria_min: number;
  site_min: string;
}

export interface BuscaHoteis {
  id: string;
  titulo: string;
  planos: PlanoId[];
  cidade: string;
  checkin: string;
  precos_em?: string;
  busca_externa?: { nome: string; url: string }[];
  opcoes?: OpcaoHotel[];
}

export interface Reserva {
  id: string;
  prioridade: "urgente" | "importante" | "antes" | "feito";
  item: string;
  detalhe: string;
  url?: string;
  planos?: PlanoId[];
}

export interface Gasto {
  data?: string;
  planos: PlanoId[];
  categoria: string;
  item: string;
  usd: number;
  status: "estimado" | "confirmado" | "verificar" | "opcional";
  atividade?: string;
}

export interface Roteiro {
  viagem: {
    titulo: string;
    subtitulo: string;
    inicio: string;
    fim: string;
    capa: string;
    plano_recomendado: PlanoId;
    teto_usd?: number;
  };
  atualizado_em?: string;
  planos: Record<PlanoId, { nome: string; resumo: string }>;
  fases: { id: string; nome: string; detalhe: string; inicio: string; fim: string }[];
  dias: Dia[];
  lugares: Record<string, Lugar>;
  hospedagens: Hospedagem[];
  busca_hoteis?: BuscaHoteis[];
  reservas: Reserva[];
  orcamento?: { taxa_brl: number; planos: Record<PlanoId, unknown>; itens: Gasto[] };
  fontes: { nome: string; url: string }[];
  creditos_api: { nome: string; uso: string }[];
}

export interface ItemGuia {
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

export interface SecaoGuia {
  tipo: string;
  titulo?: string;
  itens: ItemGuia[];
}

export interface Guia {
  intro?: string[];
  secoes?: SecaoGuia[];
}

export interface Fonte {
  tipo: string;
  titulo: string;
  canal?: string;
  url?: string | null;
}

export interface Guias {
  fontes: Record<string, Fonte>;
  dias: Record<string, Guia>;
  lugares: Record<string, Guia>;
}

export interface Trecho {
  modo: "carro" | "bike" | "balsa";
  linha: Coord[];
  km?: number;
  min?: number;
}
export type Rotas = Record<string, Trecho[]>;
