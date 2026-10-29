"use client";

import { useCallback, useEffect, useState } from "react";
import { errorSummary } from "@/components/Form";
import { api, mediaUrl } from "@/lib/api";

const WEB = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
const LANGS = [
  { k: "uz", label: "Özbekça" },
  { k: "en", label: "English" },
  { k: "ja", label: "日本語" },
] as const;

type Values = Record<string, any>;
type Section = { key: string; label: string; hint: string; fields: string[]; customized: boolean; values: Values };
type Page = { key: string; label: string; path: string; sections: Section[] };

function SectionEditor({ sec, pagePath, onSaved }: { sec: Section; pagePath: string; onSaved: (s: Section) => void }) {
  const has = (f: string) => sec.fields.includes(f);
  const [lang, setLang] = useState<(typeof LANGS)[number]["k"]>("uz");
  const [vals, setVals] = useState<Values>(() => ({ ...sec.values }));
  const [img, setImg] = useState<File | null>(null);
  const [vid, setVid] = useState<File | null>(null);
  const [clearImg, setClearImg] = useState(false);
  const [clearVid, setClearVid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState<{ img: string | null; vid: string | null }>({ img: null, vid: null });

  useEffect(() => {
    const a = img ? URL.createObjectURL(img) : null;
    const b = vid ? URL.createObjectURL(vid) : null;
    setPreview({ img: a, vid: b });
    return () => { if (a) URL.revokeObjectURL(a); if (b) URL.revokeObjectURL(b); };
  }, [img, vid]);

  const set = (k: string, v: string) => setVals((o) => ({ ...o, [k]: v }));
  const curImg = clearImg ? null : preview.img || mediaUrl(sec.values.image);
  const curVid = clearVid ? null : preview.vid || mediaUrl(sec.values.video);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const keys = ["title", "text", "link_label"].filter((b) => has(b === "link_label" ? "link" : b)).flatMap((b) => LANGS.map((l) => `${b}_${l.k}`));
      if (has("link")) keys.push("link_url");
      let res: Section;
      if (img || vid) {
        const fd = new FormData();
        keys.forEach((k) => fd.append(k, vals[k] ?? ""));
        if (img) fd.append("image", img);
        if (vid) fd.append("video", vid);
        if (clearImg && !img) fd.append("clear_image", "1");
        if (clearVid && !vid) fd.append("clear_video", "1");
        res = await api(`/pages/${sec.key}/`, { method: "PATCH", form: fd });
      } else {
        const json: Values = {};
        keys.forEach((k) => (json[k] = vals[k] ?? ""));
        if (clearImg) json.clear_image = "1";
        if (clearVid) json.clear_video = "1";
        res = await api(`/pages/${sec.key}/`, { method: "PATCH", json });
      }
      setImg(null); setVid(null); setClearImg(false); setClearVid(false);
      setVals({ ...res.values });
      onSaved(res);
      setMsg({ ok: true, text: "Saqlandi. Saytda darhol körinadi." });
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!confirm("Bu bölim standart (dastlabki) holatga qaytarilsinmi? Kiritilgan matn va fayllar öçadi.")) return;
    setBusy(true);
    setMsg(null);
    try {
      await api(`/pages/${sec.key}/`, { method: "DELETE" });
      const blank: Section = { ...sec, customized: false, values: {} };
      setVals({}); setImg(null); setVid(null); setClearImg(false); setClearVid(false);
      onSaved(blank);
      setMsg({ ok: true, text: "Standart holatga qaytarildi." });
    } catch (e) {
      setMsg({ ok: false, text: errorSummary(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card pg-sec">
      <div className="pg-sec-head">
        <div>
          <h3>{sec.label}</h3>
          <small className="muted">{sec.hint}</small>
        </div>
        <span className={`pg-chip ${sec.customized ? "own" : ""}`}>{sec.customized ? "Özgartirilgan" : "Standart"}</span>
      </div>

      {(has("title") || has("text") || has("link")) && (
        <>
          <div className="tabs pg-langs" role="tablist" aria-label="Til">
            {LANGS.map((l) => (
              <button key={l.k} type="button" role="tab" aria-selected={lang === l.k} onClick={() => setLang(l.k)}>{l.label}</button>
            ))}
          </div>
          <div className="pg-fields">
            {has("title") && (
              <label className="field full">
                <span className="label">Sarlavha</span>
                <input value={vals[`title_${lang}`] || ""} onChange={(e) => set(`title_${lang}`, e.target.value)} placeholder="Boş qolsa — standart sarlavha" />
              </label>
            )}
            {has("text") && (
              <label className="field full">
                <span className="label">Matn</span>
                <textarea rows={4} value={vals[`text_${lang}`] || ""} onChange={(e) => set(`text_${lang}`, e.target.value)} placeholder="Boş qolsa — standart matn" />
              </label>
            )}
            {has("link") && (
              <>
                <label className="field">
                  <span className="label">Tugma yozuvi</span>
                  <input value={vals[`link_label_${lang}`] || ""} onChange={(e) => set(`link_label_${lang}`, e.target.value)} placeholder="Standart yozuv" />
                </label>
                <label className="field">
                  <span className="label">Havola (barcha tillar uçun)</span>
                  <input value={vals.link_url || ""} onChange={(e) => set("link_url", e.target.value)} placeholder="/universities yoki https://…" />
                </label>
              </>
            )}
          </div>
        </>
      )}

      {(has("image") || has("video")) && (
        <div className="pg-media">
          {has("image") && (
            <div className="pg-m">
              <span className="label">Rasm</span>
              <div className="pg-thumb">{curImg ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={curImg} alt="" /> : <em>Standart rasm</em>}</div>
              <div className="sl-act">
                <label className="btn outline sm">
                  {curImg ? "Almaştiriş" : "Yuklaş"}
                  <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { setImg(f); setClearImg(false); } }} />
                </label>
                {curImg && <button type="button" className="btn ghost sm" onClick={() => { setImg(null); setClearImg(true); }}>Öçirish</button>}
              </div>
            </div>
          )}
          {has("video") && (
            <div className="pg-m">
              <span className="label">Video (MP4 / WebM)</span>
              <div className="pg-thumb">{curVid ? <video src={curVid} muted loop playsInline controls /> : <em>Video yöq</em>}</div>
              <div className="sl-act">
                <label className="btn outline sm">
                  {curVid ? "Almaştiriş" : "Yuklaş"}
                  <input type="file" hidden accept="video/mp4,video/webm" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { setVid(f); setClearVid(false); } }} />
                </label>
                {curVid && <button type="button" className="btn ghost sm" onClick={() => { setVid(null); setClearVid(true); }}>Öçirish</button>}
              </div>
              <small className="muted">Video yuklansa, rasm uning «muqovasi» bölib qoladi.</small>
            </div>
          )}
        </div>
      )}

      {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      <div className="pg-act">
        <button type="button" className="btn primary sm" disabled={busy} onClick={save}>{busy ? "Saqlanmoqda…" : "Saqlaş"}</button>
        {sec.customized && <button type="button" className="btn ghost sm" disabled={busy} onClick={reset}>Standartga qaytariş</button>}
        <a className="btn ghost sm" href={`${WEB}/uz${pagePath}`} target="_blank" rel="noopener noreferrer">Saytda körish ↗</a>
      </div>
    </div>
  );
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [cur, setCur] = useState("home");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await api<{ pages: Page[] }>("/pages/");
      setPages(d.pages);
    } catch (e) {
      setErr(errorSummary(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const page = pages.find((p) => p.key === cur) || pages[0];
  const update = (s: Section) => setPages((ps) => ps.map((p) => ({ ...p, sections: p.sections.map((x) => (x.key === s.key ? { ...x, ...s } : x)) })));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Sahifalar va bölimlar</h1>
          <p>Saytdagi sahifalarning har bir bölimini — matn, rasm, video va havolani — şu yerdan özgartiring.</p>
        </div>
      </div>
      {err && <div className="notice err">{err}</div>}
      {loading && <p className="muted">Yuklanmoqda…</p>}
      {pages.length > 0 && (
        <div className="tabs" role="tablist" aria-label="Sahifalar">
          {pages.map((p) => (
            <button key={p.key} type="button" role="tab" aria-selected={page?.key === p.key} onClick={() => setCur(p.key)}>{p.label}</button>
          ))}
        </div>
      )}
      {page && (
        <div className="pg-list">
          {page.sections.map((s) => (
            <SectionEditor key={page.key + s.key + String(s.customized)} sec={s} pagePath={page.path} onSaved={update} />
          ))}
        </div>
      )}
    </>
  );
}
