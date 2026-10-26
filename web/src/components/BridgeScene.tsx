/** O‘zbekiston–Yaponiya manzarasi: fotorealistik fon (/images/bridge.jpg) + jonli effektlar. Yozuvlar tilga qarab props orqali keladi. */
import type { ReactNode } from "react";
type Props = { uz: string; jp: string; items: [string, string, string, string]; title?: string };

const PETALS = [
  { l: 6, d: 0, t: 9, s: 7 }, { l: 18, d: -3, t: 11, s: 5 }, { l: 30, d: -6, t: 10, s: 6 }, { l: 44, d: -2, t: 12, s: 5 },
  { l: 58, d: -7, t: 9, s: 7 }, { l: 70, d: -4, t: 11, s: 5 }, { l: 82, d: -1, t: 10, s: 6 }, { l: 92, d: -8, t: 12, s: 5 },
];

const ICONS: Record<number, ReactNode> = {
  0: <path d="M3 9l9-4 9 4-9 4-9-4zm4 3v4c2 2 8 2 10 0v-4" />,
  1: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16" /></>,
  2: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.4" /><path d="M3 19c0-4 12-4 12 0M14 18c0-3 7-3 7 0" /></>,
  3: <path d="M4 18l5-6 4 3 7-9M15 6h5v5" />,
};

export default function BridgeScene({ uz, jp, items }: Props) {
  return (
    <div className="bs" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bs-img" src="/images/bridge.jpg" alt="" width={1200} height={541} loading="lazy" decoding="async" />
      <i className="bs-sunglow" />
      <i className="bs-sweep" />
      {PETALS.map((p, i) => <i key={i} className="bs-petal" style={{ left: `${p.l}%`, width: p.s, height: p.s, animationDuration: `${p.t}s`, animationDelay: `${p.d}s` }} />)}
      <span className="bs-pill p1"><svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>{uz}</span>
      <span className="bs-pill p2"><svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>{jp}</span>
      <ul className="bs-items">
        {items.map((t, i) => (
          <li key={i}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[i]}</svg>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
