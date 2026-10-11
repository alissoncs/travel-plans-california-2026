"use client";
import { CorpoPost, Intro, LinhaDia, Toc, credito, secoesDoPost } from "../comuns";
import { Ico } from "../Icones";
import { useViagem } from "../Viagem";
import { gmaps, src } from "@/lib/format";
import Link from "next/link";
import type { LugarDoPlano } from "@/lib/api";

export default function Lugar({ chave }: { chave: string }) {
  const { D, G, plano, lugaresDoPlano } = useViagem();
  const l: LugarDoPlano = lugaresDoPlano().find((x) => x.chave === chave) || { chave, ...D.lugares[chave], dias: [], atividades: [], tipos: new Set() };
  const extra = l.atividades.length
    ? [{
        id: "sec-fazer-roteiro", titulo: "No roteiro", icone: "roteiro",
        conteudo: (
          <ul className="acts list">
            {l.atividades.map((a, k) => (
              <li key={k}>
                <span className="act-ico"><Ico n={a.tipo} /></span>
                <div>
                  <h4>{a.titulo}</h4>
                  {a.stats && <div className="meta num">{a.stats}</div>}
                  <p>{a.descricao}</p>
                </div>
              </li>
            ))}
          </ul>
        ),
      }]
    : [];
  const secs = secoesDoPost(G.lugares[chave], extra);
  return (
    <div className="view">
      {l.imagem && (
        <figure className="hero-img">
          <img src={src(l.imagem)} alt={l.nome} />
          <figcaption>{credito(l)}</figcaption>
        </figure>
      )}
      <div className="title-block">
        <span className="label">Lugar</span>
        <h2>{l.nome}</h2>
      </div>
      <div className="chips">
        <Link className="chip so-celular" href={`/mapa/lugar-${l.chave}`}>
          <Ico n="lugares" /> Ver no mapa
        </Link>
        <a className="chip" href={gmaps(l.nome, "California")} target="_blank" rel="noopener">
          <Ico n="pin" /> Google Maps
        </a>
        {l.wiki_url && (
          <a className="chip" href={l.wiki_url} target="_blank" rel="noopener">
            <Ico n="info" /> Wikipedia
          </a>
        )}
      </div>
      <Toc secs={secs} />
      <Intro guia={G.lugares[chave]} />
      <CorpoPost secs={secs} />
      {l.dias.length ? (
        <div className="section">
          <h3>Em quais dias</h3>
          <div className="list">
            {l.dias.map((d) => (
              <LinhaDia key={d.id} d={d} />
            ))}
          </div>
        </div>
      ) : (
        <p className="muted">Este lugar não está no {D.planos[plano].nome}.</p>
      )}
      {l.resumo_wiki && (
        <div className="wiki">
          <span className="label">Da Wikipedia, em inglês</span>
          <p>
            {l.resumo_wiki}
            {l.resumo_wiki.length >= 399 ? "…" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
