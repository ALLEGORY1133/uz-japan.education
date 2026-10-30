"use client";

import type { ReactNode } from "react";

export type Operator = { name: string; role: string; phone: string; telegram: string };

function Svg({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
const PhoneIcon = ({ size = 15 }: { size?: number }) => (
  <Svg size={size}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg>
);
const TelegramIcon = ({ size = 15 }: { size?: number }) => (
  <Svg size={size}><path d="M21.5 3.5L2.5 10.8l6.2 2.3 2.3 6.4 3.2-4.2 5.3 3.9z" /><path d="M8.7 13.1l12.8-9.6" /></Svg>
);
const HeadsetIcon = ({ size = 18 }: { size?: number }) => (
  <Svg size={size}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1z" /><path d="M17 19c0 1.5-2 2-5 2" /></Svg>
);

export const tgHref = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://t.me/${v.replace(/^@/, "")}`);
export const tgText = (v: string) => (/^https?:\/\//i.test(v) ? v.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "@") : `@${v.replace(/^@/, "")}`);

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "•";

/** Faqat admin panel footerida: aloqa operatorlari (sayt footerida ko'rsatilmaydi). */
export default function Operators({ items }: { items: Operator[] }) {
  const list = items.filter((o) => o.phone || o.telegram);
  if (!list.length) return null;
  return (
    <section className="af-ops" aria-label="Aloqa operatorlari">
      <div className="af-ops-head">
        <span className="af-ops-ic"><HeadsetIcon size={16} /></span>
        <b className="af-ops-title">Aloqa operatorlari</b>
        <small>Savol bölsa — bevosita bog’laniş</small>
      </div>
      <ul>
        {list.map((o, i) => (
          <li key={i} className="af-op">
            <span className="af-op-av" aria-hidden="true">{initials(o.name || o.role)}</span>
            <span className="af-op-body">
              <b>{o.name || "Operator"}</b>
              {o.role && <small>{o.role}</small>}
              <span className="af-op-links">
                {o.phone && <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}><PhoneIcon size={14} />{o.phone}</a>}
                {o.telegram && <a className="tg" href={tgHref(o.telegram)} target="_blank" rel="noopener noreferrer"><TelegramIcon size={14} />{tgText(o.telegram)}</a>}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
