/** Standart (rasmsiz) slayd fon dizayni: aurora + nozik to'r + bezak halqa + katta iyeroglif. Faqat CSS/SVG. */
type Theme = "sunset" | "teal" | "violet" | string;
import type { ReactNode } from "react";

/** Har bir aylanuvchi qism — alohida <svg> qatlam: brauzer uni GPU'da aylantiradi (SVG ichidagi <g> ni aylantirish har kadrda qayta chizishni talab qilardi). */
const L = ({ cls = "", children }: { cls?: string; children: ReactNode }) => (
  <svg viewBox="0 0 400 400" className={`ring-l ${cls}`}>{children}</svg>
);

const GLYPH: Record<string, string> = { sunset: "夢", teal: "学", violet: "絆" };

function Ring({ theme }: { theme: Theme }) {
  if (theme === "teal") {
    // Sakkizburchak yulduz (Markaziy Osiyo naqshi): ikkita aylantirilgan kvadrat qatlami
    const sq = (r: number, rot: number, k: string, o: number) => (
      <rect key={k} x={200 - r} y={200 - r} width={r * 2} height={r * 2} transform={`rotate(${rot} 200 200)`} fill="none" stroke="currentColor" strokeWidth="1.2" opacity={o} />
    );
    return (
      <div className="ring">
        <L cls="spin-a">{[0, 45].map((r) => sq(120, r, `a${r}`, 0.9))}{[0, 45].map((r) => sq(80, r, `c${r}`, 0.8))}</L>
        <L cls="spin-b">{[0, 45].map((r) => sq(165, r, `b${r}`, 0.5))}</L>
        <L>
        <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 9" opacity=".6" />
        <circle cx="200" cy="200" r="34" fill="currentColor" opacity=".9" />
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={i} cx={200 + 120 * Math.cos((i * Math.PI) / 4) * 1.414 * 0.7071} cy={200 + 120 * Math.sin((i * Math.PI) / 4) * 1.414 * 0.7071} r="4" fill="currentColor" />
        ))}
        </L>
      </div>
    );
  }
  if (theme === "violet") {
    return (
      <div className="ring">
        <L cls="spin-a">
          <circle cx="160" cy="200" r="110" fill="none" stroke="#7ff0de" strokeWidth="1.6" />
          <circle cx="240" cy="200" r="110" fill="none" stroke="#ff9a8a" strokeWidth="1.6" />
        </L>
        <L cls="spin-b">
          <circle cx="200" cy="200" r="170" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 9" opacity=".6" />
          <circle cx="200" cy="30" r="6" fill="#7ff0de" />
          <circle cx="200" cy="370" r="6" fill="#ff9a8a" />
        </L>
        <L><circle cx="200" cy="200" r="22" fill="currentColor" opacity=".9" /></L>
      </div>
    );
  }
  // sunset: quyosh va to'lqinli halqalar (seigaiha)
  return (
    <div className="ring">
      <L cls="sun-core"><circle cx="200" cy="200" r="64" fill="currentColor" opacity=".95" /></L>
      <L cls="spin-a">
        {[100, 132, 164, 196].map((r, i) => (
          <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeWidth="1.3" opacity={0.85 - i * 0.16} strokeDasharray={i % 2 ? "1 8" : "none"} />
        ))}
      </L>
      <L cls="spin-b">
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={i} x1="200" y1="6" x2="200" y2="30" stroke="currentColor" strokeWidth="2" opacity=".6" transform={`rotate(${i * 22.5} 200 200)`} />
        ))}
      </L>
    </div>
  );
}

export default function HeroArt({ theme }: { theme: Theme; id?: number }) {
  return (
    <div className={`slide-art aurora a-${theme}`} aria-hidden="true">
      <i className="blob b1" />
      <i className="blob b2" />
      <i className="blob b3" />
      <div className="gridfx" />
      <div className="ring-wrap">
        <Ring theme={theme} />
      </div>
      <span className="glyph jp" lang="ja">{GLYPH[theme] || "学"}</span>
    </div>
  );
}
