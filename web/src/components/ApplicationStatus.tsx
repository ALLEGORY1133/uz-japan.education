"use client";

import { FormEvent, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DOC_TYPES = ["passport", "diploma", "transcript", "language_cert", "cv", "motivation", "recommendation", "photo", "other"];

type Doc = { id: number; doc_type: string; original_name: string; size: number };
type Res = { code: string; university: string; status: string; is_submitted: boolean; documents: Doc[] };

export default function ApplicationStatus({ labels: L }: { labels: Record<string, string> }) {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState("other");
  const picker = useRef<HTMLInputElement>(null);

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`${API}/api/public/applications/status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email }),
      });
      if (r.status === 429) throw new Error(L.tooMany);
      if (!r.ok) throw new Error(L["st.notFound"]);
      setRes(await r.json());
    } catch (e: any) {
      setRes(null);
      setErr(e?.message || L.error);
    } finally {
      setBusy(false);
    }
  }

  async function upload(files: FileList | null) {
    if (!files || !res) return;
    setBusy(true);
    setErr("");
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("doc_type", type);
      fd.append("file", f);
      fd.append("email", email);
      const r = await fetch(`${API}/api/public/applications/${res.code}/documents/`, { method: "POST", body: fd });
      if (!r.ok) {
        setErr(L.badFile);
        break;
      }
    }
    setBusy(false);
    await lookup();
  }

  return (
    <div className="st-wrap">
      <form className="panel st-form" onSubmit={lookup}>
        <label className="field">{L["st.code"]}<input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="UJ-XXXXXXXXXX" autoComplete="off" /></label>
        <label className="field">{L["st.email"]}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        {err && <div className="alert err" role="alert">{err}</div>}
        <button className="btn btn-primary" disabled={busy}>{busy ? L.sending : L["st.check"]}</button>
      </form>

      {res && (
        <div className="panel st-res">
          <div className="eyebrow">{res.university}</div>
          <div className="st-row">
            <span>{L["st.status"]}</span>
            <b className={`st-badge ${res.is_submitted ? res.status : "draft"}`}>{res.is_submitted ? L[`st.${res.status}`] : L["st.draft"]}</b>
          </div>
          <h3 className="ap-h2">{L["st.docs"]}: {res.documents.length}</h3>
          <div className="ap-list">
            {res.documents.map((d) => (
              <div key={d.id} className="ap-file">
                <span className="ap-tag">{L[`doc.${d.doc_type}`]}</span>
                <span className="ap-fn" title={d.original_name}>{d.original_name}</span>
              </div>
            ))}
          </div>
          <div className="st-add">
            <select value={type} onChange={(e) => setType(e.target.value)} aria-label={L["st.addMore"]}>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{L[`doc.${t}`]}</option>)}
            </select>
            <input ref={picker} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.webp,.docx" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
            <button type="button" className="btn btn-outline" disabled={busy} onClick={() => picker.current?.click()}>+ {L["st.addMore"]}</button>
          </div>
        </div>
      )}
    </div>
  );
}
