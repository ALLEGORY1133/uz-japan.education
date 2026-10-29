"use client";

import { useCallback, useEffect, useState } from "react";
import { errorSummary } from "@/components/Form";
import { api } from "@/lib/api";

export default function InquiriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [handled, setHandled] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page) });
    if (handled) qs.set("is_handled", handled);
    try {
      const d: any = await api(`/inquiries/?${qs}`);
      setItems(d.results ?? d);
      setCount(d.count ?? (d.results ?? d).length);
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    }
  }, [page, handled]);
  useEffect(() => { load(); }, [load]);

  async function toggle(i: any) {
    try {
      await api(`/inquiries/${i.id}/`, { method: "PATCH", json: { is_handled: !i.is_handled } });
      load();
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    }
  }
  async function sendReply(i: any) {
    const text = (drafts[i.id] ?? i.reply ?? "").trim();
    if (!text) return setMsg({ ok: false, text: "Javob matnini yozing." });
    try {
      await api(`/inquiries/${i.id}/`, { method: "PATCH", json: { reply: text } });
      setMsg({ ok: true, text: "Javob yuborildi va talaba kabinetida körinadi." });
      setDrafts((d) => { const n = { ...d }; delete n[i.id]; return n; });
      load();
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    }
  }
  async function remove(i: any) {
    if (!window.confirm(`“${i.name}” murojaatini öçirasizmi?`)) return;
    try {
      await api(`/inquiries/${i.id}/`, { method: "DELETE" });
      load();
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    }
  }
  const pages = Math.max(1, Math.ceil(count / 100));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Murojaatlar</h1>
          <p>Saytning “Savollaringiz bormi?” formasi orqali kelgan sörovlar.</p>
        </div>
      </div>
      {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`}>{msg.text}<button className="x" onClick={() => setMsg(null)} aria-label="Yopiş">×</button></div>}
      <div className="filters">
        <select value={handled} onChange={(e) => { setHandled(e.target.value); setPage(1); }} aria-label="Holat">
          <option value="">Hammasi</option>
          <option value="false">Yangi</option>
          <option value="true">Körib çiqilgan</option>
        </select>
      </div>
      {items.length === 0 && <p className="muted">Murojaatlar yöq.</p>}
      <ul className="rows">
        {items.map((i) => (
          <li key={i.id} className="row" style={{ flexDirection: "column", alignItems: "stretch", opacity: i.is_handled ? 0.7 : 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
              <div className="row-main">
                <b>{i.name}</b>
                <span className="muted">{i.interest_label} · {new Date(i.created_at).toLocaleString()}</span>
              </div>
              <span className={`badge ${i.reply ? "accepted" : "new"}`}>{i.reply ? "Javob berilgan" : i.is_handled ? "Körib çiqilgan" : "Yangi"}</span>
            </div>
            <div className="app-detail" style={{ marginTop: 8 }}>
              <div><small>Email</small><a href={`mailto:${i.email}`}>{i.email}</a></div>
              {i.phone && <div><small>Telefon</small><a href={`tel:${i.phone}`}>{i.phone}</a></div>}
            </div>
            {i.message && <p style={{ whiteSpace: "pre-wrap", fontSize: 14, margin: "6px 0" }}>{i.message}</p>}
            {i.reply && (
              <div className="iq-reply">
                <small>Javob · {i.replied_by_name || "admin"} · {i.replied_at ? new Date(i.replied_at).toLocaleString() : ""}</small>
                <p>{i.reply}</p>
              </div>
            )}
            <label className="field full" style={{ marginTop: 8 }}>
              <span className="label">{i.reply ? "Javobni özgartiriş" : "Javob yoziş"} (talaba kabinetida körinadi va emailga yuboriladi)</span>
              <textarea rows={3} value={drafts[i.id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [i.id]: e.target.value }))} placeholder="Javob matni…" />
            </label>
            <div className="row-actions" style={{ justifyContent: "flex-start", gap: 8 }}>
              <button className="btn primary sm" onClick={() => sendReply(i)}>Javob yuboriş</button>
              <button type="button" className="btn ghost sm" onClick={() => setDrafts((d) => ({ ...d, [i.id]: "" }))}>Tozalaş</button>
              <button className="btn outline sm" onClick={() => toggle(i)}>{i.is_handled ? "Yangi deb belgilaş" : "Körib çiqildi"}</button>
              <button className="btn danger sm" onClick={() => remove(i)}>Öçiriş</button>
            </div>
          </li>
        ))}
      </ul>
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
