---
name: orcamento
description: Soma e resume o orçamento da viagem Califórnia 2026 (orcamento.csv) por dia e categoria, em USD e BRL, para o Plano A ou B. Use quando o usuário perguntar quanto a viagem vai custar, pedir para recalcular gastos, ou depois de editar o orcamento.csv.
---

# Orçamento da viagem

Os gastos ficam em `orcamento.csv` na raiz do projeto, uma linha por item:

```
dia,data,plano,categoria,item,usd,status,atividade
```

- `plano`: `AB` (ambos), `A` ou `B`.
- `categoria`: alimentacao, gasolina, estacionamento, passeio, ingresso, transporte, hospedagem (hotéis, uma linha por noite) ou carro.
- `atividade`: título exato da atividade do dia em `site/roteiro.json`. O site mostra o valor ao lado da atividade; sem esse campo, o gasto aparece só no total do dia (como as refeições). O `validar.py` acusa título que não existe.
- Refeições já incluem imposto e gorjeta. Valores são para o casal.
- `status`: `estimado`, `confirmado`, `opcional` (fica fora do total, a menos que se passe `--com-opcionais`) ou `verificar` (valor incerto, que o script lista no final).
- A taxa de câmbio fica na linha `#taxa,<valor>`. Atualize a linha quando o câmbio mudar.
- Use `dia = 0` para custos gerais que não pertencem a um dia, como a taxa one-way da Sixt.

## Uso

```bash
python .claude/skills/orcamento/scripts/orcamento.py --plano A
python .claude/skills/orcamento/scripts/orcamento.py --plano B --com-opcionais
```

## Ao editar o orçamento
- Adicione ou altere linhas no CSV. Não escreva totais à mão em nenhum arquivo.
- Quando um preço for confirmado na internet, troque o `status` para `confirmado`.
- Depois de editar, rode `python scripts/enriquecer.py --so orcamento` (leva os valores para o site), `python scripts/validar.py`, o script acima, e informe ao usuário o total dos dois planos e os itens que ainda estão em `verificar`.
