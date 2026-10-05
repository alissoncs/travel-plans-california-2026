"""Enriquece site/roteiro.json com dados de APIs públicas (sem chave).

- Wikipedia REST + Wikimedia Commons: baixa a foto de cada lugar em site/img/ e guarda o crédito.
- Sunrise-Sunset.org: horário do pôr do sol de cada dia, na coordenada do dia.
- Xotelo (preços do Tripadvisor): diária das hospedagens com `xotelo_key` e opções de hotel
  para cada item de `busca_hoteis` (via `location_key`).
- orcamento.csv: totais por plano e categoria.

Uso: python scripts/enriquecer.py [--so imagens|sol|hoteis|orcamento] [--forcar-imagens]
"""
import argparse
import csv
import datetime as dt
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
JSON = RAIZ / "site" / "roteiro.json"
IMG = RAIZ / "site" / "img"
CSV = RAIZ / "orcamento.csv"
UA = {"User-Agent": "trip-california-2026/1.0 (planejamento pessoal de viagem)"}
LARGURA = 960  # largura padrão de miniatura do Wikimedia


def get(url, binario=False, tentativas=5):
    for n in range(tentativas):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                dados = r.read()
            return dados if binario else json.loads(dados)
        except urllib.error.HTTPError as e:
            if e.code != 429 or n == tentativas - 1:
                raise
            time.sleep(int(e.headers.get("Retry-After") or 0) or 2 ** (n + 1))


def limpar_html(txt):
    return re.sub(r"<[^>]+>", "", txt or "").strip()


def imagens(d, forcar):
    IMG.mkdir(exist_ok=True)
    for chave, lugar in d["lugares"].items():
        destino = IMG / f"{chave}.jpg"
        if destino.exists() and lugar.get("imagem") and not forcar:
            continue
        try:
            try:
                resumo = get("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(lugar["wiki"]))
            except urllib.error.HTTPError:
                resumo = {}
            thumb = (resumo.get("thumbnail") or {}).get("source")
            if not thumb or thumb.lower().endswith(".svg.png") or ".svg" in thumb.lower():
                thumb = busca_commons(lugar.get("busca") or lugar["nome"])
            if not thumb:
                print(f"  - {chave}: sem foto encontrada")
                continue
            arquivo = urllib.parse.unquote(thumb.split("/")[-2]) if "/thumb/" in thumb else urllib.parse.unquote(thumb.split("/")[-1].split("?")[0])
            url = re.sub(r"/\d+px-", f"/{LARGURA}px-", thumb.split("?")[0])
            destino.write_bytes(get(url, binario=True))
            lugar["imagem"] = f"img/{chave}.jpg"
            lugar["resumo_wiki"] = resumo.get("extract", "")[:400]
            lugar["wiki_url"] = resumo.get("content_urls", {}).get("desktop", {}).get("page")
            lugar["credito"] = credito(arquivo)
            print(f"  ✓ {chave}: {arquivo}")
            time.sleep(1.5)
        except Exception as e:  # um lugar sem foto não deve parar o resto
            print(f"  ✗ {chave}: {e}")


def busca_commons(termo):
    """Primeira foto JPEG do Wikimedia Commons para o termo, como URL de miniatura."""
    q = urllib.parse.urlencode({
        "action": "query", "generator": "search", "gsrsearch": f"{termo} filetype:bitmap",
        "gsrnamespace": 6, "gsrlimit": 5, "prop": "imageinfo", "iiprop": "url",
        "iiurlwidth": LARGURA, "format": "json",
    })
    paginas = get(f"https://commons.wikimedia.org/w/api.php?{q}").get("query", {}).get("pages", {})
    for pagina in sorted(paginas.values(), key=lambda p: p.get("index", 99)):
        if pagina["title"].lower().endswith((".jpg", ".jpeg")):
            return pagina.get("imageinfo", [{}])[0].get("thumburl")
    return None


def credito(arquivo):
    q = urllib.parse.urlencode({
        "action": "query", "titles": f"File:{arquivo}", "prop": "imageinfo",
        "iiprop": "extmetadata", "format": "json",
    })
    try:
        paginas = get(f"https://commons.wikimedia.org/w/api.php?{q}")["query"]["pages"]
        meta = next(iter(paginas.values()))["imageinfo"][0]["extmetadata"]
        autor = limpar_html(meta.get("Artist", {}).get("value")) or "Autor desconhecido"
        licenca = meta.get("LicenseShortName", {}).get("value", "")
        return {"autor": autor[:80], "licenca": licenca,
                "url": f"https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(arquivo)}"}
    except Exception:
        return {"autor": "Wikimedia Commons", "licenca": "",
                "url": f"https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(arquivo)}"}


def por_do_sol(d):
    for dia in d["dias"]:
        lat, lng = dia["coord"]
        q = urllib.parse.urlencode({"lat": lat, "lng": lng, "date": dia["data"],
                                    "formatted": 0, "tzid": "America/Los_Angeles"})
        try:
            r = get(f"https://api.sunrise-sunset.org/json?{q}")["results"]
            dia["sol"] = {"nascer": r["sunrise"][11:16], "por": r["sunset"][11:16]}
            print(f"  ✓ {dia['id']}: pôr do sol {dia['sol']['por']}")
        except Exception as e:
            print(f"  ✗ {dia['id']}: {e}")


def precos(chave, checkin, checkout):
    q = urllib.parse.urlencode({"hotel_key": chave, "chk_in": checkin, "chk_out": checkout, "adults": 2})
    r = get(f"https://data.xotelo.com/api/rates?{q}")
    if r.get("error"):
        raise RuntimeError(r["error"])
    return sorted(({"site": x["name"], "diaria": x["rate"]} for x in r["result"]["rates"]),
                  key=lambda x: x["diaria"])


def hoteis(d):
    hoje = dt.date.today().isoformat()
    for h in d["hospedagens"]:
        if not h.get("xotelo_key"):
            continue
        try:
            h["precos"] = precos(h["xotelo_key"], h["checkin"], h["checkout"])
            h["precos_em"] = hoje
            print(f"  ✓ {h['nome']}: {len(h['precos'])} preços")
        except Exception as e:
            print(f"  ✗ {h['nome']}: {e}")
    for b in d.get("busca_hoteis", []):
        q = urllib.parse.urlencode({"location_key": b["location_key"], "limit": 30, "sort": "best_value"})
        try:
            lista = get(f"https://data.xotelo.com/api/list?{q}")["result"]["list"]
        except Exception as e:
            print(f"  ✗ {b['id']}: {e}")
            continue
        opcoes = []
        for item in lista:
            if len(opcoes) >= b.get("limite", 6):
                break
            try:
                p = precos(item["key"], b["checkin"], b["checkout"])
            except Exception:
                continue
            if not p:
                continue
            opcoes.append({
                "nome": item["name"], "nota": item["review_summary"]["rating"],
                "avaliacoes": item["review_summary"]["count"], "url": item["url"],
                "coord": [item["geo"]["latitude"], item["geo"]["longitude"]],
                "diaria_min": p[0]["diaria"], "site_min": p[0]["site"],
            })
            time.sleep(0.3)
        b["opcoes"] = sorted(opcoes, key=lambda o: o["diaria_min"])
        b["precos_em"] = hoje
        print(f"  ✓ {b['id']}: {len(opcoes)} opções com preço")


def orcamento(d):
    taxa, linhas = None, []
    for linha in CSV.read_text(encoding="utf-8").splitlines(keepends=True):
        if linha.startswith("#taxa,"):
            taxa = float(linha.split(",")[1])
        elif not linha.startswith("#") and linha.strip():
            linhas.append(linha)
    itens = list(csv.DictReader(io.StringIO("".join(linhas))))
    resultado = {"taxa_brl": taxa, "planos": {}}
    for plano in ("A", "B"):
        cat, opcionais, verificar = defaultdict(float), 0.0, 0
        for i in itens:
            if plano not in i["plano"]:
                continue
            if i["status"] == "opcional":
                opcionais += float(i["usd"])
                continue
            cat[i["categoria"]] += float(i["usd"])
            verificar += i["status"] == "verificar"
        resultado["planos"][plano] = {
            "total_usd": round(sum(cat.values()), 2),
            "opcionais_usd": round(opcionais, 2),
            "itens_a_verificar": verificar,
            "categorias": dict(sorted(cat.items(), key=lambda kv: -kv[1])),
        }
    d["orcamento"] = resultado
    print(f"  ✓ A: US$ {resultado['planos']['A']['total_usd']} · B: US$ {resultado['planos']['B']['total_usd']}")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("--so", choices=["imagens", "sol", "hoteis", "orcamento"])
    p.add_argument("--forcar-imagens", action="store_true")
    args = p.parse_args()

    d = json.loads(JSON.read_text(encoding="utf-8"))
    etapas = {"imagens": lambda: imagens(d, args.forcar_imagens), "sol": lambda: por_do_sol(d),
              "hoteis": lambda: hoteis(d), "orcamento": lambda: orcamento(d)}
    for nome, fn in etapas.items():
        if args.so in (None, nome):
            print(f"[{nome}]")
            fn()
    d["atualizado_em"] = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    JSON.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Salvo em {JSON}")


if __name__ == "__main__":
    main()
