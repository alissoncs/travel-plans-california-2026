"use client";
import { useViagem } from "../Viagem";
import { useSalvo } from "@/lib/store";

const PRIO: [string, string, string][] = [
  ["urgente", "Fazer já", "var(--urgente)"],
  ["importante", "Esta semana", "var(--aviso)"],
  ["antes", "Antes de viajar", "var(--info)"],
  ["feito", "Feito", "var(--muted)"],
];

export default function Reservas() {
  const { D, plano } = useViagem();
  const [feitos, setFeitos] = useSalvo<Record<string, boolean>>("reservas-feitas", {});
  const itens = D.reservas.filter((r) => !r.planos || r.planos.includes(plano));
  const ok = itens.filter((r) => r.prioridade === "feito" || feitos[r.id]).length;
  return (
    <div className="view">
      <div className="page-head">
        <span className="label num">
          {ok} de {itens.length} resolvidos
        </span>
        <h2>Reservas</h2>
      </div>
      <div className="progress">
        <i style={{ width: `${(ok / itens.length) * 100}%` }} />
      </div>
      {PRIO.map(([k, nome, cor]) => {
        const g = itens.filter((r) => r.prioridade === k);
        return g.length ? (
          <div key={k} className="section">
            <h3>
              <span className="dot" style={{ background: cor }} />
              {nome}
            </h3>
            <ul className="check list">
              {g.map((r) => {
                const done = k === "feito" || feitos[r.id];
                return (
                  <li key={r.id} className={done ? "done" : ""}>
                    <label htmlFor={`r-${r.id}`}>
                      <input
                        type="checkbox"
                        id={`r-${r.id}`}
                        checked={!!done}
                        disabled={k === "feito"}
                        onChange={(e) => setFeitos((f) => ({ ...f, [r.id]: e.target.checked }))}
                      />
                      <span className="txt">
                        <strong>{r.item}</strong>
                        <span>{r.detalhe}</span>
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener" className="small">
                            Abrir site
                          </a>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null;
      })}
      <p className="fine">As marcações ficam salvas apenas neste navegador.</p>
    </div>
  );
}
