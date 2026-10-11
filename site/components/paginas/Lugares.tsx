"use client";
import { useState } from "react";
import { CardLugar } from "../comuns";
import { useViagem } from "../Viagem";
import { TIPOS } from "@/lib/rotulos";

export default function Lugares() {
  const { D, plano, lugaresDoPlano } = useViagem();
  const [escolhido, setFiltro] = useState("todos");
  const todos = lugaresDoPlano();
  const tipos = [...new Set(todos.flatMap((l) => [...l.tipos]))].filter((t) => !["transporte", "hotel", "comida"].includes(t));
  const filtro = tipos.includes(escolhido) ? escolhido : "todos";
  const lista = filtro === "todos" ? todos : todos.filter((l) => l.tipos.has(filtro));
  return (
    <div className="view">
      <div className="page-head">
        <span className="label">
          {todos.length} lugares no {D.planos[plano].nome}
        </span>
        <h2>Lugares</h2>
      </div>
      <div className="filters" role="group" aria-label="Filtrar por tipo">
        {["todos", ...tipos].map((t) => (
          <button key={t} type="button" aria-pressed={filtro === t} onClick={() => setFiltro(t)}>
            {t === "todos" ? "Todos" : TIPOS[t] || t}
          </button>
        ))}
      </div>
      <div className="grid">
        {lista.map((l) => (
          <CardLugar key={l.chave} l={l} sub={l.dias.map((d) => "Dia " + d.rotulo).join(", ")} />
        ))}
      </div>
    </div>
  );
}
