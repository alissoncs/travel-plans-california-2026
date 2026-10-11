"use client";
import { Ico } from "../Icones";
import { useViagem } from "../Viagem";
import { diaMes, diaMesNum, gmaps, noites, semana, usd } from "@/lib/format";

export default function Hoteis() {
  const { D, plano } = useViagem();
  const stays = D.hospedagens.filter((h) => h.planos.includes(plano));
  const buscas = (D.busca_hoteis || []).filter((b) => b.planos.includes(plano));
  return (
    <div className="view">
      <div className="page-head">
        <span className="label">{D.planos[plano].nome}</span>
        <h2>Hotéis</h2>
      </div>
      <div className="section">
        {stays.map((h) => (
          <div key={h.id} className="card">
            <div className="card-head">
              <div>
                <h3>{h.nome}</h3>
                <p className="muted small">{h.cidade}</p>
              </div>
              <div className="nights">
                <b className="num">{noites(h.checkin, h.checkout)}</b>
                <span>noites</span>
              </div>
            </div>
            <p className="small num">
              {semana(h.checkin)}, {diaMes(h.checkin)} → {semana(h.checkout)}, {diaMes(h.checkout)}
            </p>
            <div className="tip-meta">
              <span className="status">{h.status}</span>
              <a href={gmaps(h.nome, h.cidade.split(" · ")[0])} target="_blank" rel="noopener">
                <Ico n="pin" /> Google Maps
              </a>
            </div>
            {!!h.precos?.length && (
              <>
                <div className="prices">
                  {h.precos.map((p) => (
                    <span key={p.site} className="num">
                      {p.site} {usd(p.diaria)}
                    </span>
                  ))}
                </div>
                <p className="fine">
                  Diária para 2 adultos, consultada em {h.precos_em && diaMesNum(h.precos_em)} (Tripadvisor via Xotelo).
                </p>
              </>
            )}
          </div>
        ))}
      </div>
      {buscas.map((b) => (
        <div key={b.id} className="section">
          <div className="section-head">
            <h3>{b.titulo}</h3>
            <span className="muted small num">{diaMes(b.checkin)}</span>
          </div>
          {b.opcoes?.length ? (
            <>
              <div className="list">
                {b.opcoes.map((o) => (
                  <div key={o.nome} className="row">
                    <span className="txt">
                      <a className="t" href={o.url} target="_blank" rel="noopener">{o.nome}</a>
                      <span className="s num">
                        Nota {o.nota} · {o.avaliacoes.toLocaleString("pt-BR")} avaliações ·{" "}
                        <a href={gmaps(o.nome, b.cidade)} target="_blank" rel="noopener">Google Maps</a>
                      </span>
                    </span>
                    <span className="end rate num">
                      {usd(o.diaria_min)}
                      <small>{o.site_min}</small>
                    </span>
                  </div>
                ))}
              </div>
              <p className="fine">Menor diária por hotel, consultada em {b.precos_em && diaMesNum(b.precos_em)}. Preços mudam com frequência.</p>
            </>
          ) : (
            <p className="muted">Sem preços ainda.</p>
          )}
          {!!b.busca_externa?.length && (
            <div className="btns">
              {b.busca_externa.map((l) => (
                <a key={l.nome} className="btn" href={l.url} target="_blank" rel="noopener">
                  Buscar no {l.nome}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
