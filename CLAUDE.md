# Projeto: Viagem Califórnia 2026

Projeto de planejamento de viagem (não é código). Responder e escrever sempre em **português do Brasil**.

## Contexto
- Casal jovem e aventureiro; quer viagem **relaxante, focada em natureza e passeios** — evitar dias "explorando a cidade".
- 17–22/11 em San Diego é evento corporativo da ADP (custos cobertos). Dias por conta própria: 22–28/11.
- Datas-chave: 26/11/2026 é **Thanksgiving** (comércio e locadoras com horário reduzido); 27/11 é Black Friday.
- Pôr do sol na região ~16:40–16:55 em fim de novembro — planejar estrada e trilhas para terminar antes.

## Fontes da verdade
- `site/data/roteiro.json` — fonte estruturada do roteiro, hotéis e reservas; o site (`site/`) só renderiza esse JSON.
- `site/data/guias.json` — posts de cada dia e lugar (café, comer, fazer, levar, dicas) e as fontes (vídeos). Dicas de vídeos entram pela skill `extrair-dicas`; material bruto fica em `transcricoes/`.
- `orcamento.csv` — gastos (os totais do JSON são gerados por `scripts/enriquecer.py`).
- `roteiro.md` e `reservas.md` — versões em texto, secundárias. O foco é o JSON que o site renderiza; só atualizar os `.md` quando o usuário pedir.
- Ritmo: cada atividade tem `horas` e cada trecho de `estrada` também; o site mostra o % do dia comprometido (janela de 12h). Atividades com `opcional: true` ficam fora do % e dos gastos. Preferências do casal: animais, trilhas, parques e costa; uma atividade paga por dia; o último dia em LA e em SF é na cidade; dias tranquilos (meta ≤ 65%); teto de US$ 3.000 por plano (`viagem.teto_usd`).
- O site é um app **Next.js (App Router, TypeScript, React)** em `site/`; ele só renderiza os JSON de `site/data/` (nenhum conteúdo do roteiro fica no código). Local: `cd site && npm install && npm run dev` (http://localhost:3000); checagem: `npm run typecheck` e `npm run build`. Deploy na Vercel com Root Directory `site` (detecta o Next sozinha). Não há mais Artifact: o antigo (https://claude.ai/artifact/2yfew8tQhbBMp9dwLTVD3d) ficou parado na última versão em HTML puro.
- Páginas: `/`, `/roteiro`, `/dia/<id>`, `/lugares`, `/lugar/<chave>`, `/hoteis`, `/reservas`, `/gastos`, `/comer`, `/videos`, `/mapa/<foco>`. O plano escolhido (A/B), as reservas marcadas e as camadas do mapa ficam no `localStorage`.
- Mapa: `site/data/rotas.json` e `site/data/mapa-base.json` são gerados por `python scripts/enriquecer.py --so mapa` a partir do `trajeto` dos dias e dos campos `coord`. Nunca editar `rotas.json` à mão.
- Itens que são lugares (café, restaurante, passeio) têm `onde`; o site gera os botões do Google Maps e do Google Imagens a partir de `nome` + `onde`. Se o nome for descritivo em português, ponha em `maps` a busca certa (ex.: "Morro Bay State Park Marina").
- Planos: A e B (o Plano C, Yosemite, foi descartado em 05/10/2026). Um dia exclusivo de um plano tem id com sufixo (`dia-8-b`).
- Gastos: cada linha do `orcamento.csv` pode ter `atividade` (título exato da atividade do dia em `roteiro.json`); o site mostra o valor na atividade, o total de cada dia e a página Gastos. Depois de editar o CSV, rode `python scripts/enriquecer.py --so orcamento` e `python scripts/validar.py`. Carro: US$ 376,22 (4 diárias, com impostos), confirmado.
- `docs/estrutura-dados.md` descreve o esquema dos JSONs e do CSV (campos, valores aceitos, o que é gerado). Consulte antes de editar e atualize se criar um campo novo. `docs/pesquisa-natureza.md` e `docs/analise-plano-original.md` são pesquisas datadas.
- Skills do projeto em `.claude/skills/`: `atualizar-roteiro`, `extrair-dicas`, `orcamento` (soma o CSV por plano/categoria) e `verificar-condicoes`.
- `referencia/` é histórico: **não editar**.
- Ao mudar o roteiro, manter os três arquivos consistentes (use a skill `atualizar-roteiro`).

## Regras
- Fatos que mudam (estradas, parques abertos, horários de balsa, preços) devem ser verificados na internet e registrados com **data da checagem e link da fonte** (skill `verificar-condicoes`).
- Marcar incertezas como `⚠️ verificar` em vez de afirmar.
- Valores em USD; converter para BRL com a taxa definida em `orcamento.csv` (linha `#taxa`).
