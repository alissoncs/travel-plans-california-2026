# Estrutura dos dados

Guia dos arquivos que alimentam o site. Os exemplos vêm dos arquivos reais; na dúvida, copie um item existente.

**Quem escreve o quê**

| Arquivo | Quem edita | Gerado por |
|---|---|---|
| `site/data/roteiro.json` | à mão, exceto os campos marcados com 🤖 | `enriquecer.py` preenche 🤖 |
| `site/data/guias.json` | à mão ou pela skill `extrair-dicas` | `enriquecer.py --so mapa` preenche `coord` das dicas |
| `orcamento.csv` | à mão | — |
| `site/data/rotas.json`, `site/data/mapa-base.json` | **nunca à mão** | `enriquecer.py --so mapa` |
| `site/public/img/*` | nunca à mão | `enriquecer.py --so imagens` |

## `site/data/roteiro.json`

Chaves de topo: `viagem`, `atualizado_em` 🤖, `planos`, `fases`, `dias`, `lugares`, `hospedagens`, `busca_hoteis`, `reservas`, `orcamento` 🤖, `fontes`, `creditos_api`.

### `viagem`, `planos`, `fases`
- `viagem`: `titulo`, `subtitulo`, `inicio`, `fim` (ISO), `perfil`, `capa` (chave de `lugares`), `plano_recomendado` (hoje `"B"`, o único plano) e `teto_usd` (limite por plano; o `validar.py` dá erro se o total passar).
- `planos`: hoje só `B`, com `nome` e `resumo`. Os Planos A e C foram descartados. O site esconde o seletor enquanto houver um plano só.
- `fases`: `sd` (San Diego, evento ADP), `road` (carro) e `sf`, com `inicio` e `fim`.

### `dias[]`
| Campo | Descrição |
|---|---|
| `id` | `dia-1`, `dia-2-5`… Dia exclusivo de um plano leva sufixo: `dia-8-a`, `dia-8-b`. Vira a âncora `#id` no site |
| `rotulo` | Texto exibido ("2–5") |
| `data`, `data_fim` | ISO. `data_fim` só em dias que cobrem vários dias (o evento) |
| `fase` | `sd`, `road` ou `sf` |
| `planos` | hoje sempre `["B"]` (com mais de um plano: `["A","B"]` para dia comum, `["A"]` para dia exclusivo) |
| `titulo`, `regiao`, `resumo` | Textos |
| `coord` | `[lat, lng]`, ponto do dia no mapa |
| `capa` | Chave de `lugares` cuja foto abre o dia (opcional) |
| `atividades[]` | Ver abaixo |
| `estrada[]` | Trechos de carro: `trecho`, `tempo` (texto, ex. "3h (domingo)"), `horas` (número) |
| `trajeto[]` | Rota do mapa: `modo` (`carro`, `bike` ou `balsa`) e `pontos` (`[[lat,lng],…]`). Gera `rotas.json` |
| `alertas[]` | `nivel` (`info`, `aviso` ou `urgente`) e `texto` |
| `sol` 🤖 | `nascer` e `por` (HH:MM) |
| `evento` | `true` no evento da ADP: fica fora do cálculo de ritmo |

### `atividades[]`
| Campo | Descrição |
|---|---|
| `tipo` | `trilha`, `praia`, `vista`, `fauna`, `agua`, `transporte`, `cidade`, `comida`, `hotel` ou `bike` (define o ícone) |
| `titulo` | Também é a chave de ligação com o gasto: `orcamento.csv` → coluna `atividade` precisa ter este título **exato** |
| `descricao`, `stats` | Texto e distância/dado curto (ex. "1–3 km") |
| `lugar` | Chave em `lugares` (ganha foto, mapa e link para o post do lugar) |
| `onde` | Alternativa a `lugar` para sítios sem página própria. O site monta os botões do Google Maps e Imagens com `titulo` + `onde`. Use `maps` para forçar a busca quando o título for descritivo |
| `horas` | Duração. Entra no cálculo do % do dia |
| `opcional` | `true` tira a atividade do % do dia e dos gastos |

**% do dia** = (soma de `horas` das atividades não opcionais + `horas` de `estrada`) ÷ 12 h. A meta é ≤ 65%; acima de 75% o `validar.py` avisa.

### `lugares{}`
Chave curta (`torrey`, `lajolla`…). Campos: `nome`, `wiki` (título da página na Wikipedia em inglês, usado para foto e coordenada), `busca` (termo alternativo para o Commons), `coord` 🤖, `imagem` 🤖 (`img/<chave>.jpg`), `credito` 🤖, `resumo_wiki` 🤖, `wiki_url` 🤖. Lugar novo: crie com `nome` e `wiki` e rode o `enriquecer.py`.

### `hospedagens[]`, `busca_hoteis[]`, `reservas[]`
- `hospedagens`: `id`, `nome`, `cidade`, `checkin`, `checkout`, `status` (texto livre), `planos`, `coord`. `xotelo_key` (opcional) faz o script buscar a diária.
- `busca_hoteis`: opções de hotel ainda não reservado. `id`, `titulo`, `planos`, `location_key` (Tripadvisor, `gNNNN`), `checkin`, `checkout`, `limite`, `busca_externa[]` (links Booking/Tripadvisor); `opcoes[]` 🤖 vem do Xotelo. Sem `location_key` (ex.: busca no Airbnb) o script pula o item. `encontrados[]` (manual): anúncios achados à mão, com `nome`, `url`, `tipo`, `nota`, `avaliacoes`, `coord`, `localizacao`, `diaria_usd` (opcional), `pros[]` e `contras[]`.
- `reservas`: checklist da página Reservas. `id`, `prioridade` (`urgente`, `importante`, `antes` ou `feito`), `item`, `detalhe`. Espelha o `reservas.md`.

### `orcamento` 🤖, `fontes`, `creditos_api`
- `orcamento`: totais por plano e categoria, `itens[]` e `taxa_brl`, gerados do CSV. Não editar.
- `fontes`: links das verificações (Caltrans, parques, balsas…). Cada fato verificado deve ter data e link (regra do `CLAUDE.md`).
- `creditos_api`: atribuição das APIs públicas, exibida no rodapé.

## `site/data/guias.json`

Chaves: `fontes`, `dias`, `lugares`.

- `fontes{id}`: `tipo` (`youtube` ou `pesquisa`), `titulo`, `canal`, `url` (`null` se faltar o link), `arquivo` (em `transcricoes/`), `data`.
- `dias{id}` e `lugares{chave}`: a chave tem de existir em `roteiro.json`. Cada post tem `intro[]` (parágrafos) e `secoes[]`.
- `secoes[]`: `tipo` ∈ `fazer`, `cafe`, `comer`, `levar`, `foto`, `dica`; `titulo` ("Mais para fazer", "Café", "Onde comer", "O que levar", "Fotos", "Dicas práticas"); `itens[]`.
- `itens[]`: `nome` e `texto` (obrigatórios); `onde` (gera os botões do Maps), `maps` (busca alternativa), `coord` 🤖, `stats`, `fontes[]` (ids de `fontes`), `tempos{fonte: segundos}` (link direto para o trecho do vídeo), `verificar` (motivo; vira aviso no `validar.py`).

## `orcamento.csv`

Primeiras linhas especiais: `#taxa,<BRL por USD>` e comentários começando com `#`. Colunas:

```
dia,data,plano,categoria,item,usd,status,atividade
```
- `data`: `DD/MM`. `plano`: hoje sempre `B` (com mais planos: `AB`, `A` ou `B`).
- `categoria`: `hospedagem`, `alimentacao`, `carro`, `transporte`, `estacionamento`, `gasolina`, `passeio`, `ingresso`.
- `status`: `estimado`, `confirmado`, `opcional` (fora do total, somado em `opcionais_usd`) ou `verificar`.
- `atividade` (opcional): título exato da atividade; sem ela, o gasto é do dia (refeições).
- Valores do casal (2 pessoas), em USD; refeições já com imposto e gorjeta.

Depois de editar: `python scripts/enriquecer.py --so orcamento` e `python scripts/validar.py`.

## O que o `validar.py` confere
Posts de `guias.json` apontando para dias/lugares existentes; tipos de seção; `nome`/`texto`; fontes cadastradas; links de Maps ausentes; coordenadas e rotas faltando; títulos de atividade do CSV; `horas` ausentes e dias acima de 75%; teto de gastos. Erros (`✗`) terminam com código 1; avisos (`⚠️`) não.

## Como o site usa os dados
O app Next (`site/`) importa `roteiro.json` e `guias.json` no build e carrega `rotas.json` e `mapa-base.json` só no mapa; não há conteúdo do roteiro no código. As imagens vêm de `site/public/img/` (o campo `imagem` fica como `img/<chave>.jpg`). O `localStorage` guarda só o plano escolhido (`plano`), as reservas marcadas como feitas (`reservas-feitas`) e as camadas do mapa (`mapa-camadas`), com fallback se estiver bloqueado.
