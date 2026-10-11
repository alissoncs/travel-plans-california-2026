"use client";
import Link from "next/link";
import { Chev } from "../comuns";
import { Ico } from "../Icones";
import { useViagem } from "../Viagem";

export default function Videos() {
  const { D, G, todasDicas } = useViagem();
  const vids = Object.entries(G.fontes).filter(([, f]) => f.tipo === "youtube");
  const dicas = todasDicas().filter(({ it }) => (it.fontes || []).some((id) => G.fontes[id]?.tipo === "youtube"));
  return (
    <div className="view">
      <div className="page-head">
        <span className="label num">
          {vids.length} vídeo{vids.length === 1 ? "" : "s"} · {dicas.length} dicas
        </span>
        <h2>Dicas dos vídeos</h2>
      </div>
      <div className="list">
        {vids.map(([id, f]) => (
          <div key={id} className="row">
            <span className="thumb-ph"><Ico n="video" /></span>
            <span className="txt">
              <span className="t">{f.titulo}</span>
              <span className="s">
                {f.canal} · {dicas.filter(({ it }) => it.fontes?.includes(id)).length} dicas
              </span>
            </span>
            {f.url && <a className="btn" href={f.url} target="_blank" rel="noopener">Assistir</a>}
          </div>
        ))}
        {!vids.length && <p className="row muted">Nenhum vídeo ainda.</p>}
      </div>
      {dicas.length > 0 && (
        <div className="section">
          <h3>Onde as dicas entraram</h3>
          <div className="list">
            {dicas.map(({ it, onde }, k) => (
              <Link key={k} className="row" href={onde.tipo === "dia" ? `/dia/${onde.d.id}` : `/lugar/${onde.k}`}>
                <span className="txt">
                  <span className="t">{it.nome}</span>
                  <span className="s">{onde.tipo === "dia" ? `Dia ${onde.d.rotulo} · ${onde.d.titulo}` : D.lugares[onde.k]?.nome}</span>
                </span>
                <Chev />
              </Link>
            ))}
          </div>
        </div>
      )}
      <p className="fine">
        Para incluir um vídeo, salve a transcrição ou o resumo em <b>transcricoes/</b> no projeto e peça ao Claude para extrair as dicas.
      </p>
    </div>
  );
}
