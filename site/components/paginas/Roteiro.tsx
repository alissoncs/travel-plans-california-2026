"use client";
import { LinhaDia } from "../comuns";
import { useViagem } from "../Viagem";
import { diaMes } from "@/lib/format";

export default function Roteiro() {
  const { D, plano, diasDoPlano } = useViagem();
  const dias = diasDoPlano();
  return (
    <div className="view">
      <div className="page-head">
        <span className="label">{D.planos[plano].nome}</span>
        <h2>Roteiro</h2>
      </div>
      {D.fases.map((f) => {
        const ds = dias.filter((d) => d.fase === f.id);
        return ds.length ? (
          <div key={f.id} className="section">
            <div className="section-head">
              <h3>{f.nome}</h3>
              <span className="muted small num">
                {diaMes(f.inicio)} – {diaMes(f.fim)}
              </span>
            </div>
            <div className="list">
              {ds.map((d) => (
                <LinhaDia key={d.id} d={d} />
              ))}
            </div>
          </div>
        ) : null;
      })}
    </div>
  );
}
