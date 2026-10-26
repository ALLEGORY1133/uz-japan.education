"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type Msg = { who: "me" | "bot"; text: string; links?: { label: string; url: string }[] };

export default function AdminAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ who: "bot", text: "Salom! Arizalar, statuslar, murojaatlar va universitetlar haqida so‘rang. Masalan: «yangi arizalar», «Kyoto arizalari», «UJ-… holati»." }]);
  const [chips, setChips] = useState<string[]>(["Jami arizalar", "Yangi arizalar", "Bugungi arizalar", "Kutilayotgan murojaatlar"]);
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
      const d = await api<{ answer: string; links?: { label: string; url: string }[]; suggestions?: string[] }>("/assistant/", { json: { message } });
      setMsgs((m) => [...m, { who: "bot", text: d.answer, links: d.links }]);
      if (Array.isArray(d.suggestions)) setChips(d.suggestions.slice(0, 4));
    } catch {
      setMsgs((m) => [...m, { who: "bot", text: "Xatolik yuz berdi. Birozdan söng qayta urinib köring." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="asst" data-open={open ? "1" : "0"}>
      {open && (
        <section className="asst-panel" role="dialog" aria-label="Yordamchi">
          <header className="asst-head">
            <span className="asst-av">✦</span>
            <span><b>Admin yordamchi</b><small>Arizalar va statistika bo‘yicha savol-javob</small></span>
            <button type="button" className="asst-x" onClick={() => setOpen(false)} aria-label="Yopiş">×</button>
          </header>
          <div className="asst-body" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`asst-m ${m.who}`}>
                <p>{m.text}</p>
                {m.links && m.links.length > 0 && (
                  <div className="asst-links">{m.links.map((l) => <Link key={l.url} href={l.url} onClick={() => setOpen(false)}>{l.label} →</Link>)}</div>
                )}
              </div>
            ))}
            {busy && <div className="asst-m bot"><p className="asst-dots"><i /><i /><i /></p></div>}
            <div ref={end} />
          </div>
          <div className="asst-chips">{chips.map((c) => <button key={c} type="button" onClick={() => ask(c)}>{c}</button>)}</div>
          <form className="asst-form" onSubmit={(e) => { e.preventDefault(); ask(val); }}>
            <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Savolingizni yozing…" maxLength={300} aria-label="Savol" />
            <button disabled={busy || !val.trim()}>Yuborish</button>
          </form>
        </section>
      )}
      <button type="button" className="asst-fab" onClick={() => setOpen((o) => !o)} aria-label="Yordamchi" aria-expanded={open}>
        <span>{open ? "×" : "✦"}</span>{!open && <em>Yordamchi</em>}
      </button>
    </div>
  );
}
