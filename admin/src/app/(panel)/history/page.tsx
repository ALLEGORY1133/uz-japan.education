"use client";

import { useCallback, useEffect, useState } from "react";
import { errorSummary } from "@/components/Form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const ACTIONS: Record<string, string> = { create: "Qöşildi", update: "Özgartirildi", delete: "Öçirildi", reorder: "Tartib özgardi" };
type Opt = { value: string; label: string };

function fmt(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "medium" });
}

export default function HistoryPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [facets, setFacets] = useState<{ models: Opt[]; users: Opt[] }>({ models: [], users: [] });
  const [f, setF] = useState({ q: "", action: "", model_key: "", user: "", date_from: "", date_to: "" });
  const [applied, setApplied] = useState(f);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const qs = new URLSearchParams({ page: String(page) });
      Object.entries(applied).forEach(([k, v]) => v && qs.set(k, v));
      const d = await api(`/history/?${qs.toString()}`);
      setItems(d.results || []);
      setCount(d.count || 0);
    } catch (e: any) {
      setErr(errorSummary(e));
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  useEffect(() => {
    if (isAdmin) api("/history/facets/").then(setFacets).catch(() => {});
  }, [isAdmin]);

  if (!isAdmin) return <div className="notice err">Bu bölim faqat platforma administratori uçun.</div>;

  const pages = Math.max(1, Math.ceil(count / 100));
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setApplied(f);
  };
  const clear = () => {
    const blank = { q: "", action: "", model_key: "", user: "", date_from: "", date_to: "" };
    setF(blank);
    setPage(1);
    setApplied(blank);
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Harakatlar tarixi</h1><p>Admin panelda kim, qaçon, nimani qöşgan, özgartirgan yoki öçirgan.</p></div>
      </div>

      <form className="card hist-filter" onSubmit={apply}>
        <label className="field"><span className="label">Qidiruv</span><input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Nomi yoki foydalanuvçi" /></label>
        <label className="field"><span className="label">Amal</span>
          <select value={f.action} onChange={(e) => set("action", e.target.value)}>
            <option value="">Barçasi</option>
            {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="field"><span className="label">Bölim</span>
          <select value={f.model_key} onChange={(e) => set("model_key", e.target.value)}>
            <option value="">Barçasi</option>
            {facets.models.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="field"><span className="label">Foydalanuvçi</span>
          <select value={f.user} onChange={(e) => set("user", e.target.value)}>
            <option value="">Barçasi</option>
            {facets.users.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="field"><span className="label">Sanadan</span><input type="date" value={f.date_from} onChange={(e) => set("date_from", e.target.value)} /></label>
        <label className="field"><span className="label">Sanagaça</span><input type="date" value={f.date_to} onChange={(e) => set("date_to", e.target.value)} /></label>
        <div className="form-foot" style={{ gridColumn: "1 / -1" }}>
          <button className="btn primary sm">Qidiriş</button>
          <button type="button" className="btn ghost sm" onClick={clear}>Tozalaş</button>
          <span className="muted">Jami: {count}</span>
        </div>
      </form>

      {err && <div className="notice err">{err}</div>}
      {loading ? <p className="muted">Yuklanmoqda…</p> : items.length === 0 ? <p className="muted">Hozirça harakat yöq.</p> : (
        <ul className="rows hist">
          {items.map((h) => (
            <li key={h.id} className="row hist-row">
              <div className="hist-top">
                <span className={`hist-badge ${h.action}`}>{h.action_label}</span>
                <div className="row-main">
                  <b>{h.model_label}{h.object_repr ? ` — ${h.object_repr}` : ""}</b>
                  <span className="muted">{h.user_label || "—"} · {fmt(h.created_at)}{h.ip ? ` · ${h.ip}` : ""}</span>
                </div>
                {h.changes?.length > 0 && (
                  <button type="button" className="btn outline sm" onClick={() => setOpen(open === h.id ? null : h.id)}>
                    {open === h.id ? "Yopiş" : `Özgarişlar (${h.changes.length})`}
                  </button>
                )}
              </div>
              {open === h.id && (
                <table className="hist-diff">
                  <thead><tr><th>Maydon</th><th>Avval</th><th>Keyin</th></tr></thead>
                  <tbody>
                    {h.changes.map((c: any, i: number) => (
                      <tr key={i}><td>{c.f}</td><td className="old">{c.old || "—"}</td><td className="new">{c.new || "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn outline sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Oldingi</button>
          <span className="muted">{page} / {pages}</span>
          <button className="btn outline sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Keyingi →</button>
        </div>
      )}
    </>
  );
}
