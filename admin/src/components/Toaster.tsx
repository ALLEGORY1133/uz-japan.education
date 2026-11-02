"use client";

import { useEffect, useRef, useState } from "react";

type Toast = { id: number; ok: boolean; text: string };

/**
 * Sahifadagi barcha «saqlandi / xato» xabarlarini (.notice.ok / .notice.err) ekranning
 * yuqori markazida, doim körinadigan bildirişnoma sifatida çiqaradi (iPhone uslubida).
 */
export default function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  const seen = useRef(new WeakMap<Element, string>());
  const nid = useRef(0);

  useEffect(() => {
    const scan = () => {
      document.querySelectorAll<HTMLElement>(".notice.ok, .notice.err").forEach((el) => {
        if (el.closest(".login-card, .toaster")) return;
        const text = (el.textContent || "").replace(/[×✕]/g, "").trim();
        if (!text || seen.current.get(el) === text) return;
        seen.current.set(el, text);
        const id = ++nid.current;
        const ok = el.classList.contains("ok");
        setItems((s) => [...s.slice(-2), { id, ok, text }]);
        window.setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), ok ? 3200 : 5200);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, []);

  return (
    <div className="toaster" aria-live="polite" aria-atomic="true">
      {items.map((t) => (
        <button type="button" key={t.id} className={`toast ${t.ok ? "ok" : "err"}`} onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}>
          <span className="toast-ic" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {t.ok ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M7 7l10 10M17 7 7 17" />}
            </svg>
          </span>
          <span className="toast-tx">{t.text}</span>
        </button>
      ))}
    </div>
  );
}
