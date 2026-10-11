// As chaves são os valores usados nos JSON.
export const ACTIVITY_TYPES: Record<string, string> = { trilha: "Trilhas", praia: "Praias", vista: "Mirantes", fauna: "Vida selvagem", agua: "Na água", cidade: "Cidade", bike: "Bike", transporte: "Deslocamento", comida: "Comida", hotel: "Hotel" };
export const EXPENSE_CATEGORIES: Record<string, string> = { alimentacao: "Alimentação", gasolina: "Gasolina", estacionamento: "Estacionamento", passeio: "Passeios", ingresso: "Ingressos", transporte: "Transporte", hospedagem: "Hotéis", carro: "Aluguel do carro" };
export const EXPENSE_STATUS: Record<string, string> = { estimado: "estimativa", confirmado: "confirmado", verificar: "a confirmar", opcional: "opcional, fora do total" };
export const GUIDE_SECTIONS: Record<string, { title: string; icon: string }> = {
  fazer: { title: "Mais para fazer", icon: "fazer" },
  cafe: { title: "Café", icon: "cafe" },
  comer: { title: "Onde comer", icon: "comida" },
  levar: { title: "O que levar", icon: "levar" },
  foto: { title: "Fotos", icon: "foto" },
  dica: { title: "Dicas práticas", icon: "dica" },
};
