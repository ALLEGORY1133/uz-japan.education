"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QualitySelect from "@/components/QualitySelect";
import { useAuth } from "@/lib/auth";
import { api, mediaUrl } from "@/lib/api";
import { errorSummary } from "@/components/Form";

type Item = {
  source: string; id: number; kind: "image" | "video"; url: string; name: string;
  size: number | null; width: number | null; height: number | null; label: string; where: string;
};

const fmt = (n: number | null) => (n == null ? "—" : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function MediaLibraryPage() {
  const { canContent: isAdmin } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "image" | "video">("all");
  const [where, setWhere] = useState("all");
  const [quality, setQuality] = useState("high");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const pick = useRef<Item | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api<Item[]>("/media-library/"));
    } catch (e: any) {
      setNotice({ kind: "err", text: errorSummary(e) });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const places = useMemo(() => Array.from(new Set(items.map((i) => i.where))), [items]);
  const shown = items.filter(
    (i) => (kind === "all" || i.kind === kind) && (where === "all" || i.where === where) &&
      (!q || `${i.label} ${i.name} ${i.where}`.toLowerCase().includes(q.toLowerCase())),
  );
  const total = items.reduce((a, i) => a + (i.size || 0), 0);

  async function remove(it: Item) {
    if (!window.confirm(`“${it.label}” faylini öçirasizmi? Bu amalni qaytarib bölmaydi.`)) return;
    setBusy(`${it.source}:${it.id}`);
    try {
      await api(`/media-library/${it.source}/${it.id}/`, { method: "DELETE" });
      setNotice({ kind: "ok", text: "Öçirildi." });
      await load();
    } catch (e: any) {
      setNotice({ kind: "err", text: errorSummary(e) });
    } finally {
      setBusy(null);
    }
  }

  async function replace(file: File | undefined) {
    const it = pick.current;
    if (!file || !it) return;
    setBusy(`${it.source}:${it.id}`);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("quality", quality);
      await api(`/media-library/${it.source}/${it.id}/`, { method: "PATCH", form: fd });
      setNotice({ kind: "ok", text: "Fayl almaştirildi." });
      await load();
    } catch (e: any) {
      setNotice({ kind: "err", text: errorSummary(e) });
    } finally {
      setBusy(null);
      pick.current = null;
    }
  }

  if (!isAdmin) return <div className="notice err">Bu bölim faqat administrator uçun.</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Media kutubxonasi</h1>
          <p>Saytga yuklangan barça rasm va videolar bir joyda: köriş, almaştiriş va öçiriş (faqat administrator).</p>
        </div>
      </div>

      {notice && (
        <div className={`notice ${notice.kind}`} role={notice.kind === "err" ? "alert" : "status"}>
          {notice.text}
          <button type="button" className="x" aria-label="Yopiş" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <div className="ml-bar">
        <input type="search" placeholder="Qidiriş…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={kind} onChange={(e) => setKind(e.target.value as any)}>
          <option value="all">Rasm va video</option>
          <option value="image">Faqat rasm</option>
          <option value="video">Faqat video</option>
        </select>
        <select value={where} onChange={(e) => setWhere(e.target.value)}>
          <option value="all">Barça joylar</option>
          {places.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <QualitySelect value={quality} onChange={setQuality} />
        <span className="muted ml-total">{items.length} ta fayl · {fmt(total)}</span>
      </div>

      <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
        onChange={(e) => { replace(e.target.files?.[0]); e.target.value = ""; }} />

      {loading ? (
        <p className="muted">Yuklanmoqda…</p>
      ) : shown.length === 0 ? (
        <p className="muted">Fayl topilmadi.</p>
      ) : (
        <ul className="ml-grid">
          {shown.map((it) => {
            const key = `${it.source}:${it.id}`;
            const src = mediaUrl(it.url)!;
            return (
              <li key={key} className="ml-card" style={{ opacity: busy === key ? 0.5 : 1 }}>
                <div className="ml-prev">
                  {it.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" loading="lazy" />
                  ) : (
                    <video src={src} muted preload="metadata" controls playsInline />
                  )}
                  <span className="ml-badge">{it.kind === "video" ? "Video" : "Rasm"}</span>
                </div>
                <div className="ml-meta">
                  <b title={it.label}>{it.label}</b>
                  <span className="muted">{it.where}</span>
                  <span className="muted">
                    {fmt(it.size)}{it.width ? ` · ${it.width}×${it.height}` : ""}
                  </span>
                </div>
                <div className="ml-actions">
                  <a className="btn ghost sm" href={src} target="_blank" rel="noopener noreferrer">Oçiş</a>
                  <button type="button" className="btn outline sm" disabled={busy === key}
                    onClick={() => { pick.current = it; fileRef.current?.click(); }}>Almaştiriş</button>
                  <button type="button" className="btn danger sm" disabled={busy === key} onClick={() => remove(it)}>Öçiriş</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
