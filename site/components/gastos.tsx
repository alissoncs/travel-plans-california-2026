"use client";
import { useViagem } from "./Viagem";
import { usd } from "@/lib/format";
import { CAT, STATUS } from "@/lib/rotulos";
import type { Atividade, Dia, Gasto } from "@/lib/types";

export function CustoAtiv({ d, a }: { d: Dia; a: Atividade }) {
  const { gastosDoDia, soma } = useViagem();
  const gs = gastosDoDia(d).filter((g) => g.atividade === a.titulo);
  if (!gs.length) return null;
  if (gs.every((g) => g.status === "opcional")) return <span className="custo opc num">opcional · {usd(gs.reduce((n, g) => n + g.usd, 0))}</span>;
  const v = soma(gs);
  const aprox = gs.some((g) => g.status !== "confirmado") ? "≈ " : "";
  return <span className="custo num">{v ? aprox + usd(v) : "incluído"}</span>;
}

export function LinhaGasto({ g }: { g: Gasto }) {
  return (
    <li>
      <span className="txt">
        <span className="t">{g.item}</span>
        <span className="s">
          {CAT[g.categoria] || g.categoria} · {STATUS[g.status] || g.status}
        </span>
      </span>
      <b className={`num${g.status === "opcional" ? " opc" : ""}`}>{g.usd ? usd(g.usd) : g.status === "verificar" ? "a definir" : "incluído"}</b>
    </li>
  );
}

export function ListaGastos({ lista, rotulo }: { lista: Gasto[]; rotulo: string }) {
  const { soma } = useViagem();
  return (
    <ul className="gastos list">
      {lista.map((g, i) => (
        <LinhaGasto key={i} g={g} />
      ))}
      <li className="tot">
        <span>{rotulo}</span>
        <b className="num">{usd(soma(lista))}</b>
      </li>
    </ul>
  );
}
