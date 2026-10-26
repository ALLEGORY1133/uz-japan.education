"use client";

import { useEffect, useMemo, useState } from "react";
import { api, apiDownload } from "@/lib/api";

type Metric = { label: string; value: string | number };
type Card = { key: string; name: string; score: number | null; volume: number; target: number | null; metrics: Metric[]; formula: string };
type Rank = { id: number; rank: number; name: string; username: string; university: string; group: string; actions: number; target: number; score: number };
type Data = { month: string; period_start: string; period_end: string; cards: Card[]; ranking: Rank[]; applications: { submitted: number; reviewed: number; closed: number }; notes: string[] };

const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
export default function KPIPage() {
  const [month, setMonth] = useState(fmtMonth(new Date()));
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState("all");
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    let alive = true; setLoading(true); setError("");
    api<Data>(`/kpi/?month=${encodeURIComponent(month)}`).then(d => { if (alive) setData(d); }).catch(e => { if (alive) setError(e?.message || "KPI ma’lumotlarini yuklab bölmadi."); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [month]);
  const ranking = useMemo(() => (data?.ranking || []).filter(r => group === "all" || r.group === group), [data, group]);
  const exportCsv = async () => { setExporting(true); try { await apiDownload(`/kpi/export/?month=${encodeURIComponent(month)}`, `uzjapan-kpi-${month}.csv`); } catch (e: any) { setError(e?.message || "Eksport amalga oşmadi."); } finally { setExporting(false); } };
  return <>
    <div className="page-head kpi-head"><div><h1>KPI samaradorligi</h1><p>Oylik körsatkiçlar, guruhlar tahlili va xodimlar reytingi.</p></div><div className="kpi-controls"><label>Hisobot oyi<input type="month" value={month} onChange={e=>setMonth(e.target.value)} /></label><button className="btn primary" onClick={exportCsv} disabled={exporting || loading}>{exporting ? "Tayyorlanmoqda…" : "CSV eksport"}</button></div></div>
    {error && <div className="kpi-error" role="alert">{error}</div>}
    {loading && <div className="card kpi-empty">KPI ma’lumotlari yuklanmoqda…</div>}
    {!loading && data && <>
      <div className="kpi-summary"><div><span>Yuborilgan arizalar</span><b>{data.applications.submitted}</b></div><div><span>Körib çiqilmoqda / körib çiqilgan</span><b>{data.applications.reviewed}</b></div><div><span>Yakunlangan</span><b>{data.applications.closed}</b></div><div><span>Hisobot davri</span><b>{data.month}</b></div></div>
      <div className="kpi-card-grid">{data.cards.map(c => <article className="card kpi-card" key={c.key}><div className="kpi-card-top"><span className={`kpi-dot ${c.key}`} /><div><h2>{c.name}</h2><small>{c.volume} ta qayd / faoliyat</small></div></div><div className="kpi-score">{c.score === null ? <span className="kpi-na">Kuzatuv</span> : <><b>{c.score}</b><span>/100 ball</span></>}</div>{c.score !== null && <div className="kpi-track"><i style={{width:`${c.score}%`}} /></div>}<div className="kpi-metrics">{c.metrics.map(m=><div key={m.label}><span>{m.label}</span><b>{m.value}</b></div>)}</div><details><summary>Ball formulasi</summary><p>{c.formula}</p></details></article>)}</div>
      <section className="card kpi-chart"><div className="kpi-section-head"><div><h2>Guruhlar böyiça KPI</h2><p>100 ballik şkala; xavfsizlik guruhi hozirça monitoring körinişida.</p></div></div><div className="kpi-bars">{data.cards.map(c=><div className="kpi-bar-row" key={c.key}><span>{c.name}</span>{c.score === null ? <div className="kpi-unmeasured">Ball hisoblanmaydi</div> : <><div className="kpi-bar-bg"><i style={{width:`${c.score}%`}} /></div><b>{c.score}</b></>}</div>)}</div></section>
      <section className="card kpi-ranking"><div className="kpi-section-head"><div><h2>Xodimlar reytingi</h2><p>Reyting audit tarixida qayd etilgan amallar soni böyiça hisoblanadi; bu yakka özi iş sifati degani emas.</p></div><select aria-label="Guruh böyiça filtr" value={group} onChange={e=>setGroup(e.target.value)}><option value="all">Barça guruhlar</option><option value="content_admins">Kontent administratorlari</option><option value="university_reps">Universitet vakillari</option></select></div>{ranking.length ? <div className="kpi-table-wrap"><table className="kpi-table"><thead><tr><th>Örin</th><th>Xodim</th><th>Universitet</th><th>Guruh</th><th>Audit amallari</th><th>Maqsad</th><th>Ball</th></tr></thead><tbody>{ranking.map(r=><tr key={r.id}><td><span className={`kpi-rank ${r.rank<=3?"top":""}`}>{r.rank}</span></td><td><b>{r.name}</b><small>@{r.username}</small></td><td>{r.university || "—"}</td><td>{r.group === "content_admins" ? "Kontent admini" : "Universitet vakili"}</td><td>{r.actions}</td><td>{r.target}</td><td><b>{r.score}</b>/100</td></tr>)}</tbody></table></div> : <p className="kpi-empty">Tanlangan davr uçun reyting ma’lumoti yöq.</p>}</section>
      <section className="kpi-notes"><h2>Hisoblaş böyiça izohlar</h2>{data.notes.map(n=><p key={n}>ⓘ {n}</p>)}</section>
    </>}
  </>;
}
