"""Valida site/guias.json contra site/roteiro.json.

Confere se cada post aponta para um dia ou lugar que existe, se as seções têm tipo
conhecido, se os itens têm nome e texto e se toda fonte citada está cadastrada.
Lista também dias e lugares do roteiro que ainda não têm post.

Uso: python scripts/validar.py
"""
import json
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / "site"
TIPOS = {"fazer", "cafe", "comer", "levar", "foto", "dica"}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    r = json.loads((SITE / "roteiro.json").read_text(encoding="utf-8"))
    g = json.loads((SITE / "guias.json").read_text(encoding="utf-8"))
    dias = {d["id"] for d in r["dias"]}
    lugares = set(r["lugares"])
    erros, avisos = [], []

    for grupo, validos in (("dias", dias), ("lugares", lugares)):
        for chave, post in g.get(grupo, {}).items():
            onde = f"{grupo}.{chave}"
            if chave not in validos:
                erros.append(f"{onde}: não existe em roteiro.json")
            for i, s in enumerate(post.get("secoes", [])):
                if s.get("tipo") not in TIPOS:
                    erros.append(f"{onde}.secoes[{i}]: tipo '{s.get('tipo')}' inválido ({', '.join(sorted(TIPOS))})")
                for j, it in enumerate(s.get("itens", [])):
                    if not it.get("nome") or not it.get("texto"):
                        erros.append(f"{onde}.secoes[{i}].itens[{j}]: falta nome ou texto")
                    for f in it.get("fontes", []):
                        if f not in g.get("fontes", {}):
                            erros.append(f"{onde} · '{it.get('nome')}': fonte '{f}' não cadastrada")
                    if s.get("tipo") in ("fazer", "cafe", "comer") and not (it.get("onde") or it.get("maps")):
                        avisos.append(f"{onde} · {it.get('nome')}: lugar sem `onde` (sem link do Google Maps)")
                    if (it.get("onde") or s.get("tipo") in ("fazer", "cafe", "comer")) and not it.get("foto") and not it.get("sem_foto"):
                        avisos.append(f"{onde} · {it.get('nome')}: sem foto (rode scripts/enriquecer.py --so fotos)")
                    elif it.get("foto") and not (SITE / it["foto"]).exists():
                        erros.append(f"{onde} · {it.get('nome')}: arquivo {it['foto']} não existe")
                    if it.get("verificar"):
                        avisos.append(f"{onde} · {it['nome']}: {it['verificar'] if isinstance(it['verificar'], str) else 'verificar'}")

    rotas_path = SITE / "rotas.json"
    rotas = json.loads(rotas_path.read_text(encoding="utf-8")) if rotas_path.exists() else {}
    for k, l in r["lugares"].items():
        if not l.get("coord"):
            avisos.append(f"lugar {k}: sem coordenada (rode scripts/enriquecer.py --so mapa)")
    for d in r["dias"]:
        if d.get("trajeto") and d["id"] not in rotas:
            avisos.append(f"{d['id']}: tem trajeto mas não tem rota em rotas.json (rode scripts/enriquecer.py --so mapa)")

    sem_post = sorted(dias - set(g.get("dias", {}))) + sorted(f"lugar:{k}" for k in lugares - set(g.get("lugares", {})))
    for f, meta in g.get("fontes", {}).items():
        if meta.get("tipo") == "youtube" and not meta.get("url"):
            avisos.append(f"fonte {f}: sem link do vídeo")

    print(f"Posts: {len(g.get('dias', {}))} dias, {len(g.get('lugares', {}))} lugares · fontes: {len(g.get('fontes', {}))}")
    if sem_post:
        print("Sem post:", ", ".join(sem_post))
    for a in avisos:
        print("⚠️ ", a)
    for e in erros:
        print("✗ ", e)
    print("OK" if not erros else f"{len(erros)} erro(s)")
    sys.exit(1 if erros else 0)


if __name__ == "__main__":
    main()
