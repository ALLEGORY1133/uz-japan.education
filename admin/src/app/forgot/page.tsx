"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import LoginArt from "@/components/LoginArt";
import { forgotPassword } from "@/lib/api";

export default function ForgotPage() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await forgotPassword(String(new FormData(e.currentTarget).get("identifier") || ""));
      setSent(true);
    } catch (err: any) {
      setError(err?.status === 429 ? "Juda köp sörov. Birozdan söng qayta urinib köring." : String(err?.message || "Xatolik yuz berdi."));
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
          <span className="lc-logo">✉</span>
          <h1>Parolni tiklaş</h1>
          {sent ? (
            <>
              <div className="lc-ok" role="status">
                <span>✓</span>
                <p>Agar bunday hisob mavjud va unga email biriktirilgan bölsa, parolni tiklaş havolasi yuborildi. Poçtangizni (va “Spam” papkasini) tekşiring. Havola 1 soat amal qiladi.</p>
              </div>
              <div className="lc-links lc-center"><Link href="/login">← Kiriş sahifasiga qaytiş</Link></div>
            </>
          ) : (
            <>
              <p>Loginingiz yoki emailingizni kiriting — parolni tiklaş havolasini yuboramiz.</p>
              {error && <div className="notice err" role="alert">{error}</div>}
              <label className="field lc-field">
                <span className="label">Login yoki email</span>
                <span className="lc-in"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                  <input name="identifier" autoComplete="username" required autoFocus /></span>
              </label>
              <button type="submit" className="btn primary lc-btn" style={{ width: "100%" }} disabled={busy}>
                {busy ? <><i className="lc-spin" />Yuborilmoqda…</> : "Havola yuboriş"}
              </button>
              <div className="lc-links lc-center"><Link href="/login">← Kiriş sahifasiga qaytiş</Link></div>
              <p className="lc-note">Hisobingizga email biriktirilmagan bölsa, administratorga murojaat qiling.</p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
