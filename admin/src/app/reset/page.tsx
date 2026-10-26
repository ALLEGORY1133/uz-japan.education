"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import LoginArt from "@/components/LoginArt";
import { resetPassword } from "@/lib/api";

/** Parol kuchi: 0–4 */
function strength(p: string) {
  let n = 0;
  if (p.length >= 8) n++;
  if (p.length >= 12) n++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) n++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) n++;
  return n;
}
const LABEL = ["Juda zaif", "Zaif", "Örtaça", "Yaxşi", "Kuçli"];

export default function ResetPage() {
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setUid(q.get("uid") || "");
    setToken(q.get("token") || "");
  }, []);

  const st = strength(pw);
  const mismatch = pw2.length > 0 && pw !== pw2;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pw !== pw2) return setError("Parollar bir xil emas.");
    setBusy(true);
    setError("");
    try {
      await resetPassword(uid, token, pw);
      setDone(true);
    } catch (err: any) {
      const d = err?.data;
      setError(d?.password?.[0] || d?.detail || (err?.status === 429 ? "Juda köp uriniş. Birozdan söng qayta urinib köring." : String(err?.message || "Xatolik yuz berdi.")));
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="login-split">
      <LoginArt />
      <div className="login-pane">
        <i className="lp-orb o1" /><i className="lp-orb o2" />
        <form className="login-card" onSubmit={onSubmit}>
          <span className="lc-logo">🔑</span>
          <h1>Yangi parol örnatiş</h1>
          {done ? (
            <>
              <div className="lc-ok" role="status"><span>✓</span><p>Parol yangilandi. Endi yangi parol bilan kirişingiz mumkin.</p></div>
              <Link href="/login" className="btn primary lc-btn" style={{ width: "100%", textAlign: "center" }}>Kirişga ötiş</Link>
            </>
          ) : (
            <>
              <p>Hisobingiz uçun yangi parol kiriting (kamida 8 belgi).</p>
              {error && <div className="notice err" role="alert" key={error}>{error}</div>}
              <label className="field lc-field">
                <span className="label">Yangi parol</span>
                <span className="lc-in"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                  <input type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
                  <button type="button" className="lc-eye" onClick={() => setShow((v) => !v)}>{show ? "Yaşiriş" : "Körsatiş"}</button></span>
              </label>
              {pw && (
                <div className={`lc-str s${st}`} aria-live="polite">
                  <span><i /><i /><i /><i /></span><small>{LABEL[st]}</small>
                </div>
              )}
              <label className="field lc-field">
                <span className="label">Parolni takrorlang</span>
                <span className="lc-in"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                  <input type={show ? "text" : "password"} autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} /></span>
                {mismatch && <small className="lc-bad">Parollar bir xil emas.</small>}
              </label>
              <button type="submit" className="btn primary lc-btn" style={{ width: "100%" }} disabled={busy || !uid || !token || mismatch || pw.length < 8}>
                {busy ? <><i className="lc-spin" />Saqlanmoqda…</> : "Parolni saqlaş"}
              </button>
              {(!uid || !token) && <div className="notice err">Havola töliq emas. Xatdagi havolani qayta oçing yoki <Link href="/forgot">yangisini sörang</Link>.</div>}
              <div className="lc-links lc-center"><Link href="/login">← Kiriş sahifasiga qaytiş</Link></div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
