"use client";

import { ReactNode, useMemo, useState } from "react";
import Icon from "@/components/Icon";

export type PanelItem = { id: string | number; label: string; sub?: string; thumb?: string | null };

/** Qo'shimcha rasm/video bo'limi uchun yagona dizayn: sarlavha + 1-2 bosqich + rasmli tanlov kartalari. */
export default function MediaPanel({
  icon = "media", title, hint, pickLabel, items, children,
}: {
  icon?: string; title: string; hint: string; pickLabel: string; items: PanelItem[];
  children: (selected: PanelItem) => ReactNode;
}) {
  const [sel, setSel] = useState<PanelItem | null>(null);
  const [q, setQ] = useState("");
  const shown = useMemo(() => items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase())), [items, q]);

  return (
    <section className="mp">
      <header className="mp-head">
        <i className="mp-orb o1" aria-hidden="true" /><i className="mp-orb o2" aria-hidden="true" /><i className="mp-orb o3" aria-hidden="true" />
        <span className="mp-ico"><Icon name={icon} size={28} /></span>
        <div className="mp-htxt">
          <span className="mp-badge">Media yuklaş</span>
          <h2>{title}</h2>
          <p>{hint}</p>
        </div>
        <div className="mp-stat"><b>{items.length}</b><small>ta bölim</small></div>
      </header>
      <div className="mp-rail" aria-hidden="true">
        <span className={sel ? "done" : "now"}><i>{sel ? "✓" : "1"}</i>Tanlang</span>
        <em className={sel ? "full" : ""} />
        <span className={sel ? "now" : ""}><i>2</i>Yuklang</span>
      </div>

      <div className="mp-step">
        <span className={`mp-num${sel ? " done" : ""}`}>{sel ? "✓" : "1"}</span>
        <b>{pickLabel}</b>
        {items.length > 6 && <input className="mp-search" placeholder="Qidiriş…" value={q} onChange={(e) => setQ(e.target.value)} />}
      </div>

      {items.length === 0 ? (
        <p className="mp-empty">Hali heç narsa yöq — avval yuqorida qöşing.</p>
      ) : (
        <div className="mp-cards">
          {shown.map((i, n) => (
            <button
              type="button" key={i.id} style={{ animationDelay: `${Math.min(n, 12) * 40}ms` }}
              className={`mp-card${sel?.id === i.id ? " on" : ""}`} onClick={() => setSel(sel?.id === i.id ? null : i)}
            >
              <span className="mp-thumb" style={i.thumb ? { backgroundImage: `url(${i.thumb})` } : undefined}>
                {!i.thumb && <Icon name="hero" size={22} />}
              </span>
              <span className="mp-txt"><b>{i.label}</b>{i.sub && <small>{i.sub}</small>}</span>
              <span className="mp-tick">✓</span>
            </button>
          ))}
          {shown.length === 0 && <p className="mp-empty">Heç narsa topilmadi.</p>}
        </div>
      )}

      <div className="mp-step">
        <span className={`mp-num${sel ? " active" : " off"}`}>2</span>
        <b>{sel ? <>“{sel.label}” uchun fayllar</> : "Fayllarni yuklang"}</b>
      </div>
      {sel ? <div className="mp-body" key={sel.id}>{children(sel)}</div> : (
        <div className="mp-locked"><Icon name="stack" size={22} /><span>Avval yuqoridan tanlang — şundan keyin fayl yuklaş oçiladi.</span></div>
      )}
    </section>
  );
}
