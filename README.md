# Califórnia 2026 — Viagem do casal

**Período:** 17/11/2026 (Ter) → 28/11/2026 (Sáb) · 12 dias
**Rota:** San Diego → Joshua Tree → Los Angeles / Malibu → Costa Central → San Francisco / Marin
**Foco:** viagem relaxante, natureza, trilhas e passeios ao ar livre (cidades em segundo plano). Casal jovem e aventureiro.

## Status rápido

| Item | Status |
|---|---|
| Hotel San Diego (Hotel del Coronado, 17–22/11) | ✅ Pago pela ADP |
| Hotel LA (The LINE, 22–25/11) | ✅ Reservado — avaliar cancelar 3ª noite (Plano B) |
| Hotel SF (Axiom, 25–28/11) | ✅ Reservado |
| Carro Sixt (SAN 22/11 → SF 26/11) | ✅ Reservado — confirmar horário de devolução no Thanksgiving |
| Voo volta DL 1598 (SFO 28/11 07:05) | ✅ |
| Escolha Plano A × Plano B | ⏳ Pendente |
| Reservas urgentes (Alcatraz, Muir Woods, ceia, Channel Islands) | ⏳ Ver [reservas.md](reservas.md) |

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| [site/roteiro.json](site/roteiro.json) | **Fonte da verdade estruturada**: dias, atividades, lugares, hotéis, reservas. Alimenta o site |
| [site/guias.json](site/guias.json) | Posts estilo blog de cada dia e lugar: mais para fazer, café, onde comer, o que levar, dicas. Inclui as dicas dos vídeos, com crédito |
| [transcricoes/](transcricoes/) | Transcrições e resumos de vídeos do YouTube usados nos posts |
| [scripts/validar.py](scripts/validar.py) | Confere se `guias.json` bate com `roteiro.json` e lista o que falta verificar |
| [site/index.html](site/index.html) | Site mobile do roteiro (renderiza o JSON). Publicado em https://claude.ai/artifact/2yfew8tQhbBMp9dwLTVD3d |
| [scripts/enriquecer.py](scripts/enriquecer.py) | Preenche o JSON com APIs públicas: fotos (Wikipedia/Commons), pôr do sol (Sunrise-Sunset.org), preços de hotel (Xotelo), totais do orçamento e, com `--so mapa`, coordenadas (Wikipedia, Nominatim), rotas (OSRM) e o fundo vetorial do mapa |
| [site/rotas.json](site/rotas.json) | Rotas de carro, bike e balsa de cada dia, geradas a partir do campo `trajeto` dos dias |
| [site/mapa-base.json](site/mapa-base.json) | Contorno da Califórnia e vizinhos (Natural Earth), usado quando os tiles do mapa não carregam, como no Artifact |
| [scripts/servir.py](scripts/servir.py) | Serve o site em http://localhost:8000 (e no celular, no mesmo Wi-Fi) |
| [roteiro.md](roteiro.md) | Versão em texto do roteiro, para leitura |
| [reservas.md](reservas.md) | Reservas feitas, pendentes e prazos |
| [orcamento.csv](orcamento.csv) | Orçamento linha a linha (do bolso) — somar com a skill `orcamento` |
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
python scripts/enriquecer.py --so fotos  # fotos dos cafés, restaurantes e passeios das dicas (site/img/dicas/)
python scripts/validar.py               # confere guias.json
python scripts/servir.py                # abre o site localmente
```

## Mapa

O site tem um mapa Leaflet. No computador, a partir de 1100px de largura, ele fica fixo à direita; no celular, abre na página `#mapa`, pelo botão "Mapa" ou pelo chip "Ver no mapa" de cada dia e lugar. Marca a rota de cada dia, os dias, os lugares, as dicas, cafés e restaurantes e os hotéis, e acompanha a página aberta. Os tiles são os mapas cinza da Esri (claro e escuro). Onde eles são bloqueados, como no Artifact do claude.ai, o mapa usa `mapa-base.json`.

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

Tudo fica em `site/`. O `site/index.html` é um fragmento no formato de Artifact, sem `<!doctype>`, charset e viewport. No deploy, `site/build.mjs` gera `site/dist/` com o HTML completo, o JSON e as imagens. O `site/vercel.json` já configura isso.

| Configuração no painel | Valor |
|---|---|
| Root Directory | `site` |
| Framework Preset | Other |
| Build, Output e Install Command | sem override (vêm do `site/vercel.json`: `node build.mjs`, `dist` e nenhum install) |

Para testar localmente: `cd site && node build.mjs && python -m http.server -d dist 8000`.
