"use client";

import { FormEvent, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CODES = [
  { code: "+998", label: "UZ", ph: "90 123 45 67", min: 9, max: 9 },
  { code: "+81", label: "JP", ph: "90 1234 5678", min: 9, max: 10 },
];
const INTERESTS = ["bachelor", "master", "doctoral", "grant", "exchange", "other"];

export default function InquiryForm({ labels }: { labels: Record<string, string> }) {
  const L = labels;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [cc, setCc] = useState(CODES[0].code);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const c = CODES.find((x) => x.code === cc)!;
    const digits = String(fd.get("phone") || "").replace(/\D/g, "");
    if (digits && (digits.length < c.min || digits.length > c.max)) return setError(`${L["phone"]}: ${c.code} ${c.ph}`);
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/public/inquiries/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"), email: fd.get("email"), phone: digits ? `${c.code} ${digits}` : "",
          interest: fd.get("interest"), message: fd.get("message") || "", website: fd.get("website") || "",
        }),
      });
      if (res.status === 429) throw new Error(L["many"]);
      if (!res.ok) throw new Error(L["err"]);
      setDone(true);
      form.reset();
    } catch (er: any) {
      setError(er?.message || L["err"]);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="iq-ok" role="status">
        <span>✓</span>
        <p>{L["ok"]}</p>
        <button type="button" className="btn btn-white" onClick={() => setDone(false)}>←</button>
      </div>
    );
  }
  return (
    <form className="iq-form" onSubmit={onSubmit} noValidate={false}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="iq-hp" />
      <label className="iq-f"><span>{L["name"]}</span><input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder={L["name"]} /></label>
      <label className="iq-f"><span>{L["email"]}</span><input name="email" type="email" required maxLength={254} autoComplete="email" placeholder={L["email"]} /></label>
      <label className="iq-f"><span>{L["phone"]}</span>
        <span className="iq-phone">
          <select value={cc} onChange={(e) => setCc(e.target.value)} aria-label="Country code">{CODES.map((c) => <option key={c.code} value={c.code}>{c.label} {c.code}</option>)}</select>
          <input name="phone" type="tel" inputMode="tel" placeholder={CODES.find((c) => c.code === cc)!.ph} maxLength={16} autoComplete="tel-national" />
        </span>
      </label>
      <label className="iq-f"><span>{L["interest"]}</span>
        <select name="interest" defaultValue="other">{INTERESTS.map((i) => <option key={i} value={i}>{L[`i.${i}`]}</option>)}</select>
      </label>
      <label className="iq-f iq-full"><span>{L["msg"]}</span><textarea name="message" rows={3} maxLength={2000} placeholder={L["msg"]} /></label>
      {error && <div className="iq-err" role="alert">{error}</div>}
      <div className="iq-foot">
        <button type="submit" className="btn btn-white" disabled={busy}>{busy ? L["sending"] : <>{L["send"]} →</>}</button>
        <small>{L["privacy"]}</small>
      </div>
    </form>
  );
}
