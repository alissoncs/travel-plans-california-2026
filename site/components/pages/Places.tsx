"use client";
import { useState } from "react";
import { PlaceCard } from "../Cards";
import { useTrip } from "../TripProvider";
import { ACTIVITY_TYPES } from "@/lib/labels";

const NOT_PLACES = ["transporte", "hotel", "comida"];

export default function Places() {
  const { itinerary, plan, places } = useTrip();
  const [chosen, setChosen] = useState("todos");
  const types = [...new Set(places.flatMap((place) => [...place.types]))].filter((type) => !NOT_PLACES.includes(type));
  const filter = types.includes(chosen) ? chosen : "todos";
  const shown = filter === "todos" ? places : places.filter((place) => place.types.has(filter));
  return (
    <div className="view">
      <div className="page-head">
        <span className="label">
          {places.length} lugares no {itinerary.planos[plan].nome}
        </span>
        <h2>Lugares</h2>
      </div>
      <div className="filters" role="group" aria-label="Filtrar por tipo">
        {["todos", ...types].map((type) => (
          <button key={type} type="button" aria-pressed={filter === type} onClick={() => setChosen(type)}>
            {type === "todos" ? "Todos" : ACTIVITY_TYPES[type] ?? type}
          </button>
        ))}
      </div>
      <div className="grid">
        {shown.map((place) => (
          <PlaceCard key={place.key} place={place} subtitle={place.days.map((day) => "Dia " + day.rotulo).join(", ")} />
        ))}
      </div>
    </div>
  );
}
