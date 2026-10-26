"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { api, listOf } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Dash = { applications: { new: number; reviewing: number; accepted: number; rejected: number; total: number } };

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const STATUS: Record<string, string> = { new: "Yangi", reviewing: "Körib çiqilmoqda", accepted: "Qabul qilindi", rejected: "Rad etildi" };
const fmt = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("ru-RU") : "";
};

/** Raqam 0 dan qiymatgacha silliq o'sadi (harakatni kamaytirish yoqilgan bo'lsa — darhol). */
function Num({ value }: { value?: number }) {
  const [n, setN] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (value === undefined) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{value === undefined ? "—" : n}</>;
}

function Spark({ tone }: { tone: string }) {
  return (
    <svg className={`spark ${tone}`} viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 30 C20 34 28 14 48 22 S80 36 96 18 S112 12 120 8" fill="none" strokeWidth="3" strokeLinecap="round" pathLength={1} />
    </svg>
  );
}

function Fuji() {
  return (
    <svg className="fuji" viewBox="0 0 440 250" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="fj-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfe4ff" />
          <stop offset="1" stopColor="#fbe3ee" />
        </linearGradient>
      </defs>
      <rect width="440" height="250" fill="url(#fj-sky)" />
      <circle className="fj-glow" cx="262" cy="86" r="58" fill="#ff8aa0" opacity=".28" />
      <circle className="fj-sun" cx="262" cy="86" r="42" fill="#ff6f86" />
      <g className="fj-cloud c1" fill="#fff" opacity=".85"><rect x="40" y="52" width="86" height="14" rx="7" /><rect x="62" y="42" width="52" height="14" rx="7" /></g>
      <g className="fj-cloud c2" fill="#fff" opacity=".7"><rect x="300" y="36" width="70" height="12" rx="6" /><rect x="318" y="27" width="42" height="12" rx="6" /></g>
      <path d="M70 250 L215 82 L252 120 L296 96 L430 250 Z" fill="#8c9ee6" />
      <path d="M190 106 L215 82 L252 120 L236 112 L222 126 L206 110 Z" fill="#fff" />
      <ellipse cx="120" cy="246" rx="120" ry="24" fill="#c7cffa" />
      <g className="fj-torii" fill="#e14a54">
        <rect x="318" y="108" width="84" height="12" rx="6" />
        <rect x="326" y="128" width="68" height="7" rx="3" />
        <rect x="334" y="120" width="12" height="130" />
        <rect x="374" y="120" width="12" height="130" />
      </g>
      <g fill="#ff5d8a"><rect className="fj-petal p1" x="236" y="0" width="8" height="8" rx="2" /><rect className="fj-petal p2" x="284" y="0" width="8" height="8" rx="2" /><rect className="fj-petal p3" x="340" y="0" width="8" height="8" rx="2" /><rect className="fj-petal p4" x="400" y="0" width="8" height="8" rx="2" /><rect className="fj-petal p5" x="170" y="0" width="7" height="7" rx="2" /><rect className="fj-petal p6" x="120" y="0" width="7" height="7" rx="2" /></g>
    </svg>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [d, setD] = useState<Dash | null>(null);
  const [apps, setApps] = useState<any[] | null>(null);
  const [news, setNews] = useState<any[] | null>(null);
  const [health, setHealth] = useState<"loading" | "ok" | "down">("loading");

  useEffect(() => {
    api<Dash>("/dashboard/").then(setD).catch(() => {});
    api("/applications/?page=1").then((r) => setApps(listOf(r).slice(0, 5))).catch(() => setApps([]));
    if (isAdmin) api("/news/?page=1").then((r) => setNews(listOf(r).slice(0, 3))).catch(() => setNews([]));
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    fetch(`${API}/api/health/`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => setHealth(r.ok ? "ok" : "down"))
      .catch(() => setHealth("down"))
      .finally(() => clearTimeout(t));
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [isAdmin]);

  const a = d?.applications;
  const name = user?.first_name || user?.username || "";

  const stats = [
    { label: "Jami arizalar", value: a?.total, sub: a ? `Yangi: ${a.new}` : "", icon: "inbox", tone: "pink" },
    { label: "Qabul qilingan", value: a?.accepted, sub: a ? `${a.total ? Math.round((a.accepted / a.total) * 100) : 0}% arizalardan` : "", icon: "check", tone: "teal" },
    { label: "Rad etilgan", value: a?.rejected, sub: a ? `${a.total ? Math.round((a.rejected / a.total) * 100) : 0}% arizalardan` : "", icon: "clock", tone: "yellow" },
    { label: "Körib çiqilmoqda", value: a?.reviewing, sub: "Jarayonda", icon: "stack", tone: "purple" },
  ];

  const links: [string, string, string, string][] = isAdmin
    ? [
        ["/applications", "Arizalar röyxati", "Barça arizalarni köriş", "inbox"],
        ["/universities", "Universitetlar", "Universitetlar röyxati", "university"],
        ["/users", "Foydalanuvçilar", "Foydalanuvçilarni boşqariş", "users"],
        ["/news", "Kontent", "Yangiliklar va tadbirlar", "news"],
        ["/hero", "Boş sahifa slayderi", "Asosiy bannerlar", "hero"],
        ["/media", "Media kutubxonasi", "Rasm va videolar", "media"],
        ["/history", "Harakatlar tarixi", "Kim nima qilgani", "clock"],
        ["/settings", "Sozlamalar", "Aloqa va tarmoqlar", "settings"],
      ]
    : [
        [`/universities/${user?.university}`, "Mening universitetim", "Ma’lumotlarni tahrirlaş", "university"],
        ["/applications", "Arizalar", "Kelgan arizalar", "inbox"],
      ];

  return (
    <>
      <div className="dash">
        <div className="dash-main">
          <section className="welcome">
            <div className="welcome-copy">
              <h1>Xuş kelibsiz,<br /><span>{name}!</span></h1>
              <p className="welcome-sub">{isAdmin ? "UzJapan admin panelida siz öz faoliyatingizni oson va qulay boşqarişingiz mumkin." : user?.university_name}</p>
              <Link href="/applications" className="btn teal">Arizalarni köriş <Icon name="arrow" size={16} /></Link>
            </div>
            <Fuji />
          </section>

          <div className="stat-grid">
            {stats.map((s) => (
              <div className={`stat-card tone-${s.tone}`} key={s.label}>
                <span className="stat-ico"><Icon name={s.icon} size={19} /></span>
                <small>{s.label}</small>
                <b><Num value={s.value} /></b>
                <em>{s.sub}</em>
                <Spark tone={s.tone} />
              </div>
            ))}
          </div>

          <h2 className="section-title">Tezkor ötiş</h2>
          <div className="quick-links">
            {links.map(([href, label, sub, icon]) => (
              <Link key={href} href={href}>
                <span className="ql-ico"><Icon name={icon} size={20} /></span>
                <span className="ql-text"><b>{label}</b><small>{sub}</small></span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="dash-rail">
          {isAdmin && (
            <section className="rail-card">
              <div className="rail-head"><h2>Sönggi yangiliklar</h2><Link href="/news">Barçasi</Link></div>
              {news === null ? <p className="muted">Yuklanmoqda…</p> : news.length === 0 ? <p className="muted">Hozirça yangilik yöq.</p> : news.map((n, i) => (
                <Link key={n.id} href="/news" className="rail-news">
                  <span className={`rn-thumb c${i % 3}`} />
                  <span><b>{n.title || n.slug}</b><small>{fmt(n.published_at || n.created_at)}</small></span>
                </Link>
              ))}
            </section>
          )}
          <section className="rail-card">
            <div className="rail-head"><h2>Tizim holati</h2></div>
            <div className={`sys ${health}`}>
              <b><i />{health === "loading" ? "Tekşirilmoqda…" : health === "ok" ? "Barça tizimlar işlamoqda" : "Backend javob bermayapti"}</b>
              <svg viewBox="0 0 240 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 C20 4 40 4 60 30 S100 56 120 30 S160 4 180 30 S220 56 240 30" fill="none" strokeWidth="3" strokeLinecap="round" pathLength={1} /></svg>
            </div>
          </section>
        </aside>
      </div>

      <section className="card table-card">
        <div className="rail-head"><h2>Arizalar jadvali</h2><Link href="/applications">Barçasi →</Link></div>
        {apps === null ? <p className="muted">Yuklanmoqda…</p> : apps.length === 0 ? <p className="muted">Hozirça ariza yöq.</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>F.I.Ş</th><th>Universitet</th><th>Holat</th><th>Sana</th></tr></thead>
              <tbody>
                {apps.map((x, i) => (
                  <tr key={x.id}>
                    <td>{String(i + 1).padStart(3, "0")}</td>
                    <td><Link href="/applications"><b>{x.last_name} {x.first_name}</b></Link></td>
                    <td>{x.university_name}</td>
                    <td><span className={`badge ${x.status}`}>{STATUS[x.status] || x.status}</span></td>
                    <td>{fmt(x.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
