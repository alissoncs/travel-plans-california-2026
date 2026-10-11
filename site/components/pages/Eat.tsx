"use client";
import Link from "next/link";
import { useState } from "react";
import { TipItem } from "../Guide";
import { useTrip } from "../TripProvider";
import { imageSrc, whenOf } from "@/lib/format";
import { hrefs } from "@/lib/routes";

const FILTERS = [["todos", "Todos"], ["cafe", "Café"], ["comer", "Onde comer"]];

export default function Eat() {
  const { itinerary, guides, plan, days, imageOf } = useTrip();
  const [filter, setFilter] = useState("todos");
  const groups = days
    .map((day) => ({ day, sections: (guides.dias[day.id]?.secoes ?? []).filter((s) => ["cafe", "comer"].includes(s.tipo) && (filter === "todos" || s.tipo === filter)) }))
    .filter((group) => group.sections.length);
  const total = groups.reduce((sum, group) => sum + group.sections.reduce((n, section) => n + section.itens.length, 0), 0);
  return (
    <div className="view">
      <div className="page-head">
        <span className="label num">
          {total} lugares no {itinerary.planos[plan].nome}
        </span>
        <h2>Cafés e restaurantes</h2>
      </div>
      <div className="filters" role="group" aria-label="Filtrar">
        {FILTERS.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>
      {groups.map(({ day, sections }) => (
        <div key={day.id} className="section">
          <Link className="group-head" href={hrefs.day(day.id)}>
            {imageOf(day.capa) && <img src={imageSrc(imageOf(day.capa))} alt="" loading="lazy" />}
            <div>
              <b>
                Dia {day.rotulo} · {day.titulo}
              </b>
              <span className="num">
                {whenOf(day)} · {day.regiao}
              </span>
            </div>
          </Link>
          <ul className="tips list">
            {sections.flatMap((section) => section.itens).map((item, i) => (
              <TipItem key={i} item={item} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
