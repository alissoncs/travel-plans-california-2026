"use client";
import Link from "next/link";
import { useState } from "react";
import { ItemDica } from "../comuns";
import { useViagem } from "../Viagem";
import { quando, src } from "@/lib/format";

const FILTROS: [string, string][] = [["todos", "Todos"], ["cafe", "Café"], ["comer", "Onde comer"]];

export default function Comer() {
  const { D, G, plano, diasDoPlano, img } = useViagem();
  const [filtro, setFiltro] = useState("todos");
  const grupos = diasDoPlano()
    .map((d) => ({ d, secs: (G.dias[d.id]?.secoes || []).filter((s) => ["cafe", "comer"].includes(s.tipo) && (filtro === "todos" || s.tipo === filtro)) }))
    .filter((g) => g.secs.length);
  const total = grupos.reduce((n, g) => n + g.secs.reduce((m, s) => m + s.itens.length, 0), 0);
  return (
    <div className="view">
      <div className="page-head">
        <span className="label num">
          {total} lugares no {D.planos[plano].nome}
        </span>
        <h2>Cafés e restaurantes</h2>
      </div>
      <div className="filters" role="group" aria-label="Filtrar">
        {FILTROS.map(([k, n]) => (
          <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)}>
            {n}
          </button>
        ))}
      </div>
      {grupos.map(({ d, secs }) => (
        <div key={d.id} className="section">
          <Link className="group-head" href={`/dia/${d.id}`}>
            {img(d.capa) && <img src={src(img(d.capa))} alt="" loading="lazy" />}
            <div>
              <b>
                Dia {d.rotulo} · {d.titulo}
              </b>
              <span className="num">
                {quando(d)} · {d.regiao}
              </span>
            </div>
          </Link>
          <ul className="tips list">
            {secs.flatMap((s) => s.itens).map((it, k) => (
              <ItemDica key={k} it={it} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
