const petals = Array.from({ length: 12 }, (_, i) => i);

/** Kirish, parolni unutish va tiklash sahifalari uchun umumiy animatsiyali chap panel. */
export default function LoginArt() {
  return (
    <aside className="login-art" aria-hidden="true">
      <i className="la-blob b1" /><i className="la-blob b2" /><i className="la-blob b3" />
      {petals.map((i) => <span key={i} className="la-petal" style={{ ["--i" as string]: i }} />)}
      <div className="login-art-in">
        <span className="login-mark">UzJapan</span>
        <h2>{"Özbekiston va Yaponiya universitetlarini boğlaymiz".split(" ").map((w, i) => <span className="la-w" key={i} style={{ ["--w" as string]: i }}>{w} </span>)}</h2>
        <p>Qabul sahifalari, rasm va videolar, yangiliklar va arizalar — bitta panelda.</p>
      </div>
      <div className="la-stage">
        <div className="la-sun"><i /><i /><i /></div>
        <div className="la-bridgebox">
          <svg className="la-bridge" viewBox="0 0 520 160" fill="none">
            <path d="M70 120 C 170 10, 350 10, 450 120" stroke="rgba(255,255,255,.45)" strokeWidth="2" strokeDasharray="6 8" />
            <circle r="6" fill="#fff"><animateMotion dur="4.5s" repeatCount="indefinite" path="M70 120 C 170 10, 350 10, 450 120" /></circle>
            <circle r="14" fill="rgba(255,255,255,.25)"><animateMotion dur="4.5s" repeatCount="indefinite" path="M70 120 C 170 10, 350 10, 450 120" /></circle>
          </svg>
          <span className="la-node n1">UZ</span>
          <span className="la-node n2">JP</span>
        </div>
        <span className="la-chip c1">🎓 Arizalar</span>
        <span className="la-chip c2">🖼 Media</span>
        <span className="la-chip c3">📊 KPI</span>
      </div>
    </aside>
  );
}
