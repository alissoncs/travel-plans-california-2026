"use client";
import Link from "next/link";
import { LinhaGasto, ListaGastos } from "../gastos";
import { useViagem } from "../Viagem";
import { brl, dataBr, quando, usd } from "@/lib/format";
import { CAT } from "@/lib/rotulos";

export default function Gastos() {
  const { D, plano, gastosDoPlano, gastosDoDia, soma, diasDoPlano } = useViagem();
  const o = D.orcamento;
  if (!o) return null;
  const itens = gastosDoPlano();
  const teto = D.viagem.teto_usd;
  const total = soma(itens);
  const porCat = (c: string) => itens.filter((g) => g.categoria === c);
  const noites = porCat("hospedagem").filter((g) => g.usd > 0).length;
  const destaques: [string, number, string][] = [
    ["Hotéis", soma(porCat("hospedagem")), `${noites} noites · Coronado pago pela ADP`],
    ["Aluguel do carro", soma(porCat("carro")), "4 diárias, com impostos"],
    ["Gasolina", soma(porCat("gasolina")), "estimativa"],
  ];
  const cats = Object.entries(
    itens.filter((g) => g.status !== "opcional").reduce<Record<string, number>>((m, g) => ({ ...m, [g.categoria]: (m[g.categoria] || 0) + g.usd }), {}),
  )
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const max = Math.max(...cats.map(([, v]) => v));
  const dias = diasDoPlano().map((d) => ({ d, v: soma(gastosDoDia(d)) }));
  const verif = itens.filter((g) => g.status === "verificar");
  const opc = itens.filter((g) => g.status === "opcional");
  const precosEm = D.hospedagens.find((h) => h.precos_em)?.precos_em;
  return (
    <div className="view">
      <div className="page-head">
        <span className="label">{D.planos[plano].nome} · 17 a 28/11</span>
        <h2>Gastos</h2>
      </div>
      <div className="card total">
        <span className="muted small">Total previsto para o casal</span>
        <b className="num">{usd(total)}</b>
        <span className="muted num">
          ≈ {brl(total * o.taxa_brl)} · câmbio R$ {o.taxa_brl.toLocaleString("pt-BR")}
        </span>
        {teto && (
          <>
            <div className="ocup-bar" style={{ marginTop: 6 }}>
              <i style={{ width: `${Math.min(100, (total / teto) * 100)}%`, ...(total > teto ? { background: "var(--urgente)" } : {}) }} />
            </div>
            <span className="small num" style={{ color: total > teto ? "var(--urgente)" : "var(--accent)" }}>
              {total > teto ? `Passa ${usd(total - teto)} do teto de ${usd(teto)}` : `Dentro do teto de ${usd(teto)} · sobram ${usd(teto - total)}`}
            </span>
          </>
        )}
      </div>
      <div className="stats">
        {destaques.map(([n, v, s]) => (
          <div key={n} className="stat">
            <span>{n}</span>
            <b className="num" style={{ fontSize: 20 }}>{usd(v)}</b>
            <small>{s}</small>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ fontSize: 17 }}>Por categoria</h3>
        <div className="bars">
          {cats.map(([k, v]) => (
            <div key={k} className="bar-row">
              <div>
                <span>{CAT[k] || k}</span>
                <b className="num">{usd(v)}</b>
              </div>
              <div className="track">
                <i style={{ width: `${(v / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <h3>Por dia</h3>
        <ul className="gastos list">
          {dias.map(({ d, v }) => (
            <li key={d.id}>
              <Link href={`/dia/${d.id}`}>
                <span className="txt">
                  <span className="t">
                    Dia {d.rotulo} · {d.titulo}
                  </span>
                  <span className="s num">{quando(d)}</span>
                </span>
                <b className="num">{v ? usd(v) : "—"}</b>
              </Link>
            </li>
          ))}
          <li className="tot">
            <span>Total</span>
            <b className="num">{usd(total)}</b>
          </li>
        </ul>
      </div>
      {verif.length > 0 && (
        <div className="section">
          <h3>A confirmar</h3>
          <ListaGastos lista={verif} rotulo="Soma dos valores a confirmar" />
        </div>
      )}
      {opc.length > 0 && (
        <div className="section">
          <h3>Opcionais (fora do total)</h3>
          <ul className="gastos list">
            {opc.map((g, i) => (
              <LinhaGasto key={i} g={g} />
            ))}
          </ul>
        </div>
      )}
      <p className="fine">
        Previsão estimada para duas pessoas. Hotéis: diária do Booking{precosEm ? ` em ${dataBr(precosEm)}` : ""} mais ~16% de impostos, a confirmar com o valor da reserva. Refeições incluem imposto e gorjeta. San Diego: hotel e evento pagos pela ADP.
      </p>
      <div className="foot">
        <span className="label">Fontes e dados</span>
        <ul>
          {D.fontes.map((f) => (
            <li key={f.url}>
              <a href={f.url} target="_blank" rel="noopener">{f.nome}</a>
            </li>
          ))}
          {D.creditos_api.map((c) => (
            <li key={c.nome}>
              {c.nome}: {c.uso}
            </li>
          ))}
        </ul>
        {D.atualizado_em && <span className="num">Atualizado em {D.atualizado_em}</span>}
      </div>
    </div>
  );
}
