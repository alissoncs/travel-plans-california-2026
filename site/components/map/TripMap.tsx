"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createMap } from "./createMap";
import { drawLayers } from "./drawLayers";
import { focusMap } from "./focusMap";
import { DEFAULT_LAYERS, LAYERS, type MapHandle } from "./leaflet";
import { useTrip } from "../TripProvider";
import { STORAGE_KEYS, useStored } from "@/lib/storage";
import type { Route } from "@/lib/routes";
import type { DayRoutes } from "@/lib/types";

const loadRoutes = async () => (await import("@/data/rotas.json")).default as unknown as DayRoutes;

export default function TripMap({ route }: { route: Route }) {
  const trip = useTrip();
  const router = useRouter();
  const element = useRef<HTMLDivElement>(null);
  const handle = useRef<MapHandle | null>(null);
  const routes = useRef<DayRoutes>({});
  const [created, setCreated] = useState(false);
  const [drawn, setDrawn] = useState(0);
  const [visible, setVisible] = useStored<Record<string, boolean>>(STORAGE_KEYS.mapLayers, DEFAULT_LAYERS);

  // O Leaflet usa window, então só carrega no navegador.
  useEffect(() => {
    const abort = new AbortController();
    let destroy = () => {};
    Promise.all([createMap(element.current!, router.push, abort.signal), loadRoutes()]).then(([map, loadedRoutes]) => {
      if (!map) return;
      if (abort.signal.aborted) return map.destroy();
      handle.current = map.handle;
      routes.current = loadedRoutes;
      destroy = map.destroy;
      setCreated(true);
    });
    return () => {
      abort.abort();
      destroy();
      handle.current = null;
      setCreated(false);
      setDrawn(0);
    };
  }, [router]);

  useEffect(() => {
    if (!created || !handle.current) return;
    drawLayers(handle.current, trip, routes.current, router.push);
    setDrawn((count) => count + 1);
  }, [created, trip.plan, router]);

  useEffect(() => {
    if (!drawn || !handle.current) return;
    const { map, layers } = handle.current;
    for (const { id } of LAYERS) {
      if (visible[id]) layers[id].addTo(map);
      else layers[id].remove();
    }
  }, [drawn, visible]);

  // Depois de o painel aparecer (página /mapa ou tela larga) o Leaflet precisa medir o contêiner de novo.
  useEffect(() => {
    if (!drawn || !handle.current) return;
    const current = handle.current;
    const timer = setTimeout(() => {
      if (!element.current?.offsetWidth) return;
      current.map.invalidateSize();
      focusMap(current, trip, route);
    }, 0);
    return () => clearTimeout(timer);
  }, [drawn, route.page, route.arg]);

  return (
    <>
      <div className="map-canvas" ref={element} />
      <div className="map-layers">
        {LAYERS.map(({ id, label, color }) => (
          <button key={id} type="button" aria-pressed={!!visible[id]} onClick={() => setVisible((prev) => ({ ...prev, [id]: !prev[id] }))}>
            <i style={{ background: `var(${color})` }} />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
