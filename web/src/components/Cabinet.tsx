"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DOC_TYPES = ["passport", "diploma", "transcript", "language_cert", "cv", "motivation", "recommendation", "photo", "other"];
const INTERESTS = ["bachelor", "master", "doctoral", "grant", "exchange", "other"];
const KEY = "uj_cabinet";

type Doc = { id: number; doc_type: string; original_name: string };
type App = { code: string; university: string; status: string; degree: string; funding: string; submitted_at: string | null; documents: Doc[] };
type Inq = { id: number; interest_label: string; message: string; created_at: string; reply: string; replied_at: string | null };
type Me = { email: string; applications: App[]; inquiries: Inq[] };

const store = {
  get(): { token: string; email: string } | null {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { return null; }
  },
  set(v: { token: string; email: string } | null) {
    try { v ? sessionStorage.setItem(KEY, JSON.stringify(v)) : sessionStorage.removeItem(KEY); } catch {}
  },
};
const fmt = (v: string | null) => (v ? new Date(v).toLocaleDateString() : "");

export default function Cabinet({ locale, L, A }: { locale: string; L: Record<string, string>; A: Record<string, string> }) {
  const [session, setSession] = useState<{ token: string; email: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [tab, setTab] = useState<"status" | "inq">("status");
  const [docType, setDocType] = useState("other");
  const picker = useRef<HTMLInputElement>(null);
  const [pickCode, setPickCode] = useState("");

  useEffect(() => { setSession(store.get()); setReady(true); }, []);

  const logout = useCallback((msg = "") => {
    store.set(null); setSession(null); setMe(null); setNeedCode(false); setCode(""); setErr(msg);
  }, []);

  const load = useCallback(async (s = session) => {
    if (!s) return;
    try {
      const r = await fetch(`${API}/api/public/cabinet/me/`, { headers: { "X-Cabinet-Token": s.token } });
      if (r.status === 401 || r.status === 403) return logout(L.expired);
      if (r.status === 429) return setErr(L.many);
      if (!r.ok) return setErr(L.err);
      setMe(await r.json());
    } catch { setErr(L.err); }
  }, [session, logout, L]);
  useEffect(() => { if (session) load(session); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  async function post(path: string, body: object) {
    return fetch(`${API}/api/public/cabinet/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  function done(d: any) {
    const s = { token: d.token, email: d.email };
    store.set(s); setSession(s); setNeedCode(false); setCode(""); setErr(""); setInfo("");
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setInfo("");
    try {
      const r = await post(needCode ? "verify/" : "login/", needCode ? { email, code } : { email });
      if (r.status === 429) throw new Error(L.many);
      if (!r.ok) throw new Error(L.bad);
      const d = await r.json();
      if (d.need_code) { setNeedCode(true); setInfo(L.codeSent); } else done(d);
    } catch (er: any) { setErr(er?.message || L.err); } finally { setBusy(false); }
  }

  async function upload(files: FileList | null, appCode: string) {
    if (!files || !session) return;
    setBusy(true); setErr("");
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("doc_type", docType); fd.append("file", f); fd.append("email", session.email);
      const r = await fetch(`${API}/api/public/applications/${appCode}/documents/`, { method: "POST", body: fd });
      if (!r.ok) { setErr(A.badFile); break; }
    }
    setBusy(false);
    load();
  }

  async function sendInq(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true); setErr(""); setInfo("");
    try {
      const r = await fetch(`${API}/api/public/cabinet/inquiries/`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Cabinet-Token": session.token },
        body: JSON.stringify({ message: fd.get("message"), interest: fd.get("interest") }),
      });
      if (r.status === 401 || r.status === 403) return logout(L.expired);
      if (r.status === 429) throw new Error(L.many);
      if (!r.ok) throw new Error(L.err);
      form.reset(); setInfo(L.sentOk); load();
    } catch (er: any) { setErr(er?.message || L.err); } finally { setBusy(false); }
  }

  if (!ready) return null;

  /* 1-qadam: faqat email (login kabi) */
  if (!session) {
    return (
      <form className="cab-login" onSubmit={onLogin}>
        <span className="cab-logo">U</span>
        <h2 className="disp">{L.title}</h2>
        <p>{L.lead}</p>
        {err && <div className="alert err" role="alert">{err}</div>}
        {info && <div className="cab-info" role="status">{info}</div>}
        <label className="cab-f"><span>{L.email}</span>
          <input type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={needCode} />
        </label>
        {needCode && (
          <label className="cab-f"><span>{L.code}</span>
            <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" />
          </label>
        )}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? L.entering : needCode ? L.verify : L.enter}</button>
      </form>
    );
  }

  const unanswered = me ? me.inquiries.filter((i) => !i.reply).length : 0;
  const answered = me ? me.inquiries.length - unanswered : 0;

  return (
    <div className="cab">
      <div className="cab-bar">
        <span className="cab-who"><i>{session.email[0]?.toUpperCase()}</i><span className="cab-mail" title={session.email}>{session.email}</span></span>
        <button type="button" className="btn btn-outline" onClick={() => logout()}>{L.logout}</button>
      </div>
      <div className="cab-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "status"} className={tab === "status" ? "on" : ""} onClick={() => setTab("status")}>
          {L["tab.status"]}{me && <b>{me.applications.length}</b>}
        </button>
        <button role="tab" aria-selected={tab === "inq"} className={tab === "inq" ? "on" : ""} onClick={() => setTab("inq")}>
          {L["tab.inq"]}{me && <b className={answered ? "hot" : ""}>{me.inquiries.length}</b>}
        </button>
      </div>
      {err && <div className="alert err" role="alert">{err}</div>}
      {info && <div className="cab-info" role="status">{info}</div>}

      {tab === "status" && me && (
        <div className="cab-list">
          {me.applications.length === 0 && (
            <div className="cab-empty">
              <p>{L.noApps}</p>
              <Link className="btn btn-primary" href={`/${locale}/universities`}>{L.toUnis} →</Link>
            </div>
          )}
          {me.applications.map((a) => (
            <article className="cab-card" key={a.code}>
              <header>
                <div><div className="eyebrow">{a.university}</div><small>{a.code} · {L.submitted}: {fmt(a.submitted_at)}</small></div>
                <b className={`st-badge ${a.status}`}>{A[`st.${a.status}`]}</b>
              </header>
              <h3 className="ap-h2">{L.docs}: {a.documents.length}</h3>
              <div className="ap-list">
                {a.documents.map((d) => (
                  <div key={d.id} className="ap-file"><span className="ap-tag">{A[`doc.${d.doc_type}`]}</span><span className="ap-fn" title={d.original_name}>{d.original_name}</span></div>
                ))}
              </div>
              <div className="st-add">
                <select value={docType} onChange={(e) => setDocType(e.target.value)} aria-label={A["st.addMore"]}>
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{A[`doc.${t}`]}</option>)}
                </select>
                <button type="button" className="btn btn-outline" disabled={busy} onClick={() => { setPickCode(a.code); picker.current?.click(); }}>+ {A["st.addMore"]}</button>
              </div>
            </article>
          ))}
          <input ref={picker} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.webp,.docx" onChange={(e) => { upload(e.target.files, pickCode); e.target.value = ""; }} />
        </div>
      )}

      {tab === "inq" && me && (
        <div className="cab-list">
          <form className="cab-card cab-new" onSubmit={sendInq}>
            <h3 className="ap-h2">{L.newInq}</h3>
            <select name="interest" defaultValue="other" aria-label={L.newInq}>{INTERESTS.map((i) => <option key={i} value={i}>{L[`i.${i}`] || A[`i.${i}`] || i}</option>)}</select>
            <textarea name="message" required minLength={3} maxLength={2000} rows={3} placeholder={L.msg} />
            <button className="btn btn-primary" disabled={busy}>{L.send} →</button>
          </form>
          {me.inquiries.length === 0 && <p className="muted" style={{ textAlign: "center" }}>{L.noInq}</p>}
          {me.inquiries.map((i) => (
            <article className="cab-card" key={i.id}>
              <header><small>{i.interest_label} · {fmt(i.created_at)}</small><b className={`st-badge ${i.reply ? "accepted" : "reviewing"}`}>{i.reply ? L.answered : L.waiting}</b></header>
              <p className="cab-msg">{i.message}</p>
              {i.reply && <div className="cab-reply"><small>{L.answered} · {fmt(i.replied_at)}</small><p>{i.reply}</p></div>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
