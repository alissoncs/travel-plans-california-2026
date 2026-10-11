"use client";
import Link from "next/link";
import { ActivityItem, DayRow, photoCredit } from "../Cards";
import { GuideIntro, postSections, SectionBody, SectionIndex } from "../Guide";
import { Icon } from "../Icons";
import { useTrip } from "../TripProvider";
import { gmapsInCalifornia, imageSrc } from "@/lib/format";
import { hrefs, placeFocus } from "@/lib/routes";
import type { PlaceInPlan } from "@/lib/trip";

export default function Place({ placeKey }: { placeKey: string }) {
  const { itinerary, guides, plan, places } = useTrip();
  const place: PlaceInPlan = places.find((p) => p.key === placeKey) ?? { key: placeKey, ...itinerary.lugares[placeKey], days: [], activities: [], types: new Set() };
  const inItinerary = place.activities.length
    ? [{
        id: "sec-fazer-roteiro", title: "No roteiro", icon: "roteiro",
        content: <ul className="activities list">{place.activities.map((activity, i) => <ActivityItem key={i} activity={activity} />)}</ul>,
      }]
    : [];
  const sections = postSections(guides.lugares[placeKey], inItinerary);
  return (
    <div className="view">
      {place.imagem && (
        <figure className="hero-img">
          <img src={imageSrc(place.imagem)} alt={place.nome} />
          <figcaption>{photoCredit(place)}</figcaption>
        </figure>
      )}
      <div className="title-block">
        <span className="label">Lugar</span>
        <h2>{place.nome}</h2>
      </div>
      <div className="chips">
        <Link className="chip mobile-only" href={hrefs.map(placeFocus(place.key))}>
          <Icon name="lugares" /> Ver no mapa
        </Link>
        <a className="chip" href={gmapsInCalifornia(place.nome)} target="_blank" rel="noopener">
          <Icon name="pin" /> Google Maps
        </a>
        {place.wiki_url && (
          <a className="chip" href={place.wiki_url} target="_blank" rel="noopener">
            <Icon name="info" /> Wikipedia
          </a>
        )}
      </div>
      <SectionIndex sections={sections} />
      <GuideIntro guide={guides.lugares[placeKey]} />
      <SectionBody sections={sections} />
      {place.days.length ? (
        <div className="section">
          <h3>Em quais dias</h3>
          <div className="list">
            {place.days.map((day) => (
              <DayRow key={day.id} day={day} />
            ))}
          </div>
        </div>
      ) : (
        <p className="muted">Este lugar não está no {itinerary.planos[plan].nome}.</p>
      )}
      {place.resumo_wiki && (
        <div className="wiki">
          <span className="label">Da Wikipedia, em inglês</span>
          <p>
            {place.resumo_wiki}
            {place.resumo_wiki.length >= 399 ? "…" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
