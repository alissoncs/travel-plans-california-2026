---
name: atualizar-roteiro
description: Regras para alterar o roteiro da viagem Califórnia 2026 mantendo roteiro.md, reservas.md, orcamento.csv e o site (site/index.html) consistentes. Use sempre que o usuário pedir para mudar, trocar, adicionar ou remover um dia, passeio, hotel ou plano (A/B).
---

# Atualizar roteiro

## Checklist ao mudar qualquer coisa
1. **Datas e dias da semana.** 17/11/2026 é terça e 26/11 é quinta (Thanksgiving). Confira com `python -c "import datetime;print(datetime.date(2026,11,D).strftime('%A'))"`.
2. **Horários de funcionamento.** Exemplos: o Griffith Observatory fecha às segundas, parques estaduais fecham no pôr do sol, a balsa das Channel Islands opera cerca de 4 dias por semana no outono, e o comércio funciona em horário reduzido no Thanksgiving.
3. **Luz do dia.** O pôr do sol é por volta das 16:45. Trilhas e trechos de estrada cênica precisam terminar antes disso.
4. **Tempo de estrada.** Use estimativas realistas e acrescente 30–50% em domingos, na véspera do Thanksgiving (25/11) e saindo de LA ou SF no horário de pico. Evite dias com mais de 6h de direção.
5. **Perfil do casal.** Natureza, trilhas e passeios ao ar livre, com ritmo relaxante. Não encha os dias de atrações urbanas.
6. **Propagar a mudança:**
   - `site/roteiro.json`: fonte da verdade estruturada. Um dia só de um plano tem `planos: ["A"]` ou `["B"]` e id com sufixo (`dia-8-a`). Atividades usam `tipo` (trilha, praia, vista, fauna, agua, transporte, cidade, comida, hotel, bike) e `lugar` (chave em `lugares`, com `wiki` = título da página na Wikipedia em inglês).
   - Rodar `python scripts/enriquecer.py` para baixar fotos de lugares novos, atualizar o pôr do sol, os preços e os totais do orçamento.
   - `roteiro.md`: versão em texto para leitura.
   - `reservas.md`: o que precisa ser reservado ou cancelado e com qual prioridade.
   - `orcamento.csv`: adicione ou remova linhas e depois rode a skill `orcamento`.
   - Republicar o site (Artifact) com `site/index.html` + `roteiro.json` + `img/*`. O HTML não deve conter conteúdo do roteiro; tudo vem do JSON.
7. **Fatos incertos.** Use a skill `verificar-condicoes` ou marque `⚠️ verificar`.

## Não fazer
- Não editar nada em `referencia/`.
- Não apagar o plano que não foi escolhido antes de o usuário decidir. Depois da decisão, mova-o para uma seção "Descartado" com o motivo.
