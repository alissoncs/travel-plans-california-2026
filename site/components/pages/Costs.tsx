"use client";
import Link from "next/link";
import { ExpenseList, ExpenseRow } from "../ExpenseList";
import { useTrip } from "../TripProvider";
import { brDate, brl, dayMonthNumeric, usd, whenOf } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/labels";
import { hrefs } from "@/lib/routes";

export default function Costs() {
  const { itinerary, plan, days, expenses, expensesOfDay, totalOf } = useTrip();
  const budget = itinerary.orcamento;
  if (!budget) return null;
  const { teto_usd: ceiling, inicio, fim } = itinerary.viagem;
  const total = totalOf(expenses);
  const ofCategory = (category: string) => expenses.filter((e) => e.categoria === category);
  const highlights = [
    { label: "Hotéis", value: totalOf(ofCategory("hospedagem")), note: `${ofCategory("hospedagem").filter((e) => e.usd > 0).length} noites` },
    { label: "Aluguel do carro", value: totalOf(ofCategory("carro")), note: "com impostos" },
    { label: "Gasolina", value: totalOf(ofCategory("gasolina")), note: "estimativa" },
  ];
  const byCategory = Object.entries(
    expenses.filter((e) => e.status !== "opcional").reduce<Record<string, number>>((sums, e) => ({ ...sums, [e.categoria]: (sums[e.categoria] ?? 0) + e.usd }), {}),
  )
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
  const largest = Math.max(...byCategory.map(([, value]) => value));
  const toConfirm = expenses.filter((e) => e.status === "verificar");
  const optional = expenses.filter((e) => e.status === "opcional");
  const pricesDate = itinerary.hospedagens.find((l) => l.precos_em)?.precos_em;

  return (
    <div className="view">
      <div className="page-head">
        <span className="label">
          {itinerary.planos[plan].nome} · {dayMonthNumeric(inicio)} a {dayMonthNumeric(fim)}
        </span>
        <h2>Gastos</h2>
      </div>
      <div className="card total">
        <span className="muted small">Total previsto para o casal</span>
        <b className="num">{usd(total)}</b>
        <span className="muted num">
          ≈ {brl(total * budget.taxa_brl)} · câmbio R$ {budget.taxa_brl.toLocaleString("pt-BR")}
        </span>
        {ceiling && (
          <>
            <div className="occupancy-bar" style={{ marginTop: 6 }}>
              <i style={{ width: `${Math.min(100, (total / ceiling) * 100)}%`, ...(total > ceiling ? { background: "var(--urgente)" } : {}) }} />
            </div>
            <span className="small num" style={{ color: total > ceiling ? "var(--urgente)" : "var(--accent)" }}>
              {total > ceiling ? `Passa ${usd(total - ceiling)} do teto de ${usd(ceiling)}` : `Dentro do teto de ${usd(ceiling)} · sobram ${usd(ceiling - total)}`}
            </span>
          </>
        )}
      </div>
      <div className="stats">
        {highlights.map(({ label, value, note }) => (
          <div key={label} className="stat">
            <span>{label}</span>
            <b className="num" style={{ fontSize: 20 }}>{usd(value)}</b>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ fontSize: 17 }}>Por categoria</h3>
        <div className="bars">
          {byCategory.map(([category, value]) => (
            <div key={category} className="bar-row">
              <div>
                <span>{EXPENSE_CATEGORIES[category] ?? category}</span>
                <b className="num">{usd(value)}</b>
              </div>
              <div className="track">
                <i style={{ width: `${(value / largest) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <h3>Por dia</h3>
        <ul className="expenses list">
          {days.map((day) => {
            const spent = totalOf(expensesOfDay(day));
            return (
              <li key={day.id}>
                <Link href={hrefs.day(day.id)}>
                  <span className="txt">
                    <span className="t">
                      Dia {day.rotulo} · {day.titulo}
                    </span>
                    <span className="s num">{whenOf(day)}</span>
                  </span>
                  <b className="num">{spent ? usd(spent) : "—"}</b>
                </Link>
              </li>
            );
          })}
          <li className="expenses-total">
            <span>Total</span>
            <b className="num">{usd(total)}</b>
          </li>
        </ul>
      </div>
      {toConfirm.length > 0 && (
        <div className="section">
          <h3>A confirmar</h3>
          <ExpenseList expenses={toConfirm} totalLabel="Soma dos valores a confirmar" />
        </div>
      )}
      {optional.length > 0 && (
        <div className="section">
          <h3>Opcionais (fora do total)</h3>
          <ul className="expenses list">
            {optional.map((expense, i) => (
              <ExpenseRow key={i} expense={expense} />
            ))}
          </ul>
        </div>
      )}
      <p className="fine">
        Previsão estimada para duas pessoas. Hotéis: diária do Booking{pricesDate ? ` em ${brDate(pricesDate)}` : ""} mais ~16% de impostos, a confirmar com o valor da reserva. Refeições incluem imposto e gorjeta. San Diego: hotel e evento pagos pela ADP.
      </p>
      <div className="foot">
        <span className="label">Fontes e dados</span>
        <ul>
          {itinerary.fontes.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener">{source.nome}</a>
            </li>
          ))}
          {itinerary.creditos_api.map((credit) => (
            <li key={credit.nome}>
              {credit.nome}: {credit.uso}
            </li>
          ))}
        </ul>
        {itinerary.atualizado_em && <span className="num">Atualizado em {itinerary.atualizado_em}</span>}
      </div>
    </div>
  );
}
