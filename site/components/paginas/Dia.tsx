"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Acoes, Alertas, CardLugar, CorpoPost, Intro, Toc, credito, secoesDoPost } from "../comuns";
import { CustoAtiv, ListaGastos } from "../gastos";
import { Ico } from "../Icones";
import { useViagem } from "../Viagem";
import { fmtH, gmaps, quando, src } from "@/lib/format";
import { TIPOS } from "@/lib/rotulos";
import type { Atividade, Dia as DiaT } from "@/lib/types";

export default function Dia({ id }: { id: string }) {
  const { D, G, plano, diasDoPlano, ocupacao, gastosDoDia } = useViagem();
  const router = useRouter();
  const dias = diasDoPlano();
  const i = dias.findIndex((d) => d.id === id);
  const d = dias[i];
  const dado = D.dias.find((x) => x.id === id);
  const par = !d && dado ? dias.find((x) => x.rotulo === dado.rotulo) : undefined;

  // O dia é de outro plano: segue para o dia equivalente do plano escolhido.
  useEffect(() => {
    if (par) router.replace(`/dia/${par.id}`);
  }, [par, router]);

  if (!d) {
    return par || !dado ? null : (
      <div className="view">
        <p className="muted">Este dia não existe no {D.planos[plano].nome}.</p>
        <Link href="/roteiro">Ver o roteiro</Link>
      </div>
    );
  }

  const capa = D.lugares[d.capa];
  const ant = dias[i - 1], prox = dias[i + 1];
  const lugares = [...new Set(d.atividades.map((a) => a.lugar).filter((k): k is string => !!k && !!D.lugares[k]))];
  const oc = ocupacao(d);
  const gd = gastosDoDia(d);

  const linhaAtiv = (a: Atividade, k: number) => {
    const l = a.lugar ? D.lugares[a.lugar] : undefined;
    const q = l ? `${l.nome}, California` : a.onde;
    const meta = [a.stats, a.horas ? `~${fmtH(a.horas)}` : ""].filter(Boolean).join(" · ");
    return (
      <li key={k} className={[q ? "com-acoes" : "", a.opcional ? "opc" : ""].join(" ").trim() || undefined}>
        <span className="act-ico" title={TIPOS[a.tipo] || ""}><Ico n={a.tipo} /></span>
        <div>
          <h4>
            {a.titulo}
            <CustoAtiv d={d} a={a} />
          </h4>
          {meta && <div className="meta num">{meta}</div>}
          <p>{a.descricao}</p>
          {l && a.lugar && (
            <div className="tip-meta">
              <Link href={`/lugar/${a.lugar}`}>Ler sobre o lugar</Link>
            </div>
          )}
        </div>
        {q && <Acoes q={q} nome={l ? l.nome : a.titulo} />}
      </li>
    );
  };
  const opcionais = d.atividades.filter((a) => a.opcional);
  const programa = (
    <ul className="acts list">
      {d.atividades.filter((a) => !a.opcional).map(linhaAtiv)}
      {opcionais.length > 0 && (
        <>
          <li className="acts-sub">Opcional, se der vontade (fora do % do dia e dos gastos)</li>
          {opcionais.map(linhaAtiv)}
        </>
      )}
    </ul>
  );
  const gastos = gd.length
    ? [{
        id: "sec-gastos", titulo: "Gastos previstos", icone: "dinheiro",
        conteudo: (
          <>
            <ListaGastos lista={gd} rotulo="Total do dia" />
            <p className="fine" style={{ marginTop: 8 }}>
              Estimativa para o casal. Refeições com imposto e gorjeta. <Link href="/gastos">Ver todos os gastos</Link>
            </p>
          </>
        ),
      }]
    : [];
  const secs = secoesDoPost(G.dias[d.id], [{ id: "sec-programa", titulo: "Roteiro do dia", icone: "roteiro", conteudo: programa }, ...gastos]);

  return (
    <div className="view">
      {capa?.imagem && (
        <figure className="hero-img">
          <img src={src(capa.imagem)} alt={capa.nome} />
          <figcaption>{credito(capa)}</figcaption>
        </figure>
      )}
      <div className="title-block">
        <span className="label num">
          Dia {d.rotulo} · {quando(d)}
          {d.planos.length === 1 ? ` · Plano ${d.planos[0]}` : ""}
        </span>
        <h2>{d.titulo}</h2>
        <span className="muted">{d.regiao}</span>
      </div>
      <div className="chips">
        <ChipOcupacao d={d} oc={oc} />
        {d.sol && (
          <span className="chip sun num">
            <Ico n="sol" /> Pôr do sol {d.sol.por}
          </span>
        )}
        <Link className="chip so-celular" href={`/mapa/${d.id}`}>
          <Ico n="lugares" /> Ver no mapa
        </Link>
        <a className="chip" href={gmaps(d.regiao, "California")} target="_blank" rel="noopener">
          <Ico n="pin" /> Google Maps
        </a>
        {(d.estrada || []).map((e, k) => (
          <span key={k} className="chip">
            <Ico n="estrada" /> {e.trecho} · <b className="num">{e.tempo}</b>
          </span>
        ))}
      </div>
      <p className="lead">{d.resumo}</p>
      <Toc secs={secs} />
      <Intro guia={G.dias[d.id]} />
      <CorpoPost secs={secs} />
      <Alertas lista={d.alertas} />
      {lugares.length > 0 && (
        <div className="section">
          <h3>Lugares do dia</h3>
          <div className="grid">
            {lugares.map((k) => (
              <CardLugar key={k} l={{ chave: k, ...D.lugares[k] }} />
            ))}
          </div>
        </div>
      )}
      <nav className="pager" aria-label="Outros dias">
        {ant && (
          <Link href={`/dia/${ant.id}`}>
            <span>← Dia {ant.rotulo}</span>
            <b>{ant.titulo}</b>
          </Link>
        )}
        {prox && (
          <Link className="next" href={`/dia/${prox.id}`}>
            <span>Dia {prox.rotulo} →</span>
            <b>{prox.titulo}</b>
          </Link>
        )}
      </nav>
    </div>
  );
}

function ChipOcupacao({ d, oc }: { d: DiaT; oc: ReturnType<ReturnType<typeof useViagem>["ocupacao"]> }) {
  if (d.evento)
    return (
      <span className="chip ocup" data-nivel="medio">
        <Ico n="relogio" /> Dias do evento
      </span>
    );
  if (!oc) return null;
  return (
    <span className="chip ocup num" data-nivel={oc.nivel} title={`${fmtH(oc.h)} de programa e estrada, entre 8h e 20h`}>
      <Ico n="relogio" /> {oc.pct}% do dia · ~{fmtH(oc.livres)} livres
    </span>
  );
}
