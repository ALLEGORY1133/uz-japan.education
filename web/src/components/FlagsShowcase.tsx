type Props = { labelUz: string; labelJp: string; capUz?: string; capJp?: string; jpUz?: string; jpJp?: string };

const STRIPS = 80;

function star(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.382 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Bayroq matoni: vertikal chiziqlarga bo'linib, har biri to'lqin fazasida siljiydi (silliq mato, sinmaydigan chekka). */
function Cloth({ id, w, h, children }: { id: string; w: number; h: number; children: React.ReactNode }) {
  const sw = w / STRIPS;
  return (
    <svg viewBox={`-6 -10 ${w + 12} ${h + 20}`} className="fl-svg" aria-hidden="true" shapeRendering="geometricPrecision">
      <defs>
        <g id={`art-${id}`}>{children}</g>
        {Array.from({ length: STRIPS }).map((_, i) => (
          <clipPath id={`c-${id}-${i}`} key={i}>
            <rect x={i * sw - 0.35} y="-12" width={sw + 0.9} height={h + 24} />
          </clipPath>
        ))}
      </defs>
      {Array.from({ length: STRIPS }).map((_, i) => {
        const t = i / (STRIPS - 1);
        const amp = 0.25 + t * 3.2; // ustun tomonida kam, erkin chetda ko'p
        return (
          <g
            key={i}
            className="fl-strip"
            style={{ ["--a" as any]: `${amp.toFixed(2)}px`, animationDelay: `${(-i * 0.047).toFixed(3)}s` }}
          >
            <g clipPath={`url(#c-${id}-${i})`}>
              <use href={`#art-${id}`} />
              <rect x={i * sw - 0.2} y="0" width={sw + 0.5} height={h} fill="#0b0d2a" className="fl-shade" style={{ animationDelay: `${(-i * 0.047 - 0.65).toFixed(3)}s` }} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/** O'zbekiston davlat bayrog'i (2:1): ko'k, oq, yashil, qizil ingichka chiziqlar, yarim oy va 12 yulduz. */
function FlagUz() {
  const stars: { x: number; y: number }[] = [];
  const rows = [3, 4, 5];
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i++) stars.push({ x: 46 + (5 - n) * 4.2 + i * 8.4, y: 7.5 + r * 7.6 });
  });
  return (
    <>
      <rect width="200" height="100" fill="#fff" />
      <rect width="200" height="33.4" fill="#0099B5" />
      <rect y="66.6" width="200" height="33.4" fill="#1EB53A" />
      <rect y="32.2" width="200" height="2.4" fill="#CE1126" />
      <rect y="65.4" width="200" height="2.4" fill="#CE1126" />
      <mask id="uz-moon">
        <rect width="200" height="100" fill="#fff" />
        <circle cx="31" cy="16.6" r="9.2" fill="#000" />
      </mask>
      <circle cx="27.4" cy="16.6" r="11.2" fill="#fff" mask="url(#uz-moon)" />
      {stars.map((s, i) => <polygon key={i} points={star(s.x, s.y, 2.7)} fill="#fff" />)}
    </>
  );
}

/** Yaponiya bayrog'i Nisshōki (3:2): oq fon, markazda qizil doira (balandlikning 3/5 qismi). */
function FlagJp() {
  return (
    <>
      <rect width="150" height="100" fill="#fff" />
      <circle cx="75" cy="50" r="30" fill="#BC002D" />
    </>
  );
}

export default function FlagsShowcase({ labelUz, labelJp, capUz = "Toshkent", capJp = "Tokio", jpUz = "ウズベキスタン", jpJp = "日本" }: Props) {
  return (
    <div className="flags" role="img" aria-label={`${labelUz} – ${labelJp}`}>
      <div className="fl-bg" aria-hidden="true"><i /><i /><i /></div>

      <figure className="fl fl-uz">
        <div className="fl-stage" style={{ aspectRatio: "212 / 120" }}>
          <div className="fl-cloth"><Cloth id="uz" w={200} h={100}><FlagUz /></Cloth></div>
        </div>
        <figcaption>
          <b>{labelUz}</b>
          <small>{capUz} · <span className="jp" lang="ja">{jpUz}</span></small>
        </figcaption>
      </figure>

      <div className="fl-link" aria-hidden="true">
        <svg viewBox="0 0 200 60" preserveAspectRatio="none">
          <path d="M4 50 Q100 -20 196 50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" className="fl-dash" />
          <circle r="4.5" fill="currentColor">
            <animateMotion dur="4.5s" repeatCount="indefinite" path="M4 50 Q100 -20 196 50" />
          </circle>
        </svg>
        <span className="fl-heart">♥</span>
      </div>

      <figure className="fl fl-jp">
        <div className="fl-stage" style={{ aspectRatio: "162 / 120" }}>
          <div className="fl-cloth"><Cloth id="jp" w={150} h={100}><FlagJp /></Cloth></div>
        </div>
        <figcaption>
          <b>{labelJp}</b>
          <small>{capJp} · <span className="jp" lang="ja">{jpJp}</span></small>
        </figcaption>
      </figure>
    </div>
  );
}
