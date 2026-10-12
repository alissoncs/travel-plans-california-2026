# Califórnia 2026 — Viagem do casal

**Período:** 17/11/2026 (Ter) → 28/11/2026 (Sáb) · 12 dias
**Rota:** San Diego → Joshua Tree → Los Angeles / Malibu → Costa Central → San Francisco / Marin
**Foco:** viagem relaxante, natureza, trilhas e passeios ao ar livre (cidades em segundo plano). Casal jovem e aventureiro.

## Status rápido

| Item | Status |
|---|---|
| Hotel San Diego (Hotel del Coronado, 17–21/11) | ✅ Pago pela ADP |
| Hotel LA (The Kinney, Venice, 21–24/11) | ✅ Reservado (US$ 584,67, não reembolsável) |
| Hotel SF (Seaside Inn, 25–28/11) | ✅ Reservado (US$ 485,61) |
| Carro Sixt (reserva SAN 22/11 → SF 26/11) | ✅ Reservado — antecipar a retirada para 21/11 e confirmar a devolução |
| Voo volta DL 1598 (SFO 28/11 07:05) | ✅ |
| Plano escolhido | ✅ Plano B |
| Reservas urgentes (Alcatraz, Muir Woods, ceia, Channel Islands) | ⏳ Ver [reservas.md](reservas.md) |

## Primeiros passos

- **Pré-requisitos:** Python 3 (só biblioteca padrão, sem `pip install`) e Node 20+ (para o site Next.js em `site/`). O `enriquecer.py` precisa de internet; o Nominatim aceita 1 requisição por segundo, então o `--so mapa` é lento.
- **Ver o site:** `cd site && npm install && npm run dev` e abra http://localhost:3000. Para conferir o build: `npm run typecheck && npm run build`.
- **Depois de editar qualquer JSON ou o CSV:** `python scripts/enriquecer.py` (ou `--so <parte>`) e `python scripts/validar.py`. Só termine com `OK`; avisos `⚠️` são para olhar, não bloqueiam.
- **Publicar:** a Vercel faz o build do `site/` sozinha (seção Deploy). O Artifact antigo (https://claude.ai/artifact/2yfew8tQhbBMp9dwLTVD3d) não é mais atualizado.
- **Esquema dos dados:** [docs/estrutura-dados.md](docs/estrutura-dados.md).
- **Estado atual:** o Plano C (Yosemite) foi descartado em 05/10/2026; falta o casal decidir entre A e B (o JSON recomenda o B).

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| [site/data/roteiro.json](site/data/roteiro.json) | **Fonte da verdade estruturada**: dias, atividades, lugares, hotéis, reservas. Alimenta o site |
| [site/data/guias.json](site/data/guias.json) | Posts estilo blog de cada dia e lugar: mais para fazer, café, onde comer, o que levar, dicas. Inclui as dicas dos vídeos, com crédito |
| [transcricoes/](transcricoes/) | Transcrições e resumos de vídeos do YouTube usados nos posts |
| [scripts/validar.py](scripts/validar.py) | Confere se `guias.json` bate com `roteiro.json` e lista o que falta verificar |
| [site/](site/) | Site do roteiro em Next.js (React + TypeScript, App Router): `app/` tem as rotas, `components/` as páginas e o mapa, `lib/` os helpers; só renderiza os JSON de `site/data/` |
| [scripts/enriquecer.py](scripts/enriquecer.py) | Preenche o JSON com APIs públicas: fotos (Wikipedia/Commons), pôr do sol (Sunrise-Sunset.org), preços de hotel (Xotelo), totais do orçamento e, com `--so mapa`, coordenadas (Wikipedia, Nominatim), rotas (OSRM) e o fundo vetorial do mapa |
| [site/data/rotas.json](site/data/rotas.json) | Rotas de carro, bike e balsa de cada dia, geradas a partir do campo `trajeto` dos dias |
| [site/data/mapa-base.json](site/data/mapa-base.json) | Contorno da Califórnia e vizinhos (Natural Earth), usado quando os tiles do mapa não carregam |
| [roteiro.md](roteiro.md) | Versão em texto do roteiro, para leitura |
| [reservas.md](reservas.md) | Reservas feitas, pendentes e prazos |
| [orcamento.csv](orcamento.csv) | Orçamento linha a linha (do bolso) — somar com a skill `orcamento` |
| [docs/estrutura-dados.md](docs/estrutura-dados.md) | **Esquema** de `roteiro.json`, `guias.json` e `orcamento.csv`: campos, valores aceitos e o que é gerado por script |
| [docs/analise-plano-original.md](docs/analise-plano-original.md) | Problemas encontrados no plano original do Gemini |
| [docs/pesquisa-natureza.md](docs/pesquisa-natureza.md) | Passeios de natureza pesquisados, com fontes |
| [referencia/plan-trip-us.gemini.md](referencia/plan-trip-us.gemini.md) | Plano original (Gemini) — **somente leitura**, histórico |

## Skills do projeto (`.claude/skills/`)

- **`verificar-condicoes`** — checa na internet status de estradas (Highway 1 / Big Sur), parques, balsas e horários antes da viagem.
- **`atualizar-roteiro`** — regras para editar roteiro, reservas e orçamento de forma consistente (datas, dias da semana, horários de pôr do sol, tempos de estrada).
- **`extrair-dicas`** — transforma transcrições de vídeos em dicas nos posts dos dias e lugares, com crédito e link para o trecho do vídeo.
- **`orcamento`** — soma e resume `orcamento.csv` por dia/categoria, em USD e BRL.

## Comandos

```bash
python scripts/enriquecer.py            # atualiza fotos, pôr do sol, preços e orçamento no JSON
python scripts/enriquecer.py --so hoteis # só os preços de hotel
python scripts/validar.py               # confere guias.json
(cd site && npm run dev)                # abre o site em http://localhost:3000
```

## Mapa

O site tem um mapa Leaflet. No computador, a partir de 1100px de largura, ele fica fixo à direita; no celular, abre na página `/mapa`, pelo botão "Mapa" ou pelo chip "Ver no mapa" de cada dia e lugar. Marca a rota de cada dia, os dias, os lugares, as dicas, cafés e restaurantes e os hotéis, e acompanha a página aberta. Os tiles são os mapas cinza da Esri (claro e escuro). Onde eles são bloqueados, o mapa usa `mapa-base.json`.

Para mudar uma rota, edite o `trajeto` do dia em `roteiro.json` (pontos de passagem e `modo`: `carro`, `bike` ou `balsa`) e rode `python scripts/enriquecer.py --so mapa`.

## APIs públicas avaliadas

| API | Uso | Situação |
|---|---|---|
| Wikipedia REST + Wikimedia Commons | Fotos e créditos dos lugares | ✅ em uso, sem chave |
| Sunrise-Sunset.org | Pôr do sol por dia e coordenada | ✅ em uso, sem chave |
| Xotelo (`/list`, `/rates`) | Preços de hotel do Tripadvisor (Booking, Agoda, Trip.com…) | ✅ em uso, sem chave. `/search` exige RapidAPI |
| Wikipedia (coordenadas) e Nominatim (OSM) | Coordenadas dos lugares e das dicas | ✅ em uso, sem chave (Nominatim: 1 requisição por segundo) |
| OSRM (`router.project-osrm.org`, `routing.openstreetmap.de`) | Rotas de carro e bike | ✅ em uso, sem chave |
| Esri World Gray Canvas | Tiles do mapa | ✅ em uso, com atribuição. O CARTO passou a exigir chave |
| NPS Data API | Alertas dos parques nacionais | Exige chave gratuita e não aceita chamadas do navegador. Candidata para o script |
| Amadeus Self-Service | Hotéis | ❌ descontinuada em 17/07/2026 |

## Deploy na Vercel

Tudo fica em `site/`, um projeto Next.js. As páginas são geradas estaticamente no build (`next build`) a partir dos JSON de `site/data/`; o plano escolhido e as marcações ficam no navegador.

| Configuração no painel | Valor |
|---|---|
| Root Directory | `site` |
| Framework Preset | Next.js (detectado) |
| Build, Output e Install Command | sem override |

Para testar o build localmente: `cd site && npm run build && npm start`.
