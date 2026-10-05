---
name: extrair-dicas
description: Extrai dicas de transcrições ou resumos de vídeos do YouTube (pasta transcricoes/) e as distribui nos posts dos dias e lugares da viagem Califórnia 2026 (site/guias.json), com crédito do vídeo. Use quando o usuário colar uma transcrição ou resumo de vídeo, ou pedir para processar um arquivo de transcricoes/.
---

# Extrair dicas de vídeos

## 1. Guardar o material
- Se o usuário colou o texto na conversa, salve-o em `transcricoes/AAAA-MM-DD_canal_assunto.md`, seguindo `transcricoes/_modelo.md`, com o texto sem alterações.
- Cadastre a fonte em `site/guias.json` → `fontes`:
  ```json
  "yt-canal-assunto": { "tipo": "youtube", "titulo": "...", "canal": "...", "url": "https://youtu.be/...", "arquivo": "transcricoes/....md", "data": "AAAA-MM-DD" }
  ```
  Sem link, use `"url": null` e peça o link ao usuário no final.

## 2. Escolher as dicas
- Fique só com o que serve para **esta** viagem: lugares do roteiro (`site/roteiro.json` → `dias`, `lugares`), as cidades por onde vocês passam e o perfil do casal (natureza, trilhas, cafés, ritmo tranquilo).
- Para cada dica, decida:
  - **Onde ela entra.** Um dia (`dias.<id>`) quando depende da data ou da logística; um lugar (`lugares.<chave>`) quando vale em qualquer dia. Um dia exclusivo de um plano (`dia-8-a`, `dia-8-b`) só recebe dicas daquele trecho; se a dica servir aos dois planos, coloque nos dois.
  - **O tipo de seção:** `fazer`, `cafe`, `comer`, `levar`, `foto` ou `dica`. Se a seção não existir no post, crie com o título padrão: "Mais para fazer", "Café", "Onde comer", "O que levar", "Fotos" ou "Dicas práticas".
- Se um lugar citado no vídeo não estiver no roteiro, mas combinar com o perfil, coloque em "Mais para fazer" do dia mais próximo.

## 3. Escrever o item
```json
{ "nome": "Leões-marinhos no Pier 39", "texto": "1–2 frases em português, com as palavras de vocês.", "onde": "Pier 39, SF", "stats": "opcional, ex. 3 km", "fontes": ["yt-..."], "tempos": {"yt-...": 754}, "verificar": "opcional: motivo" }
```
- Não copie trechos longos do vídeo; resuma.
- `onde` vira um link para o Google Maps. Use nome e bairro ou cidade.
- `tempos` mapeia cada fonte ao segundo do vídeo em que a dica aparece (ex.: `{"yt-x": 754}` para 12:34). Use quando a transcrição tiver marcação de tempo.
- **Duplicatas:** se já existir um item com o mesmo lugar ou conselho, não crie outro. Acrescente o id do vídeo em `fontes` e complete o `texto` se o vídeo trouxer algo novo.
- **Desatualização:** marque `verificar` quando o vídeo for antigo (anterior a 2025), quando citar preço, horário ou algo que costuma fechar, ou quando contradisser a pesquisa (veja `docs/pesquisa-natureza.md`). Exemplos: o Louis' (Lands End) fechou em 2020; parques de Big Sur foram afetados pelos incêndios de 2026.
- Avisos de segurança ou logística que mudam o roteiro (por exemplo, a região do hotel) também viram `alertas` do dia em `site/roteiro.json`.

## 4. Fechar
1. Rode `python scripts/validar.py` e corrija os erros.
2. No arquivo da transcrição, preencha `processado:` e liste onde cada dica entrou.
3. Atualize a tabela de `transcricoes/README.md`.
4. Republique o site: Artifact com `site/index.html` e `files` `["guias.json", "roteiro.json"]` (root `site`).
5. Responda ao usuário com um resumo curto: quantas dicas entraram e em quais páginas, o que foi descartado e por quê, e o que ficou para verificar.
