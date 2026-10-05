"""Enriquece site/roteiro.json com dados de APIs públicas (sem chave).

- Wikipedia REST + Wikimedia Commons: baixa a foto de cada lugar em site/img/ e guarda o crédito.
- Sunrise-Sunset.org: horário do pôr do sol de cada dia, na coordenada do dia.
- Xotelo (preços do Tripadvisor): diária das hospedagens com `xotelo_key` e opções de hotel
  para cada item de `busca_hoteis` (via `location_key`).
- orcamento.csv: totais por plano e categoria.
- Mapa: coordenadas dos lugares (Wikipedia) e das dicas (Nominatim), rotas de carro/bike (OSRM)
  em site/rotas.json e um fundo vetorial (site/mapa-base.json) para quando os tiles não carregam.
- Fotos das dicas: cada item que é um lugar (cafés, restaurantes, passeios, atividades com `onde`)
  ganha uma foto em site/img/dicas/, da Wikipedia/Commons ou da imagem de divulgação do site
  oficial (og:image). Para trocar uma foto, ponha no item `foto_fonte`: "File:Nome.jpg" (Commons),
  "wiki:Título" (Wikipedia) ou uma URL (página com og:image ou a própria imagem) e rode de novo.

Uso: python scripts/enriquecer.py [--so imagens|sol|hoteis|orcamento|mapa|fotos] [--forcar-imagens]
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
                resumo = get("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(lugar.get("foto_wiki") or lugar["wiki"]))
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
            if not lugar.get("foto_wiki"):
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


GUIAS = RAIZ / "site" / "guias.json"
ROTAS = RAIZ / "site" / "rotas.json"
BASE = RAIZ / "site" / "mapa-base.json"
CA_VIEWBOX = "-124.6,42.1,-114.0,32.4"  # lon_min,lat_max,lon_max,lat_min
GENERICOS = {"city", "town", "village", "hamlet", "administrative", "county", "state", "suburb", "neighbourhood", "postcode"}
ESTADOS_BASE = {"California", "Nevada", "Arizona", "Oregon", "Baja California", "Sonora"}


def simplificar(pts, tol=0.0003):
    """Douglas-Peucker em graus (0,0003° ≈ 30 m)."""
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norma = (dx * dx + dy * dy) ** 0.5
    dist, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        x0, y0 = pts[i]
        if norma < 1e-9:  # trecho fechado (loop ou anel): distância ao ponto inicial
            dd = ((x0 - x1) ** 2 + (y0 - y1) ** 2) ** 0.5
        else:
            dd = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / norma
        if dd > dist:
            dist, idx = dd, i
    if dist <= tol:
        return [pts[0], pts[-1]]
    return simplificar(pts[: idx + 1], tol)[:-1] + simplificar(pts[idx:], tol)


def coord_wiki(titulo):
    q = urllib.parse.urlencode({"action": "query", "titles": titulo, "prop": "coordinates", "redirects": 1, "format": "json"})
    paginas = get(f"https://en.wikipedia.org/w/api.php?{q}")["query"]["pages"]
    c = next(iter(paginas.values())).get("coordinates")
    return [round(c[0]["lat"], 5), round(c[0]["lon"], 5)] if c else None


def coord_nominatim(busca):
    q = urllib.parse.urlencode({"q": busca, "format": "jsonv2", "limit": 1, "countrycodes": "us",
                                "viewbox": CA_VIEWBOX, "bounded": 1})
    time.sleep(1.1)  # política de uso: no máximo 1 requisição por segundo
    r = get(f"https://nominatim.openstreetmap.org/search?{q}")
    if not r or r[0].get("addresstype") in GENERICOS or r[0].get("type") in GENERICOS:
        return None
    return [round(float(r[0]["lat"]), 5), round(float(r[0]["lon"]), 5)]


def rota(modo, pontos):
    if modo == "balsa":
        return {"modo": modo, "linha": pontos, "km": None, "min": None}
    base = ("https://router.project-osrm.org/route/v1/driving/" if modo == "carro"
            else "https://routing.openstreetmap.de/routed-bike/route/v1/bike/")
    coords = ";".join(f"{lng},{lat}" for lat, lng in pontos)
    r = get(f"{base}{coords}?overview=full&geometries=geojson")
    melhor = r["routes"][0]
    linha = simplificar([[round(lat, 5), round(lng, 5)] for lng, lat in melhor["geometry"]["coordinates"]])
    return {"modo": modo, "linha": linha, "km": round(melhor["distance"] / 1000), "min": round(melhor["duration"] / 60)}


def mapa(d):
    # 1. lugares: coordenadas da Wikipedia, com Nominatim como reserva
    for chave, l in d["lugares"].items():
        if l.get("coord"):
            continue
        try:
            l["coord"] = coord_wiki(l["wiki"]) or coord_nominatim(f"{l['nome']}, California")
            print(f"  {'✓' if l['coord'] else '✗'} lugar {chave}: {l['coord']}")
        except Exception as e:
            print(f"  ✗ lugar {chave}: {e}")
    # 2. dicas dos posts: Nominatim pelo nome + onde
    g = json.loads(GUIAS.read_text(encoding="utf-8"))
    falhas = []
    for grupo in ("dias", "lugares"):
        for chave, post in g[grupo].items():
            for s in post.get("secoes", []):
                for it in s["itens"]:
                    if it.get("coord") or it.get("sem_coord") or not it.get("onde"):
                        continue
                    try:
                        c = coord_nominatim(f"{it['nome']}, {it['onde']}, California") or coord_nominatim(f"{it['onde']}, California")
                    except Exception as e:
                        c = None
                        print(f"  ✗ {chave} · {it['nome']}: {e}")
                    if c:
                        it["coord"] = c
                    else:
                        falhas.append(f"{chave} · {it['nome']}")
    GUIAS.write_text(json.dumps(g, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  dicas sem coordenada ({len(falhas)}): {', '.join(falhas) or 'nenhuma'}")
    # 3. rotas de cada dia com trajeto
    rotas = {}
    for dia in d["dias"]:
        if not dia.get("trajeto"):
            continue
        try:
            rotas[dia["id"]] = [rota(s["modo"], s["pontos"]) for s in dia["trajeto"]]
            km = sum(s["km"] or 0 for s in rotas[dia["id"]])
            print(f"  ✓ rota {dia['id']}: {km} km, {sum(len(s['linha']) for s in rotas[dia['id']])} pontos")
            time.sleep(1)
        except Exception as e:
            print(f"  ✗ rota {dia['id']}: {e}")
    ROTAS.write_text(json.dumps(rotas, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    # 4. fundo vetorial para quando os tiles não carregam (Artifact)
    if not BASE.exists():
        estados = get("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson")
        feats = []
        for f in estados["features"]:
            if f["properties"].get("name") not in ESTADOS_BASE:
                continue
            geom = f["geometry"]
            polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
            novos = [[[[round(x, 3), round(y, 3)] for x, y in simplificar(anel, 0.004)] for anel in poly] for poly in polys]
            feats.append({"type": "Feature", "properties": {"nome": f["properties"]["name"]},
                          "geometry": {"type": "MultiPolygon", "coordinates": novos}})
        paises = get("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson")
        for f in paises["features"]:
            if f["properties"].get("NAME") != "Mexico":
                continue
            geom = f["geometry"]
            polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
            novos = [[[[round(x, 3), round(y, 3)] for x, y in simplificar(anel, 0.01)] for anel in poly] for poly in polys]
            feats.append({"type": "Feature", "properties": {"nome": "Mexico"}, "geometry": {"type": "MultiPolygon", "coordinates": novos}})
        BASE.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, separators=(",", ":")), encoding="utf-8")
        print(f"  ✓ mapa-base.json: {len(feats)} estados, {BASE.stat().st_size // 1024} KB")


FOTOS = IMG / "dicas"
LARGURA_DICA = 640
PREFIXOS = re.compile(r"^(alternativa|plano reserva|opção|opcao|ceia|na volta|se sobrar tempo|outro ângulo)\s*:\s*", re.I)
VAZIAS = {"the", "and", "of", "de", "do", "da", "dos", "das", "em", "no", "na", "e", "a", "o", "ca", "sf", "co", "inc",
          "cafe", "café", "coffee", "restaurant", "state", "park", "beach", "trail", "san", "santa", "los", "angeles",
          "francisco", "diego", "barbara", "california", "national", "valley", "yosemite"}


def chave_foto(nome):
    import unicodedata
    s = unicodedata.normalize("NFKD", PREFIXOS.sub("", nome)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:50]


def fichas(nome):
    import unicodedata
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().lower()
    return {t for t in re.findall(r"[a-z0-9]+", s) if len(t) > 2 and t not in VAZIAS}


def distancia_km(a, b):
    import math
    (la1, lo1), (la2, lo2) = a, b
    x = math.radians(lo2 - lo1) * math.cos(math.radians((la1 + la2) / 2))
    return 6371 * math.hypot(x, math.radians(la2 - la1))


def foto_commons(arquivo):
    """URL da miniatura e crédito de um arquivo do Commons ("Nome.jpg", sem o prefixo File:)."""
    q = urllib.parse.urlencode({"action": "query", "titles": f"File:{arquivo}", "prop": "imageinfo",
                                "iiprop": "url", "iiurlwidth": LARGURA_DICA, "format": "json", "redirects": 1})
    info = next(iter(get(f"https://commons.wikimedia.org/w/api.php?{q}")["query"]["pages"].values())).get("imageinfo")
    return (info[0].get("thumburl") or info[0]["url"], credito(arquivo)) if info else None


def foto_wiki(q, nome, coord, exigir_nome=True):
    """Imagem principal de um artigo da Wikipedia que bata com o nome (e fique perto, se houver coordenada)."""
    p = urllib.parse.urlencode({"action": "query", "generator": "search", "gsrsearch": q, "gsrlimit": 5,
                                "prop": "pageimages|coordinates", "piprop": "name", "format": "json"})
    paginas = get(f"https://en.wikipedia.org/w/api.php?{p}").get("query", {}).get("pages", {})
    alvo = fichas(nome)
    for pg in sorted(paginas.values(), key=lambda x: x.get("index", 99)):
        arq = pg.get("pageimage", "")
        if not arq.lower().endswith((".jpg", ".jpeg")):
            continue
        if exigir_nome and not (alvo & fichas(pg["title"])):
            continue
        c = pg.get("coordinates")
        if coord and c and distancia_km(coord, (c[0]["lat"], c[0]["lon"])) > 15:
            continue
        r = foto_commons(arq)
        if r:
            return r
    return None


def foto_busca_commons(q, nome, minimo=1):
    p = urllib.parse.urlencode({"action": "query", "generator": "search", "gsrsearch": f"{q} filetype:bitmap",
                                "gsrnamespace": 6, "gsrlimit": 10, "format": "json"})
    paginas = get(f"https://commons.wikimedia.org/w/api.php?{p}").get("query", {}).get("pages", {})
    alvo = fichas(nome)
    for pg in sorted(paginas.values(), key=lambda x: x.get("index", 99)):
        t = pg["title"].removeprefix("File:")
        if t.lower().endswith((".jpg", ".jpeg")) and len(alvo & fichas(t)) >= min(minimo, len(alvo)):
            return foto_commons(t)
    return None


def foto_site(url):
    """og:image de uma página; se a URL já for uma imagem, usa direto."""
    if re.search(r"\.(jpe?g|png|webp)(\?|$)", url, re.I):
        img = url
    else:
        req = urllib.request.Request(url, headers={**UA, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=20) as r:
            html = r.read(600_000).decode("utf-8", "ignore")
        m = (re.search(r'<meta[^>]+property=["\']og:image(?::url)?["\'][^>]+content=["\']([^"\']+)', html, re.I)
             or re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', html, re.I))
        if not m:
            return None
        img = urllib.parse.urljoin(url, m.group(1).replace("&amp;", "&"))
    dominio = urllib.parse.urlparse(url).netloc.removeprefix("www.")
    return img, {"autor": dominio, "licenca": "imagem de divulgação", "url": url}


def site_osm(nome, coord):
    """Site oficial do estabelecimento pelo OpenStreetMap (tag website), num raio de 300 m."""
    if not coord:
        return None
    palavra = max(fichas(nome) or {""}, key=len)
    if not palavra:
        return None
    q = f'[out:json][timeout:20];nwr(around:300,{coord[0]},{coord[1]})["name"~"{palavra}",i];out tags 5;'
    time.sleep(1)
    r = get("https://overpass-api.de/api/interpreter?" + urllib.parse.urlencode({"data": q}))
    for el in r.get("elements", []):
        t = el.get("tags", {})
        site = t.get("website") or t.get("contact:website")
        if site:
            return site
    return None


def salvar_foto(url, destino):
    from PIL import Image
    req = urllib.request.Request(url, headers={**UA, "User-Agent": UA["User-Agent"] + " Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        im = Image.open(io.BytesIO(r.read()))
    im = im.convert("RGB")
    if im.width > LARGURA_DICA:
        im = im.resize((LARGURA_DICA, round(im.height * LARGURA_DICA / im.width)), Image.LANCZOS)
    if im.height > im.width * 1.4:  # retrato muito alto: corta o centro
        topo = (im.height - round(im.width * 1.4)) // 2
        im = im.crop((0, topo, im.width, topo + round(im.width * 1.4)))
    im.save(destino, "JPEG", quality=74, optimize=True, progressive=True)


def itens_com_lugar(d, g):
    """Todos os itens que representam um lugar: dicas dos posts e atividades com `onde` sem `lugar`."""
    for grupo in ("dias", "lugares"):
        for post in g[grupo].values():
            for s in post.get("secoes", []):
                for it in s["itens"]:
                    if it.get("onde") or s["tipo"] in ("fazer", "cafe", "comer"):
                        yield it, s["tipo"], it["nome"]
    for dia in d["dias"]:
        for a in dia["atividades"]:
            if a.get("onde") and not a.get("lugar"):
                yield a, a["tipo"], a["titulo"]


def fotos(d, forcar):
    FOTOS.mkdir(parents=True, exist_ok=True)
    g = json.loads(GUIAS.read_text(encoding="utf-8"))
    feitas, falhas = {}, []
    for it, tipo, nome in itens_com_lugar(d, g):
        if it.get("sem_foto"):
            continue
        chave = it.get("foto_chave") or chave_foto(nome)
        destino = FOTOS / f"{chave}.jpg"
        if chave in feitas:  # mesmo lugar em outro dia
            it["foto"], it["foto_credito"] = feitas[chave]
            continue
        if destino.exists() and it.get("foto") and not forcar:
            feitas[chave] = (it["foto"], it.get("foto_credito"))
            continue
        limpo = PREFIXOS.sub("", nome)
        consulta = f"{limpo} {it.get('onde', '')}".strip()
        coord = it.get("coord")
        negocio = tipo in ("cafe", "comer", "hotel", "comida")
        achado, via = None, ""
        try:
            fonte = it.get("foto_fonte")
            if fonte:
                if fonte.startswith("File:"):
                    achado, via = foto_commons(fonte.removeprefix("File:")), "commons"
                elif fonte.startswith("wiki:"):
                    achado, via = foto_wiki(fonte[5:], fonte[5:], None, exigir_nome=False), "wikipedia"
                else:
                    achado, via = foto_site(fonte), "site"
            else:
                passos = ([("site", lambda: (s := it.get("url") or site_osm(limpo, coord)) and foto_site(s)),
                           ("commons", lambda: foto_busca_commons(consulta, limpo, minimo=2)),
                           ("wikipedia", lambda: foto_wiki(consulta, limpo, coord))]
                          if negocio else
                          [("wikipedia", lambda: foto_wiki(consulta, limpo, coord)),
                           ("commons", lambda: foto_busca_commons(consulta, limpo)),
                           ("commons", lambda: foto_busca_commons(limpo, limpo))])
                for via, passo in passos:
                    try:
                        achado = passo()
                    except Exception as e:
                        print(f"    ({via}: {e})")
                        achado = None
                    if achado:
                        break
            if not achado:
                falhas.append(nome)
                print(f"  - {nome}: sem foto")
                continue
            salvar_foto(achado[0], destino)
            it["foto"] = f"img/dicas/{chave}.jpg"
            it["foto_credito"] = achado[1]
            feitas[chave] = (it["foto"], it["foto_credito"])
            print(f"  ✓ {nome} [{via}] {achado[1]['url']}")
            time.sleep(1)
        except Exception as e:
            falhas.append(nome)
            print(f"  ✗ {nome}: {e}")
    GUIAS.write_text(json.dumps(g, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  fotos: {len(feitas)} · sem foto ({len(falhas)}): {', '.join(falhas) or 'nenhuma'}")


def orcamento(d):
    taxa, linhas = None, []
    for linha in CSV.read_text(encoding="utf-8").splitlines(keepends=True):
        if linha.startswith("#taxa,"):
            taxa = float(linha.split(",")[1])
        elif not linha.startswith("#") and linha.strip():
            linhas.append(linha)
    itens = list(csv.DictReader(io.StringIO("".join(linhas))))
    resultado = {"taxa_brl": taxa, "planos": {}}
    for plano in d["planos"]:
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
    print("  ✓ " + " · ".join(f"{k}: US$ {v['total_usd']}" for k, v in resultado["planos"].items()))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("--so", choices=["imagens", "sol", "hoteis", "orcamento", "mapa", "fotos"])
    p.add_argument("--forcar-imagens", action="store_true")
    args = p.parse_args()

    d = json.loads(JSON.read_text(encoding="utf-8"))
    etapas = {"imagens": lambda: imagens(d, args.forcar_imagens), "sol": lambda: por_do_sol(d),
              "hoteis": lambda: hoteis(d), "orcamento": lambda: orcamento(d), "mapa": lambda: mapa(d),
              "fotos": lambda: fotos(d, args.forcar_imagens)}
    for nome, fn in etapas.items():
        if args.so in (None, nome):
            print(f"[{nome}]")
            fn()
    d["atualizado_em"] = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    JSON.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Salvo em {JSON}")


if __name__ == "__main__":
    main()
