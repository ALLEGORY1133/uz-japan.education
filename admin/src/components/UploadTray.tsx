"use client";

import { useEffect, useRef, useState } from "react";
import type { UploadEvent } from "@/lib/api";

type Item = UploadEvent & { t0: number; speed: number; last: { t: number; b: number } };

const mb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const eta = (s: number) => (s < 60 ? `${Math.ceil(s)} s` : `${Math.floor(s / 60)} daq ${Math.ceil(s % 60)} s`);

export default function UploadTray() {
  const [items, setItems] = useState<Record<string, Item>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<UploadEvent>).detail;
      setItems((cur) => {
        const prev = cur[d.id];
        const now = Date.now();
        let speed = prev?.speed || 0;
        let last = prev?.last || { t: now, b: 0 };
        if (d.state === "progress" && now - last.t >= 400) {
          const inst = ((d.loaded - last.b) / (now - last.t)) * 1000;
          speed = speed ? speed * 0.7 + inst * 0.3 : inst;
          last = { t: now, b: d.loaded };
        }
        const keep = d.state === "done" || d.state === "error" ? { ...d, loaded: prev?.loaded ?? d.loaded, total: prev?.total ?? d.total } : d;
        return { ...cur, [d.id]: { ...keep, t0: prev?.t0 || now, speed, last } };
      });
      if (d.state === "done" || d.state === "error") {
        clearTimeout(timers.current[d.id]);
        timers.current[d.id] = setTimeout(() => setItems((c) => { const n = { ...c }; delete n[d.id]; return n; }), d.state === "done" ? 2500 : 7000);
      }
    };
    window.addEventListener("uzj-upload", on);
    return () => window.removeEventListener("uzj-upload", on);
  }, []);

  const list = Object.values(items);
  if (!list.length) return null;
  return (
    <div className="upt" role="status" aria-live="polite">
      {list.map((u) => {
        const pct = u.state === "done" ? 100 : Math.min(100, Math.round((u.loaded / Math.max(u.total, 1)) * 100));
        const left = u.speed > 0 ? (u.total - u.loaded) / u.speed : 0;
        return (
          <div key={u.id} className={`upt-card ${u.state}`}>
            <div className="upt-top">
              <b title={u.name}>{u.name}</b>
              {u.state === "progress" || u.state === "processing" ? (
                <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("uzj-upload-cancel", { detail: u.id }))} aria-label="Bekor qiliş">×</button>
              ) : <span>{u.state === "done" ? "✓" : "✕"}</span>}
            </div>
            <div className="upt-bar"><i style={{ width: `${pct}%` }} /></div>
            <small>
              {u.state === "done" ? "Yuklandi"
                : u.state === "error" ? "Yuklab bölmadi"
                : u.state === "processing" ? "Server tekşirmoqda (virus tekşiruvi)…"
                : `${pct}% · ${mb(u.loaded)} / ${mb(u.total)}${u.speed > 0 ? ` · ${mb(u.speed)}/s · ~${eta(left)}` : ""}`}
            </small>
          </div>
        );
      })}
    </div>
  );
}
