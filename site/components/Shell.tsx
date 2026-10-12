"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, Sprite } from "./Icons";
import TripMap from "./map/TripMap";
import { useTrip } from "./TripProvider";
import { focusOf, hrefs, routeOf, TABS } from "@/lib/routes";

export default function Shell({ children }: { children: React.ReactNode }) {
  const { itinerary, plan, setPlan, ready } = useTrip();
  const route = routeOf(usePathname(), itinerary);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const title = route.page === "home" ? itinerary.viagem.titulo : route.title;

  return (
    <div className={route.page === "map" ? "app map-mode" : "app"} data-ready={ready ? "" : undefined}>
      <Sprite />
      <header className={scrolled ? "appbar scrolled" : "appbar"}>
        <div className="wrap">
          {route.back && (
            <Link className="back" href={route.back} aria-label="Voltar">
              <Icon name="back" />
            </Link>
          )}
          <h1 className={route.back ? "" : "page-title"}>{title}</h1>
          <span className="spacer" />
          <nav className="topnav" aria-label="Seções">
            {TABS.map((tab) => (
              <Link key={tab.page} href={tab.href} aria-current={route.tab === tab.page ? "page" : undefined}>
                {tab.label}
              </Link>
            ))}
          </nav>
          {Object.keys(itinerary.planos).length > 1 && (
            <div className="seg" role="group" aria-label="Plano">
              {Object.keys(itinerary.planos).map((id) => (
                <button key={id} type="button" aria-pressed={id === plan} onClick={() => setPlan(id)}>
                  {id}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="shell">
        <main className="wrap">{children}</main>
        <aside className="map-panel" aria-label="Mapa da viagem">
          <TripMap route={route} />
        </aside>
      </div>
      <Link className="map-fab" href={hrefs.map(focusOf(route))}>
        <Icon name="lugares" /> Mapa
      </Link>
      <nav className="tabbar" aria-label="Seções">
        <div className="wrap">
          {TABS.map((tab) => (
            <Link key={tab.page} href={tab.href} aria-current={route.tab === tab.page ? "page" : undefined}>
              <Icon name={tab.icon} />
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
