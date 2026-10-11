"use client";
import { useTrip } from "../TripProvider";
import { useDoneBookings } from "@/lib/storage";

const PRIORITIES = [
  { id: "urgente", label: "Fazer já", color: "var(--urgente)" },
  { id: "importante", label: "Esta semana", color: "var(--aviso)" },
  { id: "antes", label: "Antes de viajar", color: "var(--info)" },
  { id: "feito", label: "Feito", color: "var(--muted)" },
];

export default function Bookings() {
  const { itinerary, plan } = useTrip();
  const [done, setDone] = useDoneBookings();
  const bookings = itinerary.reservas.filter((b) => !b.planos || b.planos.includes(plan));
  const resolved = bookings.filter((b) => b.prioridade === "feito" || done[b.id]).length;
  return (
    <div className="view">
      <div className="page-head">
        <span className="label num">
          {resolved} de {bookings.length} resolvidos
        </span>
        <h2>Reservas</h2>
      </div>
      <div className="progress">
        <i style={{ width: `${(resolved / bookings.length) * 100}%` }} />
      </div>
      {PRIORITIES.map(({ id, label, color }) => {
        const group = bookings.filter((b) => b.prioridade === id);
        if (!group.length) return null;
        return (
          <div key={id} className="section">
            <h3>
              <span className="dot" style={{ background: color }} />
              {label}
            </h3>
            <ul className="check list">
              {group.map((booking) => {
                const checked = id === "feito" || !!done[booking.id];
                return (
                  <li key={booking.id} className={checked ? "done" : ""}>
                    <label htmlFor={`booking-${booking.id}`}>
                      <input
                        type="checkbox"
                        id={`booking-${booking.id}`}
                        checked={checked}
                        disabled={id === "feito"}
                        onChange={(event) => setDone((prev) => ({ ...prev, [booking.id]: event.target.checked }))}
                      />
                      <span className="txt">
                        <strong>{booking.item}</strong>
                        <span>{booking.detalhe}</span>
                        {booking.url && (
                          <a href={booking.url} target="_blank" rel="noopener" className="small">
                            Abrir site
                          </a>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <p className="fine">As marcações ficam salvas apenas neste navegador.</p>
    </div>
  );
}
