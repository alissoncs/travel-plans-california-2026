"use client";
import { DayRow } from "../Cards";
import { useTrip } from "../TripProvider";
import { dayMonth } from "@/lib/format";

export default function Itinerary() {
  const { itinerary, plan, days } = useTrip();
  return (
    <div className="view">
      <div className="page-head">
        <span className="label">{itinerary.planos[plan].nome}</span>
        <h2>Roteiro</h2>
      </div>
      {itinerary.fases.map((phase) => {
        const phaseDays = days.filter((day) => day.fase === phase.id);
        if (!phaseDays.length) return null;
        return (
          <div key={phase.id} className="section">
            <div className="section-head">
              <h3>{phase.nome}</h3>
              <span className="muted small num">
                {dayMonth(phase.inicio)} – {dayMonth(phase.fim)}
              </span>
            </div>
            <div className="list">
              {phaseDays.map((day) => (
                <DayRow key={day.id} day={day} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
