"use client";

import { useCallback, useEffect, useState } from "react";
import { errorSummary } from "@/components/Form";
import { api, listOf, mediaUrl } from "@/lib/api";

const WEB = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

type Slot = { key: string; label: string; where: string; demo: string; video?: boolean };
type Rec = { id: number; key: string; kind: "image" | "video"; image: string | null; video: string | null; video_url: string };

const GALLERY = ["fuji", "registan", "torii", "campus", "tokyo", "dome", "kyoto", "grad", "bridge", "lantern", "train", "desk"];

const GROUPS: { title: string; hint: string; slots: Slot[] }[] = [
  {
    title: "Boş sahifa — katta bölimlar",
    hint: "Boş sahifaning eng közga taşlanadigan joylari.",
    slots: [
      { key: "video_band", label: "Katta video yoki rasm", where: "«Biz haqimizda» bandi (matn orqasida)", demo: "fuji", video: true },
      { key: "apply_bg", label: "Ariza bandi foni", where: "Sahifa pastidagi «Savollaringiz bormi?» bandi", demo: "lantern", video: true },
      { key: "students_card", label: "Talaba kabineti kartasi", where: "«Talaba kabineti» karuselidagi birinchi karta", demo: "desk" },
    ],
  },
  {
    title: "Galereya lentasi",
    hint: "Statistikadan keyin doimiy aylanib turadigan 12 ta rasm. Har birini alohida almaştirish mumkin.",
    slots: GALLERY.map((d, i) => ({ key: `gallery_${i + 1}`, label: `Rasm ${i + 1}`, where: "Aylanuvçi galereya lentasi", demo: d })),
  },
];

export default function SiteMediaPage() {
  const [recs, setRecs] = useState<Record<string, Rec>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api("/site-media/");
      const m: Record<string, Rec> = {};
      listOf<Rec>(d).forEach((r) => (m[r.key] = r));
      setRecs(m);
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function upload(slot: Slot, file: File) {
    const isVideo = file.type.startsWith("video/");
    const fd = new FormData();
    fd.append("key", slot.key);
    fd.append("kind", isVideo ? "video" : "image");
    fd.append(isVideo ? "video" : "image", file);
    const cur = recs[slot.key];
    setBusy(slot.key);
    setMsg(null);
    try {
      if (cur) await api(`/site-media/${cur.id}/`, { method: "PATCH", form: fd });
      else await api("/site-media/", { method: "POST", form: fd });
      await load();
      setMsg({ ok: true, text: `«${slot.label}» almaştirildi. Saytda darhol körinadi.` });
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    } finally {
      setBusy(null);
    }
  }

  async function reset(slot: Slot) {
    const cur = recs[slot.key];
    if (!cur || !confirm("Standart (demo) rasmga qaytarilsinmi?")) return;
    setBusy(slot.key);
    try {
      await api(`/site-media/${cur.id}/`, { method: "DELETE" });
      await load();
      setMsg({ ok: true, text: "Standart rasmga qaytarildi." });
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Sayt rasm va videolari</h1>
          <p>Boş sahifadagi rasm va videolarni şu yerdan almaştiring.</p>
        </div>
      </div>
      <div className="card sl-help">
        <b>Qanday almaştiriladi?</b>
        <ol>
          <li>Kerakli kartadagi <b>«Yuklaş / Almaştiriş»</b> tugmasini bosing.</li>
          <li>Kompyuterdan rasm (JPG, PNG, WebP) yoki video (MP4) tanlang. Katta joylarga <b>gorizontal rasm (1600×900 dan katta)</b> mos.</li>
          <li>Yuklanib bölgach saytda darhol almaşadi. <b>«Standartga qaytariş»</b> demo rasmni qaytaradi.</li>
        </ol>
        <p className="muted">Yangilik rasmlari — «Yangilik va tadbirlar», universitet banneri — «Universitetlar», yuqoridagi katta slayder — «Boş sahifa slayderi» bölimida.</p>
      </div>
      {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      {GROUPS.map((g) => (
        <section key={g.title} className="sl-group">
          <h2>{g.title}</h2>
          <p className="muted">{g.hint}</p>
          <div className="sl-grid">
            {g.slots.map((s) => {
              const r = recs[s.key];
              const own = !!r;
              const img = r?.kind === "image" && r.image ? mediaUrl(r.image) : null;
              const vid = r?.kind === "video" && r.video ? mediaUrl(r.video) : null;
              return (
                <div key={s.key} className="sl-card">
                  <div className="sl-pic">
                    {vid ? <video src={vid} muted loop autoPlay playsInline /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={img || `${WEB}/demo/${s.demo}.jpg`} alt="" />}
                    <span className={`sl-chip ${own ? "own" : ""}`}>{own ? (vid ? "Sizning videongiz" : "Sizning rasmingiz") : "Standart (demo)"}</span>
                  </div>
                  <div className="sl-body">
                    <b>{s.label}</b>
                    <small>{s.where}</small>
                    <div className="sl-act">
                      <label className={`btn primary sm ${busy === s.key ? "disabled" : ""}`}>
                        {busy === s.key ? "Yuklanmoqda…" : own ? "Almaştiriş" : "Yuklaş"}
                        <input type="file" hidden disabled={busy === s.key} accept={s.video ? "image/*,video/*" : "image/*"} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(s, f); }} />
                      </label>
                      {own && <button type="button" className="btn ghost sm" disabled={busy === s.key} onClick={() => reset(s)}>Standartga qaytariş</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
