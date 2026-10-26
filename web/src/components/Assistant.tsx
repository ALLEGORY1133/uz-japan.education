"use client";

import { useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
type Msg = { who: "me" | "bot"; text: string; links?: { label: string; url: string }[] };
type Props = { locale: string; L: Record<string, string> };

export default function Assistant({ locale, L }: Props) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ who: "bot", text: L.hi }]);
  const [chips, setChips] = useState<string[]>([L.s1, L.s2, L.s3, L.s4]);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, open]);

  async function ask(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setMsgs((m) => [...m, { who: "me", text: message }]);
    setVal("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/public/assistant/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, lang: locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      setMsgs((m) => [...m, { who: "bot", text: d.answer, links: d.links }]);
      if (Array.isArray(d.suggestions)) setChips(d.suggestions.slice(0, 4));
    } catch {
      setMsgs((m) => [...m, { who: "bot", text: L.err }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="asst" data-open={open ? "1" : "0"}>
      {open && (
        <section className="asst-panel" role="dialog" aria-label={L.title}>
          <header className="asst-head">
            <span className="asst-av">✦</span>
            <span><b>{L.title}</b><small>{L.sub}</small></span>
            <button type="button" className="asst-x" onClick={() => setOpen(false)} aria-label={L.close}>×</button>
          </header>
          <div className="asst-body" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`asst-m ${m.who}`}>
                <p>{m.text}</p>
                {m.links && m.links.length > 0 && (
                  <div className="asst-links">{m.links.map((l) => <a key={l.url} href={l.url}>{l.label} →</a>)}</div>
                )}
              </div>
            ))}
            {busy && <div className="asst-m bot"><p className="asst-dots"><i /><i /><i /></p></div>}
            <div ref={end} />
          </div>
          <div className="asst-chips">{chips.map((c) => <button key={c} type="button" onClick={() => ask(c)}>{c}</button>)}</div>
          <form className="asst-form" onSubmit={(e) => { e.preventDefault(); ask(val); }}>
            <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={L.ph} maxLength={300} aria-label={L.ph} />
            <button disabled={busy || !val.trim()}>{L.send}</button>
          </form>
        </section>
      )}
      <button type="button" className="asst-fab" onClick={() => setOpen((o) => !o)} aria-label={L.open} aria-expanded={open}>
        <span>{open ? "×" : "✦"}</span>{!open && <em>{L.open}</em>}
      </button>
    </div>
  );
}
