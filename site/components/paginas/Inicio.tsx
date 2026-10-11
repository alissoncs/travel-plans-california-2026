"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Chev } from "../comuns";
import { Ico } from "../Icones";
import { useViagem } from "../Viagem";
import { contagem } from "@/lib/api";
import { brl, diaMes, src, usd } from "@/lib/format";
import { useSalvo } from "@/lib/store";

export default function Inicio() {
  const { D, G, plano, diasDoPlano, img, soma, gastosDoPlano } = useViagem();
  const [feitos] = useSalvo<Record<string, boolean>>("reservas-feitas", {});
  const [cont, setCont] = useState<[number | string, string] | null>(null);
  useEffect(() => setCont(contagem(D)), [D]);

  const capa = D.lugares[D.viagem.capa];
  const dias = diasDoPlano();
  const trilhas = dias.flatMap((d) => d.atividades).filter((a) => a.tipo === "trilha").length;
  const urg = D.reservas.filter((r) => r.prioridade === "urgente" && (!r.planos || r.planos.includes(plano)) && !feitos[r.id]);
  const p = D.planos[plano];
  const total = soma(gastosDoPlano());
  const videos = Object.values(G.fontes).filter((f) => f.tipo === "youtube").length;

  return (
    <div className="view">
      <figure className="cover">
        {capa?.imagem && <img src={src(capa.imagem)} alt={capa.nome} />}
        <figcaption className="over">
          <span className="label" style={{ color: "rgb(255 255 255/.8)" }}>
            {diaMes(D.viagem.inicio)} – {diaMes(D.viagem.fim)} 2026
          </span>
          <h2>{D.viagem.titulo}</h2>
          <p>{D.viagem.subtitulo}</p>
        </figcaption>
      </figure>
      <div className="stats">
        <div className="stat">
          <b className="num">{cont ? cont[0] : "–"}</b>
          <span>{cont ? cont[1] : " "}</span>
        </div>
        <div className="stat">
          <b className="num">12</b>
          <span>dias no total</span>
        </div>
        <div className="stat">
          <b className="num">{trilhas}</b>
          <span>trilhas no plano</span>
        </div>
      </div>
      <div className="plan">
        <h3>
          {p.nome} {D.viagem.plano_recomendado === plano && <span className="tag">Recomendado</span>}
        </h3>
        <p className="muted small">{p.resumo}</p>
        <p className="small">
          Troque o plano no seletor <b>{Object.keys(D.planos).join(" / ")}</b> no topo.
        </p>
      </div>
      <div className="section">
        <div className="section-head">
          <h3>Etapas</h3>
          <Link href="/roteiro">Ver roteiro</Link>
        </div>
        <div className="list">
          {D.fases.map((f) => {
            const primeiro = dias.find((d) => d.fase === f.id);
            const i = primeiro && src(img(primeiro.capa));
            return (
              <Link key={f.id} className="row" href={primeiro ? `/dia/${primeiro.id}` : "/roteiro"}>
                {i ? <img className="thumb" src={i} alt="" loading="lazy" /> : <span className="thumb-ph"><Ico n="pin" /></span>}
                <span className="txt">
                  <span className="t">{f.nome}</span>
                  <span className="s num">
                    {diaMes(f.inicio)} – {diaMes(f.fim)} · {f.detalhe}
                  </span>
                </span>
                <Chev />
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
            <span className="thumb-ph"><Ico n="cafe" /></span>
            <span className="txt">
              <span className="t">Cafés e restaurantes</span>
              <span className="s">Onde tomar café e comer em cada dia</span>
            </span>
            <Chev />
          </Link>
          <Link className="row" href="/videos">
            <span className="thumb-ph"><Ico n="video" /></span>
            <span className="txt">
              <span className="t">Dicas dos vídeos</span>
              <span className="s num">{videos} vídeo(s) transcrito(s)</span>
            </span>
            <Chev />
          </Link>
        </div>
      </div>
      {urg.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h3>Para resolver já</h3>
            <Link href="/reservas">Checklist</Link>
          </div>
          <div className="list">
            {urg.map((r) => (
              <Link key={r.id} className="row" href="/reservas">
                <span className="txt">
                  <span className="t">
                    <span className="dot" style={{ background: "var(--urgente)" }} />
                    {r.item}
                  </span>
                  <span className="s">{r.detalhe}</span>
                </span>
                <Chev />
              </Link>
            ))}
          </div>
        </div>
      )}
      {D.orcamento && (
        <Link className="row list" href="/gastos">
          <span className="thumb-ph"><Ico n="dinheiro" /></span>
          <span className="txt">
            <span className="s">Gastos previstos (hotéis, carro, passeios e refeições)</span>
            <span className="t num">
              {usd(total)} <span className="muted small">≈ {brl(total * D.orcamento.taxa_brl)}</span>
            </span>
          </span>
          <Chev />
        </Link>
      )}
    </div>
  );
}
