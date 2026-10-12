"use client";
import Link from "next/link";
import { Icon } from "./Icons";
import { useTrip } from "./TripProvider";
import { ActivityCost } from "./ExpenseList";
import { formatHours, gmaps, googleImages, imageSrc, usd, whenOf } from "@/lib/format";
import { ACTIVITY_TYPES } from "@/lib/labels";
import { hrefs } from "@/lib/routes";
import type { PlaceInPlan } from "@/lib/trip";
import type { Activity, Day, Place } from "@/lib/types";

export function Actions({ query, name }: { query: string; name: string }) {
  return (
    <span className="actions">
      <a href={googleImages(query)} target="_blank" rel="noopener" title="Fotos no Google Imagens" aria-label={`Fotos de ${name} no Google Imagens`}>
        <Icon name="foto" />
      </a>
      <a href={gmaps(query)} target="_blank" rel="noopener" title="Abrir no Google Maps" aria-label={`${name} no Google Maps`}>
        <Icon name="pin" />
      </a>
    </span>
  );
}

export function Alerts({ alerts }: { alerts?: Day["alertas"] }) {
  if (!alerts?.length) return null;
  return (
    <div className="section">
      {alerts.map((alert, i) => (
        <div key={i} className="alert" data-level={alert.nivel}>
          <Icon name={alert.nivel === "info" ? "info" : "alerta"} />
          <span>{alert.texto}</span>
        </div>
      ))}
    </div>
  );
}

export function Chevron() {
  return (
    <span className="chev">
      <Icon name="chev" />
    </span>
  );
}

export function photoCredit(place?: Place) {
  return place?.credito ? `Foto: ${place.credito.autor}${place.credito.licenca ? " · " + place.credito.licenca : ""}` : "";
}

export function DayRow({ day }: { day: Day }) {
  const { imageOf, occupancyOf, totalOf, expensesOfDay } = useTrip();
  const image = imageSrc(imageOf(day.capa));
  const occupancy = occupancyOf(day);
  const spent = totalOf(expensesOfDay(day));
  return (
    <Link className="row" href={hrefs.day(day.id)}>
      {image ? <img className="thumb" src={image} alt="" loading="lazy" /> : <span className="thumb-ph"><Icon name="transporte" /></span>}
      <span className="txt">
        <span className="s num">
          Dia {day.rotulo} · {whenOf(day)}
          {occupancy ? ` · ${occupancy.pct}% do dia` : ""}
          {spent ? ` · ≈ ${usd(spent)}` : ""}
        </span>
        <span className="t">
          {day.titulo}
        </span>
        <span className="s">{day.regiao}</span>
      </span>
      <Chevron />
    </Link>
  );
}

export function PlaceCard({ place, subtitle }: { place: Place & { key: string }; subtitle?: string }) {
  return (
    <Link className="place" href={hrefs.place(place.key)}>
      <span className="img">{place.imagem && <img src={imageSrc(place.imagem)} alt="" loading="lazy" />}</span>
      <b>{place.nome}</b>
      {subtitle && <span>{subtitle}</span>}
    </Link>
  );
}

// Com `day`, mostra também horas, custo, link do lugar e botões de mapa.
export function ActivityItem({ activity, day }: { activity: Activity; day?: Day }) {
  const { itinerary } = useTrip();
  const place = activity.lugar ? itinerary.lugares[activity.lugar] : undefined;
  const query = place ? `${place.nome}, California` : activity.onde;
  const meta = [activity.stats, day && activity.horas ? `~${formatHours(activity.horas)}` : ""].filter(Boolean).join(" · ");
  const hasActions = !!day && !!query;
  return (
    <li className={[hasActions ? "with-actions" : "", activity.opcional ? "optional" : ""].join(" ").trim() || undefined}>
      <span className="activity-icon" title={ACTIVITY_TYPES[activity.tipo] ?? ""}><Icon name={activity.tipo} /></span>
      <div>
        <h4>
          {activity.titulo}
          {day && <ActivityCost day={day} activity={activity} />}
        </h4>
        {meta && <div className="meta num">{meta}</div>}
        <p>{activity.descricao}</p>
        {day && place && activity.lugar && (
          <div className="tip-meta">
            <Link href={hrefs.place(activity.lugar)}>Ler sobre o lugar</Link>
          </div>
        )}
      </div>
      {hasActions && <Actions query={query!} name={place ? place.nome : activity.titulo} />}
    </li>
  );
}
