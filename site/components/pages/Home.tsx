"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Chevron } from "../Cards";
import { Icon } from "../Icons";
import { useTrip } from "../TripProvider";
import { brl, dayMonth, imageSrc, nightsBetween, usd } from "@/lib/format";
import { hrefs } from "@/lib/routes";
import { useDoneBookings } from "@/lib/storage";
import { countdown } from "@/lib/trip";

export default function Home() {
  const { itinerary, guides, plan, days, imageOf, totalOf, expenses } = useTrip();
  const [done] = useDoneBookings();
  const [countdownNow, setCountdownNow] = useState<ReturnType<typeof countdown> | null>(null);
  useEffect(() => setCountdownNow(countdown(itinerary)), [itinerary]);

  const { viagem } = itinerary;
  const cover = itinerary.lugares[viagem.capa];
  const hikes = days.flatMap((day) => day.atividades).filter((activity) => activity.tipo === "trilha").length;
  const urgent = itinerary.reservas.filter((b) => b.prioridade === "urgente" && (!b.planos || b.planos.includes(plan)) && !done[b.id]);
  const videos = Object.values(guides.fontes).filter((source) => source.tipo === "youtube").length;
  const total = totalOf(expenses);

  return (
    <div className="view">
      <figure className="cover">
        {cover?.imagem && <img src={imageSrc(cover.imagem)} alt={cover.nome} />}
        <figcaption className="over">
          <span className="label" style={{ color: "rgb(255 255 255/.8)" }}>
            {dayMonth(viagem.inicio)} – {dayMonth(viagem.fim)} 2026
          </span>
          <h2>{viagem.titulo}</h2>
          <p>{viagem.subtitulo}</p>
        </figcaption>
      </figure>
      <div className="stats">
        <div className="stat">
          <b className="num">{countdownNow?.value ?? "–"}</b>
          <span>{countdownNow?.label ?? " "}</span>
        </div>
        <div className="stat">
          <b className="num">{nightsBetween(viagem.inicio, viagem.fim) + 1}</b>
          <span>dias no total</span>
        </div>
        <div className="stat">
          <b className="num">{hikes}</b>
          <span>trilhas no plano</span>
        </div>
      </div>
      <div className="plan">
        <h3>
          {itinerary.planos[plan].nome} {viagem.plano_recomendado === plan && <span className="tag">Recomendado</span>}
        </h3>
        <p className="muted small">{itinerary.planos[plan].resumo}</p>
      </div>
      <div className="section">
        <div className="section-head">
          <h3>Etapas</h3>
          <Link href="/roteiro">Ver roteiro</Link>
        </div>
        <div className="list">
          {itinerary.fases.map((phase) => {
            const firstDay = days.find((day) => day.fase === phase.id);
            const image = firstDay && imageSrc(imageOf(firstDay.capa));
            return (
              <Link key={phase.id} className="row" href={firstDay ? hrefs.day(firstDay.id) : "/roteiro"}>
                {image ? <img className="thumb" src={image} alt="" loading="lazy" /> : <span className="thumb-ph"><Icon name="pin" /></span>}
                <span className="txt">
                  <span className="t">{phase.nome}</span>
                  <span className="s num">
                    {dayMonth(phase.inicio)} – {dayMonth(phase.fim)} · {phase.detalhe}
                  </span>
                </span>
                <Chevron />
              </Link>
            );
          })}
        </div>
      </div>
      <div className="section">
        <div className="section-head">
          <h3>Guias</h3>
        </div>
        <div className="list">
          <Link className="row" href="/comer">
            <span className="thumb-ph"><Icon name="cafe" /></span>
            <span className="txt">
              <span className="t">Cafés e restaurantes</span>
              <span className="s">Onde tomar café e comer em cada dia</span>
            </span>
            <Chevron />
          </Link>
          <Link className="row" href="/videos">
            <span className="thumb-ph"><Icon name="video" /></span>
            <span className="txt">
              <span className="t">Dicas dos vídeos</span>
              <span className="s num">{videos} vídeo(s) transcrito(s)</span>
            </span>
            <Chevron />
          </Link>
        </div>
      </div>
      {urgent.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h3>Para resolver já</h3>
            <Link href="/reservas">Checklist</Link>
          </div>
          <div className="list">
            {urgent.map((booking) => (
              <Link key={booking.id} className="row" href="/reservas">
                <span className="txt">
                  <span className="t">
                    <span className="dot" style={{ background: "var(--urgente)" }} />
                    {booking.item}
                  </span>
                  <span className="s">{booking.detalhe}</span>
                </span>
                <Chevron />
              </Link>
            ))}
          </div>
        </div>
      )}
      {itinerary.orcamento && (
        <Link className="row list" href="/gastos">
          <span className="thumb-ph"><Icon name="dinheiro" /></span>
          <span className="txt">
            <span className="s">Gastos previstos (hotéis, carro, passeios e refeições)</span>
            <span className="t num">
              {usd(total)} <span className="muted small">≈ {brl(total * itinerary.orcamento.taxa_brl)}</span>
            </span>
          </span>
          <Chevron />
        </Link>
      )}
    </div>
  );
}
