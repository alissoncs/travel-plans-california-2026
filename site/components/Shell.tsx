"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Ico, Sprite } from "./Icones";
import MapaPainel from "./Mapa";
import { useViagem } from "./Viagem";
import { ABAS, focoDaRota, hrefAba, rotaDe } from "@/lib/rotas";

export default function Shell({ children }: { children: React.ReactNode }) {
  const { D, plano, setPlano, pronto } = useViagem();
  const rota = rotaDe(usePathname(), D);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const f = () => setRolou(window.scrollY > 4);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const foco = focoDaRota(rota);
  const titulo = rota.voltar ? rota.titulo : rota.pagina === "inicio" ? D.viagem.titulo : rota.titulo;

  return (
    <div className={rota.pagina === "mapa" ? "app modo-mapa" : "app"} data-pronto={pronto ? "" : undefined}>
      <Sprite />
      <header className={rolou ? "appbar scrolled" : "appbar"}>
        <div className="wrap">
          {rota.voltar && (
            <Link className="back" href={rota.voltar} aria-label="Voltar">
              <Ico n="back" />
            </Link>
          )}
          <h1 className={rota.voltar ? "" : "page-title"}>{titulo}</h1>
          <span className="spacer" />
          <nav className="topnav" aria-label="Seções">
            {ABAS.map(([k, n]) => (
              <Link key={k} href={hrefAba(k)} aria-current={rota.aba === k ? "page" : undefined}>
                {n}
              </Link>
            ))}
          </nav>
          <div className="seg" role="group" aria-label="Plano">
            {Object.keys(D.planos).map((k) => (
              <button key={k} type="button" aria-pressed={k === plano} onClick={() => setPlano(k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="shell">
        <main className="wrap">{children}</main>
        <aside className="map-panel" aria-label="Mapa da viagem">
          <MapaPainel rota={rota} />
        </aside>
      </div>
      <Link className="map-fab" href={foco ? `/mapa/${foco}` : "/mapa"}>
        <Ico n="lugares" /> Mapa
      </Link>
      <nav className="tabbar" aria-label="Seções">
        <div className="wrap">
          {ABAS.map(([k, n, i]) => (
            <Link key={k} href={hrefAba(k)} aria-current={rota.aba === k ? "page" : undefined}>
              <Ico n={i} />
              <span>{n}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
