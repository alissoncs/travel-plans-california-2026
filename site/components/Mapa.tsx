"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { useViagem } from "./Viagem";
import { gmaps, minutos, quando, src, usd } from "@/lib/format";
import { buscaDe } from "./comuns";
import { SECOES } from "@/lib/rotulos";
import { useSalvo } from "@/lib/store";
import type { Rota } from "@/lib/rotas";
import type { Coord, Rotas } from "@/lib/types";

type L = typeof Leaflet;
type Modo = "carro" | "bike" | "balsa";
type Estado = "normal" | "ativo" | "apagado";

const CAMADAS: [string, string, string][] = [
  ["rota", "Rota", "--accent"],
  ["dias", "Dias", "--ink"],
  ["lugares", "Lugares", "--accent"],
  ["dicas", "Dicas", "--muted"],
  ["comida", "Café e comida", "--food"],
  ["hoteis", "Hotéis", "--hotel"],
];
const PADRAO_CAMADAS: Record<string, boolean> = { rota: true, dias: true, lugares: true, dicas: false, comida: true, hoteis: true };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const cor = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const animar = () => !matchMedia("(prefers-reduced-motion: reduce)").matches;
const largo = () => matchMedia("(min-width: 1100px)").matches;
const svg = (n: string) => `<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;

function estilo(modo: Modo, estado: Estado): Leaflet.PathOptions {
  const base: Leaflet.PathOptions =
    modo === "balsa" ? { color: cor("--info"), weight: 3, dashArray: "6 8" }
    : modo === "bike" ? { color: cor("--warm"), weight: 3, dashArray: "2 7" }
    : { color: cor("--accent"), weight: 4 };
  if (estado === "ativo") return { ...base, color: modo === "carro" ? cor("--warm") : base.color, weight: (base.weight || 3) + 2, opacity: 1 };
  if (estado === "apagado") return { ...base, opacity: 0.3 };
  return { ...base, opacity: 0.85 };
}

interface Pop {
  titulo: string;
  sub?: string;
  imagem?: string;
  href?: string;
  gm: string;
}
function popup({ titulo, sub, imagem, href, gm }: Pop) {
  return `<div class="pop">${imagem ? `<img src="${esc(src(imagem))}" alt="">` : ""}<b>${esc(titulo)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}
    <div class="pop-links">${href ? `<a href="${esc(href)}" data-nav>Abrir página</a>` : ""}<a href="${esc(gm)}" target="_blank" rel="noopener">Google Maps</a></div></div>`;
}

export default function MapaPainel({ rota }: { rota: Rota }) {
  const v = useViagem();
  const { D, G, plano, diasDoPlano, lugaresDoPlano, img } = v;
  const router = useRouter();
  const elRef = useRef<HTMLDivElement>(null);
  const ref = useRef<{
    L: L;
    M: Leaflet.Map;
    camadas: Record<string, Leaflet.LayerGroup>;
    linhas: Record<string, Leaflet.Polyline[]>;
    marcadores: Record<string, Leaflet.Marker>;
  } | null>(null);
  const [montado, setMontado] = useState(false);
  const [desenhado, setDesenhado] = useState(0);
  const [rotas, setRotas] = useState<Rotas | null>(null);
  const [visiveis, setVisiveis] = useSalvo<Record<string, boolean>>("mapa-camadas", PADRAO_CAMADAS);

  // O Leaflet usa window, então carrega só no navegador.
  useEffect(() => {
    let cancelado = false;
    let limpar = () => {};
    (async () => {
      const Lf = (await import("leaflet")).default as unknown as L;
      const r = (await import("@/data/rotas.json")).default as unknown as Rotas;
      if (cancelado || !elRef.current) return;
      const M = Lf.map(elRef.current, { zoomControl: false, zoomSnap: 0.5 });
      Lf.control.zoom({ position: "bottomright" }).addTo(M);
      M.attributionControl.setPrefix(false);
      const raiz = document.documentElement.dataset.theme;
      const escuro = raiz === "dark" || (raiz !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
      const esri = (camada: string) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${camada}/MapServer/tile/{z}/{y}/{x}`;
      const tiles = Lf.tileLayer(esri(escuro ? "World_Dark_Gray_Base" : "World_Light_Gray_Base"), {
        maxZoom: 16,
        attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(M);
      const rotulos = Lf.tileLayer(esri(escuro ? "World_Dark_Gray_Reference" : "World_Light_Gray_Reference"), { maxZoom: 16, pane: "shadowPane" }).addTo(M);
      // Se os tiles não carregarem, troca por um contorno vetorial local.
      let carregou = false, erros = 0, trocou = false;
      const usarContorno = async () => {
        if (carregou || trocou) return;
        trocou = true;
        M.removeLayer(tiles);
        M.removeLayer(rotulos);
        try {
          const geo = (await import("@/data/mapa-base.json")).default as unknown as GeoJSON.GeoJsonObject;
          Lf.geoJSON(geo, { interactive: false, style: { color: cor("--line"), weight: 1, fillColor: cor("--land"), fillOpacity: 1 } }).addTo(M).bringToBack();
          M.attributionControl.addAttribution("Contornos: Natural Earth");
        } catch {}
      };
      tiles.on("tileload", () => { carregou = true; });
      tiles.on("tileerror", () => { if (++erros >= 3) usarContorno(); });
      const t = setTimeout(usarContorno, 5000);
      const camadas = Object.fromEntries(CAMADAS.map(([k]) => [k, Lf.layerGroup()]));
      M.setView([36.4, -119.4], 6);

      // Links "Abrir página" dos popups navegam sem recarregar. Captura antes de o Leaflet barrar o clique.
      const nav = (e: MouseEvent) => {
        const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-nav]");
        if (!a) return;
        e.preventDefault();
        router.push(a.getAttribute("href")!);
      };
      elRef.current.addEventListener("click", nav, true);

      ref.current = { L: Lf, M, camadas, linhas: {}, marcadores: {} };
      setRotas(r);
      setMontado(true);
      const el = elRef.current;
      limpar = () => {
        clearTimeout(t);
        el.removeEventListener("click", nav, true);
        M.remove();
        ref.current = null;
        setMontado(false);
        setDesenhado(0);
      };
    })();
    return () => {
      cancelado = true;
      limpar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desenha rota, pinos e hotéis do plano escolhido.
  useEffect(() => {
    const m = ref.current;
    if (!montado || !m || !rotas) return;
    const { L: Lf, camadas } = m;
    for (const k in camadas) camadas[k].clearLayers();
    m.linhas = {};
    m.marcadores = {};
    const pino = (cls: string, html = "") => Lf.divIcon({ className: "pin-host", html: `<div class="pin ${cls}">${html}</div>`, iconSize: [0, 0], popupAnchor: [0, -12] });
    const vistos = new Set<string>();
    const add = (camada: string, coord: Coord, icone: Leaflet.DivIcon, pop: Pop, chave?: string) => {
      const id = `${coord[0].toFixed(4)},${coord[1].toFixed(4)}|${pop.titulo}`;
      if (vistos.has(id)) return;
      vistos.add(id);
      const mk = Lf.marker(coord, { icon: icone, title: pop.titulo, riseOnHover: true }).bindPopup(popup(pop));
      camadas[camada].addLayer(mk);
      if (chave) m.marcadores[chave] = mk;
    };

    for (const d of diasDoPlano()) {
      for (const seg of rotas[d.id] || []) {
        const l = Lf.polyline(seg.linha, { ...estilo(seg.modo, "normal"), modo: seg.modo } as Leaflet.PolylineOptions);
        const info = [seg.modo === "balsa" ? "balsa" : seg.modo === "bike" ? "bicicleta" : null, seg.km ? `${seg.km} km` : null, seg.min ? minutos(seg.min) : null].filter(Boolean).join(" · ");
        l.bindTooltip(`Dia ${d.rotulo} · ${d.titulo}${info ? ` · ${info}` : ""}`, { sticky: true });
        l.on("click", () => router.push(largo() ? `/dia/${d.id}` : `/mapa/${d.id}`));
        camadas.rota.addLayer(l);
        (m.linhas[d.id] ||= []).push(l);
      }
      add("dias", d.coord, pino("pin-dia", esc(d.rotulo)), { titulo: `Dia ${d.rotulo} · ${d.titulo}`, sub: quando(d), imagem: img(d.capa), href: `/dia/${d.id}`, gm: gmaps(d.regiao, "California") }, `dia-${d.id}`);
      for (const s of G.dias[d.id]?.secoes || []) {
        for (const it of s.itens) {
          if (!it.coord) continue;
          const comida = s.tipo === "cafe" || s.tipo === "comer";
          add(comida ? "comida" : "dicas", it.coord, pino(comida ? "pin-comida" : "pin-dica", svg(comida ? (s.tipo === "cafe" ? "cafe" : "comida") : "fazer")),
            { titulo: it.nome, sub: `Dia ${d.rotulo} · ${SECOES[s.tipo]?.[0] || ""}`, href: `/dia/${d.id}`, gm: gmaps(buscaDe(it)) });
        }
      }
    }
    for (const l of lugaresDoPlano()) {
      if (!l.coord) continue;
      add("lugares", l.coord, pino("pin-lugar", svg([...l.tipos][0] || "pin")),
        { titulo: l.nome, sub: l.dias.map((d) => `Dia ${d.rotulo}`).join(", "), imagem: l.imagem, href: `/lugar/${l.chave}`, gm: gmaps(l.nome, "California") }, `lugar-${l.chave}`);
      for (const s of G.lugares[l.chave]?.secoes || []) {
        for (const it of s.itens) {
          if (it.coord) add("dicas", it.coord, pino("pin-dica", svg("fazer")), { titulo: it.nome, sub: l.nome, href: `/lugar/${l.chave}`, gm: it.onde || it.maps ? gmaps(buscaDe(it)) : gmaps(it.nome, l.nome) });
        }
      }
    }
    for (const h of D.hospedagens.filter((x) => x.planos.includes(plano) && x.coord)) {
      add("hoteis", h.coord!, pino("pin-hotel", svg("hotel")), { titulo: h.nome, sub: `${h.cidade} · ${h.status}`, href: "/hoteis", gm: gmaps(h.nome, h.cidade.split(" · ")[0]) });
    }
    for (const b of (D.busca_hoteis || []).filter((x) => x.planos.includes(plano))) {
      for (const o of b.opcoes || []) {
        if (o.coord) add("hoteis", o.coord, pino("pin-hotel pin-opcao", svg("hotel")), { titulo: o.nome, sub: `Opção · ${usd(o.diaria_min)} a diária`, href: "/hoteis", gm: gmaps(o.nome, b.cidade) });
      }
    }
    setDesenhado((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montado, rotas, plano, D, G]);

  // Liga e desliga as camadas.
  useEffect(() => {
    const m = ref.current;
    if (!desenhado || !m) return;
    for (const [k] of CAMADAS) (visiveis[k] ? m.camadas[k].addTo(m.M) : m.camadas[k].remove());
  }, [desenhado, visiveis]);

  // Acompanha a página aberta.
  useEffect(() => {
    const m = ref.current;
    if (!desenhado || !m) return;
    const { L: Lf, M, camadas, linhas, marcadores } = m;
    const enquadrar = (pts: Leaflet.LatLngExpression[], maxZoom = 12) => {
      if (!pts.length) return;
      const b = Lf.latLngBounds(pts);
      const opts = { padding: [48, 48] as [number, number], maxZoom };
      animar() ? M.flyToBounds(b, { ...opts, duration: 0.6 }) : M.fitBounds(b, opts);
    };
    const focar = () => {
      let alvo: { pagina: string; arg?: string } = rota;
      if (rota.pagina === "mapa") {
        const a = rota.arg;
        const dia = D.dias.find((d) => d.id === a);
        const par = dia && (dia.planos.includes(plano) ? dia : diasDoPlano().find((d) => d.rotulo === dia.rotulo));
        alvo = a.startsWith("lugar-") ? { pagina: "lugar", arg: a.slice(6) } : a === "comer" ? { pagina: "comer" } : par ? { pagina: "dia", arg: par.id } : { pagina: "inicio" };
      }
      const diaAtivo = alvo.pagina === "dia" ? alvo.arg : null;
      for (const [id, ls] of Object.entries(linhas)) {
        ls.forEach((l) => l.setStyle(estilo((l.options as { modo?: Modo }).modo || "carro", diaAtivo ? (id === diaAtivo ? "ativo" : "apagado") : "normal")));
      }
      if (diaAtivo) {
        const d = D.dias.find((x) => x.id === diaAtivo)!;
        (linhas[d.id] || []).forEach((l) => l.bringToFront());
        const pts: Leaflet.LatLngExpression[] = [
          d.coord,
          ...(linhas[d.id] || []).flatMap((l) => l.getLatLngs() as Leaflet.LatLng[]),
          ...d.atividades.map((a) => (a.lugar ? D.lugares[a.lugar]?.coord : undefined)).filter((c): c is Coord => !!c),
          ...(G.dias[d.id]?.secoes || []).flatMap((s) => s.itens.map((it) => it.coord)).filter((c): c is Coord => !!c),
        ];
        enquadrar(pts, 13);
      } else if (alvo.pagina === "lugar") {
        const c = alvo.arg ? D.lugares[alvo.arg]?.coord : undefined;
        if (c) {
          animar() ? M.flyTo(c, 13, { duration: 0.8 }) : M.setView(c, 13);
          setTimeout(() => marcadores[`lugar-${alvo.arg}`]?.openPopup(), animar() ? 850 : 0);
        }
      } else if (alvo.pagina === "comer") {
        enquadrar((camadas.comida.getLayers() as Leaflet.Marker[]).map((mk) => mk.getLatLng()));
      } else if (alvo.pagina === "hoteis") {
        enquadrar((camadas.hoteis.getLayers() as Leaflet.Marker[]).map((mk) => mk.getLatLng()));
      } else {
        enquadrar([...Object.values(linhas).flat().flatMap((l) => l.getLatLngs() as Leaflet.LatLng[]), ...(camadas.dias.getLayers() as Leaflet.Marker[]).map((mk) => mk.getLatLng())], 8);
      }
    };
    // o painel pode ter acabado de aparecer (página /mapa ou tela larga)
    const t = setTimeout(() => {
      if (!elRef.current?.offsetWidth) return;
      M.invalidateSize();
      focar();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desenhado, rota.pagina, rota.arg]);

  return (
    <>
      <div id="mapa-el" ref={elRef} />
      <div className="map-layers">
        {CAMADAS.map(([k, n, c]) => (
          <button key={k} type="button" aria-pressed={!!visiveis[k]} onClick={() => setVisiveis((a) => ({ ...a, [k]: !a[k] }))}>
            <i style={{ background: `var(${c})` }} />
            {n}
          </button>
        ))}
      </div>
    </>
  );
}
