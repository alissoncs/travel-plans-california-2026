"use client";
import Link from "next/link";
import { Chevron } from "../Cards";
import { Icon } from "../Icons";
import { useTrip } from "../TripProvider";
import { hrefs } from "@/lib/routes";

export default function Videos() {
  const { itinerary, guides, allTips } = useTrip();
  const videos = Object.entries(guides.fontes).filter(([, source]) => source.tipo === "youtube");
  const tips = allTips().filter(({ item }) => (item.fontes ?? []).some((id) => guides.fontes[id]?.tipo === "youtube"));
  return (
    <div className="view">
      <div className="page-head">
        <span className="label num">
          {videos.length} vídeo{videos.length === 1 ? "" : "s"} · {tips.length} dicas
        </span>
        <h2>Dicas dos vídeos</h2>
      </div>
      <div className="list">
        {videos.map(([id, video]) => (
          <div key={id} className="row">
            <span className="thumb-ph"><Icon name="video" /></span>
            <span className="txt">
              <span className="t">{video.titulo}</span>
              <span className="s">
                {video.canal} · {tips.filter(({ item }) => item.fontes?.includes(id)).length} dicas
              </span>
            </span>
            {video.url && <a className="btn" href={video.url} target="_blank" rel="noopener">Assistir</a>}
          </div>
        ))}
        {!videos.length && <p className="row muted">Nenhum vídeo ainda.</p>}
      </div>
      {tips.length > 0 && (
        <div className="section">
          <h3>Onde as dicas entraram</h3>
          <div className="list">
            {tips.map(({ item, origin }, i) => (
              <Link key={i} className="row" href={origin.kind === "day" ? hrefs.day(origin.day.id) : hrefs.place(origin.key)}>
                <span className="txt">
                  <span className="t">{item.nome}</span>
                  <span className="s">{origin.kind === "day" ? `Dia ${origin.day.rotulo} · ${origin.day.titulo}` : itinerary.lugares[origin.key]?.nome}</span>
                </span>
                <Chevron />
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
