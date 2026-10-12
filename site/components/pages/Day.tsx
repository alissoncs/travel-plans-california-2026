"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ActivityItem, Alerts, PlaceCard, photoCredit } from "../Cards";
import { ExpenseList } from "../ExpenseList";
import { GuideIntro, postSections, SectionBody, SectionIndex } from "../Guide";
import { Icon } from "../Icons";
import { useTrip } from "../TripProvider";
import { formatHours, gmapsInCalifornia, imageSrc, whenOf } from "@/lib/format";
import { hrefs } from "@/lib/routes";
import type { Day as DayType } from "@/lib/types";

export default function Day({ id }: { id: string }) {
  const { itinerary, guides, plan, days, expensesOfDay } = useTrip();
  const router = useRouter();
  const index = days.findIndex((d) => d.id === id);
  const day = days[index];
  const requested = itinerary.dias.find((d) => d.id === id);
  const counterpart = !day && requested ? days.find((d) => d.rotulo === requested.rotulo) : undefined;

  // O dia é de outro plano: segue para o dia equivalente do plano escolhido.
  useEffect(() => {
    if (counterpart) router.replace(hrefs.day(counterpart.id));
  }, [counterpart, router]);

  if (!day) {
    if (counterpart || !requested) return null;
    return (
      <div className="view">
        <p className="muted">Este dia não existe no {itinerary.planos[plan].nome}.</p>
        <Link href="/roteiro">Ver o roteiro</Link>
      </div>
    );
  }

  const cover = itinerary.lugares[day.capa];
  const [previous, next] = [days[index - 1], days[index + 1]];
  const placeKeys = [...new Set(day.atividades.map((a) => a.lugar).filter((key): key is string => !!key && !!itinerary.lugares[key]))];
  const expenses = expensesOfDay(day);
  const optional = day.atividades.filter((a) => a.opcional);

  const program = (
    <ul className="activities list">
      {day.atividades.filter((a) => !a.opcional).map((activity, i) => <ActivityItem key={i} activity={activity} day={day} />)}
      {optional.length > 0 && (
        <>
          <li className="activities-sub">Opcional, se der vontade (fora do % do dia e dos gastos)</li>
          {optional.map((activity, i) => <ActivityItem key={i} activity={activity} day={day} />)}
        </>
      )}
    </ul>
  );
  const costs = expenses.length
    ? [{
        id: "sec-gastos", title: "Gastos previstos", icon: "dinheiro",
        content: (
          <>
            <ExpenseList expenses={expenses} totalLabel="Total do dia" />
            <p className="fine" style={{ marginTop: 8 }}>
              Estimativa para o casal. Refeições com imposto e gorjeta. <Link href="/gastos">Ver todos os gastos</Link>
            </p>
          </>
        ),
      }]
    : [];
  const sections = postSections(guides.dias[day.id], [{ id: "sec-programa", title: "Roteiro do dia", icon: "roteiro", content: program }, ...costs]);

  return (
    <div className="view">
      {cover?.imagem && (
        <figure className="hero-img">
          <img src={imageSrc(cover.imagem)} alt={cover.nome} />
          <figcaption>{photoCredit(cover)}</figcaption>
        </figure>
      )}
      <div className="title-block">
        <span className="label num">
          Dia {day.rotulo} · {whenOf(day)}
        </span>
        <h2>{day.titulo}</h2>
        <span className="muted">{day.regiao}</span>
      </div>
      <div className="chips">
        <OccupancyChip day={day} />
        {day.sol && (
          <span className="chip sun num">
            <Icon name="sol" /> Pôr do sol {day.sol.por}
          </span>
        )}
        <Link className="chip mobile-only" href={hrefs.map(day.id)}>
          <Icon name="lugares" /> Ver no mapa
        </Link>
        <a className="chip" href={gmapsInCalifornia(day.regiao)} target="_blank" rel="noopener">
          <Icon name="pin" /> Google Maps
        </a>
        {(day.estrada ?? []).map((leg, i) => (
          <span key={i} className="chip">
            <Icon name="estrada" /> {leg.trecho} · <b className="num">{leg.tempo}</b>
          </span>
        ))}
      </div>
      <p className="lead">{day.resumo}</p>
      <SectionIndex sections={sections} />
      <GuideIntro guide={guides.dias[day.id]} />
      <SectionBody sections={sections} />
      <Alerts alerts={day.alertas} />
      {placeKeys.length > 0 && (
        <div className="section">
          <h3>Lugares do dia</h3>
          <div className="grid">
            {placeKeys.map((key) => (
              <PlaceCard key={key} place={{ key, ...itinerary.lugares[key] }} />
            ))}
          </div>
        </div>
      )}
      <nav className="pager" aria-label="Outros dias">
        {previous && (
          <Link href={hrefs.day(previous.id)}>
            <span>← Dia {previous.rotulo}</span>
            <b>{previous.titulo}</b>
          </Link>
        )}
        {next && (
          <Link className="next" href={hrefs.day(next.id)}>
            <span>Dia {next.rotulo} →</span>
            <b>{next.titulo}</b>
          </Link>
        )}
      </nav>
    </div>
  );
}

function OccupancyChip({ day }: { day: DayType }) {
  const { occupancyOf } = useTrip();
  if (day.evento)
    return (
      <span className="chip occupancy" data-level="medium">
        <Icon name="relogio" /> Dias do evento
      </span>
    );
  const occupancy = occupancyOf(day);
  if (!occupancy) return null;
  return (
    <span className="chip occupancy num" data-level={occupancy.level} title={`${formatHours(occupancy.hours)} de programa e estrada, entre 8h e 20h`}>
      <Icon name="relogio" /> {occupancy.pct}% do dia · ~{formatHours(occupancy.free)} livres
    </span>
  );
}
