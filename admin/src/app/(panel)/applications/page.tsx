"use client";

import { useCallback, useEffect, useState } from "react";
import { errorSummary } from "@/components/Form";
import { api, apiDownload } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const STATUS: Record<string, string> = { new: "Yangi", reviewing: "Körib çiqilmoqda", accepted: "Qabul qilindi", rejected: "Rad etildi" };
const DEGREE: Record<string, string> = { bachelor: "Bakalavr", master: "Magistratura", doctoral: "Doktorantura" };
const FUNDING: Record<string, string> = { contract: "Kontrakt", grant: "Grant" };

export default function ApplicationsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [funding, setFunding] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page) });
    if (status) qs.set("status", status);
    if (funding) qs.set("funding", funding);
    try {
      const d: any = await api(`/applications/?${qs}`);
      setItems(d.results ?? d);
      setCount(d.count ?? (d.results ?? d).length);
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    }
  }, [page, status, funding]);

  useEffect(() => { load(); }, [load]);

  async function patch(id: number, body: object) {
    try {
      await api(`/applications/${id}/`, { method: "PATCH", json: body });
      setMsg({ ok: true, text: "Saqlandi." });
      load();
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    }
  }

  const DOC_TYPE: Record<string, string> = {
    passport: "Şaxsni tasdiqlovçi hujjat", diploma: "Diplom / attestat", transcript: "Transkript", language_cert: "Til sertifikati",
    cv: "Tarjimai hol (CV)", motivation: "Motivatsion xat", recommendation: "Tavsiyanoma", photo: "Foto", other: "Boşqa",
  };
  const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  async function dl(path: string, name: string) {
    try {
      await apiDownload(path, name);
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    }
  }

  const pages = Math.max(1, Math.ceil(count / 100));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Arizalar</h1>
          <p>{isAdmin ? "Barça universitetlarga kelgan arizalar." : "Sizning universitetingizga kelgan arizalar."}</p>
        </div>
      </div>
      {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`}>{msg.text}<button className="x" onClick={() => setMsg(null)} aria-label="Yopiş">×</button></div>}

      <div className="filters">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Holat">
          <option value="">Barça holatlar</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={funding} onChange={(e) => { setFunding(e.target.value); setPage(1); }} aria-label="Moliyalaştiriş">
          <option value="">Kontrakt va grant</option>
          {Object.entries(FUNDING).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {items.length === 0 && <p className="muted">Arizalar topilmadi.</p>}
      <ul className="rows">
        {items.map((a) => (
          <li key={a.id} className="row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
              <div className="row-main">
                <b>{a.last_name} {a.first_name} {a.middle_name}</b>
                <span className="muted">{a.university_name} · {DEGREE[a.degree]} · {FUNDING[a.funding]} · {new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <span className={`badge ${a.status}`}>{STATUS[a.status]}</span>
              <button className="btn outline sm" onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? "Yopiş" : "Oçiş"}</button>
            </div>
            {open === a.id && (
              <div>
                <div className="app-detail">
                  <div><small>Email</small><a href={`mailto:${a.email}`}>{a.email}</a></div>
                  <div><small>Telefon</small>{a.phone}</div>
                </div>
                <div className="app-detail">
                  {a.middle_name && <div><small>Otasining ismi</small>{a.middle_name}</div>}
                  {a.birth_date && <div><small>Tuğilgan sana</small>{a.birth_date}</div>}
                  {a.citizenship && <div><small>Fuqarolik</small>{a.citizenship}</div>}
                  {a.city && <div><small>Şahar</small>{a.city}</div>}
                  {a.program && <div><small>Yönaliş</small>{a.program}</div>}
                  <div><small>Kuzatuv kodi</small>{a.tracking_code}</div>
                </div>
                {a.message && <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{a.message}</p>}

                <div style={{ margin: "14px 0" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                    <b>Hujjatlar ({a.documents?.length || 0})</b>
                    {a.documents?.length > 0 && (
                      <button className="btn primary sm" onClick={() => dl(`/applications/${a.id}/download-all/`, `${`${a.first_name}-${a.last_name}`.replace(/[\\/:*?"<>|\s]+/g, "_")}.zip`)}>
                        Hammasini ZIP qilib yuklab olish
                      </button>
                    )}
                  </div>
                  {(!a.documents || a.documents.length === 0) && <p className="muted" style={{ fontSize: 13 }}>Hujjat yuklanmagan.</p>}
                  <ul className="rows" style={{ marginTop: 8 }}>
                    {(a.documents || []).map((d: any) => (
                      <li key={d.id} className="row">
                        <div className="row-main">
                          <b style={{ overflowWrap: "anywhere" }}>{d.original_name}</b>
                          <span className="muted">{DOC_TYPE[d.doc_type] || d.doc_type} · {fmtSize(d.size)}{d.scan_status === "clean" ? " · ✓ virus tekşiruvi" : ""}{d.lang_checked ? " · ✓ yapon tili" : ""}</span>
                        </div>
                        <div className="row-actions">
                          <button className="btn outline sm" onClick={() => dl(`/applications/${a.id}/documents/${d.id}/download/`, d.original_name)}>Yuklab oliş</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span className="label">Holat</span>
                    <select value={a.status} onChange={(e) => patch(a.id, { status: e.target.value })}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </label>
                  <label className="field full">
                    <span className="label">Içki izoh (talabaga körinmaydi)</span>
                    <textarea rows={3} value={notes[a.id] ?? a.internal_note ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))} />
                  </label>
                </div>
                <div className="form-foot">
                  <button className="btn primary sm" onClick={() => patch(a.id, { internal_note: notes[a.id] ?? a.internal_note ?? "" })}>Izohni saqlaş</button>
                  <button type="button" className="btn ghost sm" onClick={() => setNotes((n) => ({ ...n, [a.id]: "" }))}>Tozalaş</button>
                </div>
              </div>
            )}
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
