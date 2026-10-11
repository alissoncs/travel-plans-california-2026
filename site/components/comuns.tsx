"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Ico } from "./Icones";
import { useViagem } from "./Viagem";
import { diaMes, fmtH, gimagens, gmaps, quando, semPrefixo, src, usd } from "@/lib/format";
import { SECOES } from "@/lib/rotulos";
import type { Dia, Guia, ItemGuia, Lugar } from "@/lib/types";
import type { LugarDoPlano } from "@/lib/api";

export { diaMes, fmtH };

export const buscaDe = (it: { nome?: string; titulo?: string; onde?: string; maps?: string }) =>
  it.maps || [semPrefixo(it.nome || it.titulo || ""), it.onde].filter(Boolean).join(", ");

export function Acoes({ q, nome }: { q: string; nome: string }) {
  return (
    <span className="acoes">
      <a href={gimagens(q)} target="_blank" rel="noopener" title="Fotos no Google Imagens" aria-label={`Fotos de ${nome} no Google Imagens`}>
        <Ico n="foto" />
      </a>
      <a href={gmaps(q)} target="_blank" rel="noopener" title="Abrir no Google Maps" aria-label={`${nome} no Google Maps`}>
        <Ico n="pin" />
      </a>
    </span>
  );
}

export function BadgeFonte({ id, tempo }: { id: string; tempo?: number }) {
  const { G } = useViagem();
  const f = G.fontes[id];
  if (!f || f.tipo !== "youtube") return null;
  const ts = tempo ? ` · ${Math.floor(tempo / 60)}:${String(tempo % 60).padStart(2, "0")}` : "";
  const conteudo = (
    <>
      <Ico n="video" /> {f.canal}
      {ts}
    </>
  );
  if (!f.url) return <Link className="badge-src" href="/videos">{conteudo}</Link>;
  const href = f.url + (tempo ? (f.url.includes("?") ? "&" : "?") + "t=" + tempo : "");
  return <a className="badge-src" href={href} target="_blank" rel="noopener">{conteudo}</a>;
}

export function ItemDica({ it }: { it: ItemGuia }) {
  const q = it.onde || it.maps;
  const fontes = (it.fontes || []).map((id) => <BadgeFonte key={id} id={id} tempo={it.tempos?.[id]} />);
  return (
    <li className={q ? "com-acoes" : undefined}>
      {q && <Acoes q={buscaDe(it)} nome={semPrefixo(it.nome)} />}
      <h4>
        {it.nome} {it.stats && <span className="meta num">{it.stats}</span>}
      </h4>
      <p>{it.texto}</p>
      {(it.onde || it.verificar || fontes.length > 0 || it.url) && (
        <div className="tip-meta">
          {it.onde && (
            <span className="onde">
              <Ico n="pin" /> {it.onde}
            </span>
          )}
          {it.url && <a href={it.url} target="_blank" rel="noopener">Site</a>}
          {it.verificar && (
            <span className="badge-warn">
              <Ico n="alerta" /> {typeof it.verificar === "string" ? it.verificar : "Verificar"}
            </span>
          )}
          {fontes}
        </div>
      )}
    </li>
  );
}

// ---------- post (dia e lugar): índice + seções ----------
export interface SecaoPost {
  id: string;
  titulo: string;
  icone: string;
  conteudo: ReactNode;
}

export function secoesDoPost(guia: Guia | undefined, extra: SecaoPost[] = []): SecaoPost[] {
  const doGuia = (guia?.secoes || [])
    .filter((s) => s.itens?.length)
    .map((s, i) => ({
      id: `sec-${s.tipo}-${i}`,
      titulo: s.titulo || SECOES[s.tipo]?.[0] || "",
      icone: SECOES[s.tipo]?.[1] || "fazer",
      conteudo: <ul className="tips list">{s.itens.map((it, j) => <ItemDica key={j} it={it} />)}</ul>,
    }));
  return [...extra, ...doGuia];
}

export function Toc({ secs }: { secs: SecaoPost[] }) {
  if (secs.length < 2) return null;
  const ir = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return (
    <nav className="toc" aria-label="Neste post">
      <span>Neste post</span>
      {secs.map((s) => (
        <button key={s.id} type="button" onClick={() => ir(s.id)}>
          <Ico n={s.icone} /> {s.titulo}
        </button>
      ))}
    </nav>
  );
}

export function CorpoPost({ secs }: { secs: SecaoPost[] }) {
  return (
    <>
      {secs.map((s) => (
        <section key={s.id} className="section post-sec" id={s.id}>
          <h3>
            <Ico n={s.icone} /> {s.titulo}
          </h3>
          {s.conteudo}
        </section>
      ))}
    </>
  );
}

export function Intro({ guia }: { guia?: Guia }) {
  if (!guia?.intro?.length) return null;
  return (
    <div className="prose">
      {guia.intro.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

// ---------- listas ----------
export function Alertas({ lista }: { lista?: Dia["alertas"] }) {
  if (!lista?.length) return null;
  return (
    <div className="section">
      {lista.map((a, i) => (
        <div key={i} className="alert" data-nivel={a.nivel}>
          <Ico n={a.nivel === "info" ? "info" : "alerta"} />
          <span>{a.texto}</span>
        </div>
      ))}
    </div>
  );
}

export function Chev() {
  return (
    <span className="chev">
      <Ico n="chev" />
    </span>
  );
}

export function LinhaDia({ d }: { d: Dia }) {
  const { img, ocupacao, soma, gastosDoDia } = useViagem();
  const i = src(img(d.capa));
  const oc = ocupacao(d);
  const gasto = soma(gastosDoDia(d));
  return (
    <Link className="row" href={`/dia/${d.id}`}>
      {i ? <img className="thumb" src={i} alt="" loading="lazy" /> : <span className="thumb-ph"><Ico n="transporte" /></span>}
      <span className="txt">
        <span className="s num">
          Dia {d.rotulo} · {quando(d)}
          {oc ? ` · ${oc.pct}% do dia` : ""}
          {gasto ? ` · ≈ ${usd(gasto)}` : ""}
        </span>
        <span className="t">
          {d.titulo}
          {d.planos.length === 1 && <span className="tag">Plano {d.planos[0]}</span>}
        </span>
        <span className="s">{d.regiao}</span>
      </span>
      <Chev />
    </Link>
  );
}
export function CardLugar({ l, sub }: { l: Lugar & { chave: string } | LugarDoPlano; sub?: string }) {
  return (
    <Link className="place" href={`/lugar/${l.chave}`}>
      <span className="img">{l.imagem && <img src={src(l.imagem)} alt="" loading="lazy" />}</span>
      <b>{l.nome}</b>
      {sub && <span>{sub}</span>}
    </Link>
  );
}

export function credito(l?: Lugar) {
  return l?.credito ? `Foto: ${l.credito.autor}${l.credito.licenca ? " · " + l.credito.licenca : ""}` : "";
}
