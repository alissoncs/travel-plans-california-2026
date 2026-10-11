"use client";
import { Icon } from "../Icons";
import { useTrip } from "../TripProvider";
import { cityOf, dayMonth, dayMonthNumeric, gmaps, nightsBetween, usd, weekday } from "@/lib/format";

export default function Hotels() {
  const { itinerary, plan } = useTrip();
  const stays = itinerary.hospedagens.filter((lodging) => lodging.planos.includes(plan));
  const searches = (itinerary.busca_hoteis ?? []).filter((search) => search.planos.includes(plan));
  return (
    <div className="view">
      <div className="page-head">
        <span className="label">{itinerary.planos[plan].nome}</span>
        <h2>Hotéis</h2>
      </div>
      <div className="section">
        {stays.map((lodging) => (
          <div key={lodging.id} className="card">
            <div className="card-head">
              <div>
                <h3>{lodging.nome}</h3>
                <p className="muted small">{lodging.cidade}</p>
              </div>
              <div className="nights">
                <b className="num">{nightsBetween(lodging.checkin, lodging.checkout)}</b>
                <span>noites</span>
              </div>
            </div>
            <p className="small num">
              {weekday(lodging.checkin)}, {dayMonth(lodging.checkin)} → {weekday(lodging.checkout)}, {dayMonth(lodging.checkout)}
            </p>
            <div className="tip-meta">
              <span className="status">{lodging.status}</span>
              <a href={gmaps(lodging.nome, cityOf(lodging))} target="_blank" rel="noopener">
                <Icon name="pin" /> Google Maps
              </a>
            </div>
            {!!lodging.precos?.length && (
              <>
                <div className="prices">
                  {lodging.precos.map((price) => (
                    <span key={price.site} className="num">
                      {price.site} {usd(price.diaria)}
                    </span>
                  ))}
                </div>
                <p className="fine">
                  Diária para 2 adultos, consultada em {lodging.precos_em && dayMonthNumeric(lodging.precos_em)} (Tripadvisor via Xotelo).
                </p>
              </>
            )}
          </div>
        ))}
      </div>
      {searches.map((search) => (
        <div key={search.id} className="section">
          <div className="section-head">
            <h3>{search.titulo}</h3>
            <span className="muted small num">{dayMonth(search.checkin)}</span>
          </div>
          {search.opcoes?.length ? (
            <>
              <div className="list">
                {search.opcoes.map((option) => (
                  <div key={option.nome} className="row">
                    <span className="txt">
                      <a className="t" href={option.url} target="_blank" rel="noopener">{option.nome}</a>
                      <span className="s num">
                        Nota {option.nota} · {option.avaliacoes.toLocaleString("pt-BR")} avaliações ·{" "}
                        <a href={gmaps(option.nome, search.cidade)} target="_blank" rel="noopener">Google Maps</a>
                      </span>
                    </span>
                    <span className="end rate num">
                      {usd(option.diaria_min)}
                      <small>{option.site_min}</small>
                    </span>
                  </div>
                ))}
              </div>
              <p className="fine">Menor diária por hotel, consultada em {search.precos_em && dayMonthNumeric(search.precos_em)}. Preços mudam com frequência.</p>
            </>
          ) : (
            <p className="muted">Sem preços ainda.</p>
          )}
          {!!search.busca_externa?.length && (
            <div className="btns">
              {search.busca_externa.map((link) => (
                <a key={link.nome} className="btn" href={link.url} target="_blank" rel="noopener">
                  Buscar no {link.nome}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
