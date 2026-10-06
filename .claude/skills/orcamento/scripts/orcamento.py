"""Soma o orcamento.csv da viagem por dia e categoria, em USD e BRL.

Uso: python orcamento.py [--plano A|B] [--com-opcionais] [--arquivo CAMINHO]
"""
import argparse
import csv
import io
import sys
from collections import defaultdict
from pathlib import Path

PADRAO = Path(__file__).resolve().parents[4] / "orcamento.csv"


def carregar(caminho):
    taxa = None
    linhas = []
    with open(caminho, encoding="utf-8") as f:
        for linha in f:
            if linha.startswith("#taxa,"):
                taxa = float(linha.split(",")[1])
            elif not linha.startswith("#") and linha.strip():
                linhas.append(linha)
    if taxa is None:
        raise SystemExit("Linha '#taxa,<valor>' não encontrada no CSV.")
    return taxa, list(csv.DictReader(io.StringIO("".join(linhas))))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("--plano", choices=["A", "B"], default="A")
    p.add_argument("--com-opcionais", action="store_true")
    p.add_argument("--arquivo", default=str(PADRAO))
    args = p.parse_args()

    taxa, itens = carregar(args.arquivo)
    itens = [
        i for i in itens
        if args.plano in i["plano"]
        and (args.com_opcionais or i["status"] != "opcional")
    ]

    por_dia = defaultdict(float)
    por_cat = defaultdict(float)
    for i in itens:
        valor = float(i["usd"])
        por_dia[(int(i["dia"]), i["data"])] += valor
        por_cat[i["categoria"]] += valor
    total = sum(por_dia.values())

    print(f"Plano {args.plano}{' (com opcionais)' if args.com_opcionais else ''} — taxa R$ {taxa:.2f}\n")
    print("Por dia:")
    for (dia, data), v in sorted(por_dia.items()):
        rotulo = "Geral" if dia == 0 else f"Dia {dia:>2} ({data})"
        print(f"  {rotulo:<18} US$ {v:>8.2f}")
    print("\nPor categoria:")
    for cat, v in sorted(por_cat.items(), key=lambda kv: -kv[1]):
        print(f"  {cat:<18} US$ {v:>8.2f}")
    print(f"\nTOTAL: US$ {total:,.2f}  (~R$ {total * taxa:,.2f})")

    pendentes = [i for i in itens if i["status"] == "verificar"]
    if pendentes:
        print(f"\n⚠️  {len(pendentes)} item(ns) a verificar:")
        for i in pendentes:
            print(f"  - Dia {i['dia']}: {i['item']} (US$ {i['usd']})")


if __name__ == "__main__":
    main()
