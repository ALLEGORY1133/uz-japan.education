"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import LoginArt from "@/components/LoginArt";
import { useAuth } from "@/lib/auth";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [lock, setLock] = useState(0); // bloklanishga qolgan soniyalar

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (lock <= 0) return;
    const t = setTimeout(() => setLock((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [lock]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock > 0) return;
    setBusy(true);
    setError("");
    setHint("");
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get("username")), String(fd.get("password")));
      router.replace("/");
    } catch (err: any) {
      const d = err?.data;
      if (err?.status === 429 && d?.retry_after) {
        setLock(Number(d.retry_after));
        setError(String(d.detail || "Juda köp uriniş."));
      } else if (err?.status === 0 || err?.status >= 500) setError(String(err.message));
      else if (err?.status === 429) setError("Juda köp uriniş. Birozdan söng qayta urinib köring.");
      else if (d?.non_field_errors?.[0]) setError(String(d.non_field_errors[0]));
      else if (d?.detail) {
        setError(String(d.detail));
        if (typeof d.attempts_left === "number" && d.attempts_left <= 3)
          setHint(`Yana ${d.attempts_left} ta uriniş qoldi, söng hisob vaqtinça bloklanadi.`);
      } else setError("Login yoki parol notöğri.");
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
          <span className="lc-logo">U</span>
          <h1>UzJapan Admin</h1>
          <p>Universitet vakillari va administratorlar uçun kiriş.</p>
          {error && <div className="notice err" role="alert" key={error + lock}>{error}</div>}
          {hint && <div className="lc-hint">{hint}</div>}
          {lock > 0 && (
            <div className="lc-lock" role="status">
              <span className="lc-lock-ico">🔒</span>
              <div><b>Vaqtinça bloklandi</b><small>Qayta uriniş: <em>{fmt(lock)}</em></small></div>
              <i className="lc-lock-bar" style={{ ["--s" as string]: `${lock}s` }} />
            </div>
          )}
          <label className="field lc-field">
            <span className="label">Login</span>
            <span className="lc-in"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
              <input name="username" autoComplete="username" required autoFocus disabled={lock > 0} /></span>
          </label>
          <label className="field lc-field">
            <span className="label">Parol</span>
            <span className="lc-in"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required disabled={lock > 0} />
              <button type="button" className="lc-eye" onClick={() => setShow((v) => !v)} aria-label={show ? "Parolni yaşiriş" : "Parolni körsatiş"}>{show ? "Yaşiriş" : "Körsatiş"}</button></span>
          </label>
          <div className="lc-links"><Link href="/forgot">Parolni unutdingizmi?</Link></div>
          <button type="submit" className="btn primary lc-btn" style={{ width: "100%" }} disabled={busy || lock > 0}>
            {busy ? <><i className="lc-spin" />Kirilmoqda…</> : lock > 0 ? `Kuting: ${fmt(lock)}` : "Kiriş"}
          </button>
        </form>
      </div>
    </div>
  );
}
