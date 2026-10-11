"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icons";
import { useTrip } from "./TripProvider";
import { scrollBehavior } from "@/lib/env";
import { searchQuery, withoutPrefix } from "@/lib/format";
import { GUIDE_SECTIONS } from "@/lib/labels";
import type { Guide, GuideItem } from "@/lib/types";
import { Actions } from "./Cards";

function SourceBadge({ id, time }: { id: string; time?: number }) {
  const { guides } = useTrip();
  const source = guides.fontes[id];
  if (!source || source.tipo !== "youtube") return null;
  const timestamp = time ? ` · ${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}` : "";
  const label = (
    <>
      <Icon name="video" /> {source.canal}
      {timestamp}
    </>
  );
  if (!source.url) return <Link className="badge-src" href="/videos">{label}</Link>;
  const href = source.url + (time ? (source.url.includes("?") ? "&" : "?") + "t=" + time : "");
  return <a className="badge-src" href={href} target="_blank" rel="noopener">{label}</a>;
}

export function TipItem({ item }: { item: GuideItem }) {
  const hasPlace = !!(item.onde || item.maps);
  const sources = (item.fontes ?? []).map((id) => <SourceBadge key={id} id={id} time={item.tempos?.[id]} />);
  return (
    <li className={hasPlace ? "with-actions" : undefined}>
      {hasPlace && <Actions query={searchQuery(item)} name={withoutPrefix(item.nome)} />}
      <h4>
        {item.nome} {item.stats && <span className="meta num">{item.stats}</span>}
      </h4>
      <p>{item.texto}</p>
      {(item.onde || item.verificar || item.url || sources.length > 0) && (
        <div className="tip-meta">
          {item.onde && (
            <span className="where">
              <Icon name="pin" /> {item.onde}
            </span>
          )}
          {item.url && <a href={item.url} target="_blank" rel="noopener">Site</a>}
          {item.verificar && (
            <span className="badge-warn">
              <Icon name="alerta" /> {typeof item.verificar === "string" ? item.verificar : "Verificar"}
            </span>
          )}
          {sources}
        </div>
      )}
    </li>
  );
}

export interface PostSection {
  id: string;
  title: string;
  icon: string;
  content: ReactNode;
}

export function postSections(guide: Guide | undefined, leading: PostSection[] = []): PostSection[] {
  const fromGuide = (guide?.secoes ?? [])
    .filter((section) => section.itens?.length)
    .map((section, index) => ({
      id: `sec-${section.tipo}-${index}`,
      title: section.titulo || GUIDE_SECTIONS[section.tipo]?.title || "",
      icon: GUIDE_SECTIONS[section.tipo]?.icon ?? "fazer",
      content: <ul className="tips list">{section.itens.map((item, i) => <TipItem key={i} item={item} />)}</ul>,
    }));
  return [...leading, ...fromGuide];
}

export function SectionIndex({ sections }: { sections: PostSection[] }) {
  if (sections.length < 2) return null;
  return (
    <nav className="toc" aria-label="Neste post">
      <span>Neste post</span>
      {sections.map((section) => (
        <button key={section.id} type="button" onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: scrollBehavior() })}>
          <Icon name={section.icon} /> {section.title}
        </button>
      ))}
    </nav>
  );
}

export function SectionBody({ sections }: { sections: PostSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} className="section post-sec" id={section.id}>
          <h3>
            <Icon name={section.icon} /> {section.title}
          </h3>
          {section.content}
        </section>
      ))}
    </>
  );
}

export function GuideIntro({ guide }: { guide?: Guide }) {
  if (!guide?.intro?.length) return null;
  return (
    <div className="prose">
      {guide.intro.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}
