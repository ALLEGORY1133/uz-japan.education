"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { api, listOf, mediaUrl } from "@/lib/api";
import QualitySelect from "./QualitySelect";
import { blankValues, buildFormData, errorSummary, FieldDef, FormFields, initValues } from "./Form";

export type RowInfo = { title: string; sub?: string; thumb?: string | null; badge?: ReactNode; video?: boolean };

type Props = {
  endpoint: string; // masalan "/hero-slides/"
  fields: FieldDef[];
  row: (item: any) => RowInfo;
  query?: Record<string, string | number>; // ro'yxat filtri
  fixed?: Record<string, any>; // yaratishda doimo yuboriladigan qiymatlar
  defaults?: Record<string, any>;
  clientFilter?: (item: any) => boolean;
  reorder?: boolean;
  toggle?: { field: string; on: string; off: string };
  canCreate?: boolean;
  canDelete?: boolean;
  addLabel?: string;
  emptyText?: string;
  isAdmin?: boolean;
  /** Ko'p fayl birdan yuklash: har bir fayl alohida yozuv bo'ladi (rasm yoki video avtomatik aniqlanadi). */
  bulk?: { field: string; label?: string };
  /** "grid": rasm/video kartochkalari to'ri (galereya uchun), "list": oddiy ro'yxat */
  layout?: "list" | "grid";
};

export default function ResourceManager({
  endpoint, fields, row, query, fixed, defaults, clientFilter, reorder, toggle,
  canCreate = true, canDelete = true, addLabel = "+ Qöşiş", emptyText = "Hozirça yozuv yöq.", isAdmin = true, bulk, layout = "list",
}: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [editing, setEditing] = useState<any | "new" | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const [quality, setQuality] = useState("high");
  const hasFiles = !!bulk || fields.some((f) => f.type === "image" || f.type === "file");
  const [prog, setProg] = useState<{ done: number; total: number } | null>(null);
  const [drag, setDrag] = useState(false);

  async function uploadMany(files: FileList | null) {
    if (!files || !files.length || !bulk) return;
    const list = Array.from(files);
    setProg({ done: 0, total: list.length });
    const failed: string[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const fd = new FormData();
      Object.entries({ ...(defaults || {}), ...(fixed || {}) }).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? (v ? "true" : "false") : String(v)));
      fd.set("kind", f.type.startsWith("video/") ? "video" : "image");
      fd.set(bulk.field, f);
      fd.set("quality", quality);
      try {
        await api(endpoint, { method: "POST", form: fd });
      } catch (err: any) {
        failed.push(`${f.name}: ${errorSummary(err)}`);
      }
      setProg({ done: i + 1, total: list.length });
    }
    setProg(null);
    setNotice(
      failed.length
        ? { kind: "err", text: `${list.length - failed.length}/${list.length} yuklandi. Xatolar: ${failed.join(" | ")}` }
        : { kind: "ok", text: `${list.length} ta fayl yuklandi.` },
    );
    await load();
  }

  const qs = query ? "?" + new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString() : "";

  const load = useCallback(async () => {
    try {
      const data = await api(`${endpoint}${qs}`);
      let list = listOf(data);
      if (clientFilter) list = list.filter(clientFilter);
      setItems(list);
    } catch (e: any) {
      setNotice({ kind: "err", text: errorSummary(e) });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, qs]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setValues(initValues(fields, null, defaults));
    setErrors(null);
    setEditing("new");
  }
  function openEdit(item: any) {
    setValues(initValues(fields, item, defaults));
    setErrors(null);
    setEditing(item);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors(null);
    try {
      const fd = buildFormData(fields, values, editing === "new" ? fixed : {});
      fd.set("quality", quality);
      if (editing === "new") await api(endpoint, { method: "POST", form: fd });
      else await api(`${endpoint}${editing.id}/`, { method: "PATCH", form: fd });
      setEditing(null);
      setNotice({ kind: "ok", text: "Saqlandi." });
      await load();
    } catch (err: any) {
      setErrors(err?.data);
      setNotice({ kind: "err", text: errorSummary(err) });
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: any) {
    if (!window.confirm("Rostdan ham öçirasizmi?")) return;
    try {
      await api(`${endpoint}${item.id}/`, { method: "DELETE" });
      setNotice({ kind: "ok", text: "Öçirildi." });
      await load();
    } catch (err: any) {
      setNotice({ kind: "err", text: errorSummary(err) });
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    try {
      await api(`${endpoint}reorder/`, { method: "POST", json: { ids: next.map((x) => x.id) } });
    } catch (err: any) {
      setNotice({ kind: "err", text: errorSummary(err) });
      load();
    }
  }

  async function flip(item: any) {
    try {
      await api(`${endpoint}${item.id}/`, { method: "PATCH", json: { [toggle!.field]: !item[toggle!.field] } });
      await load();
    } catch (err: any) {
      setNotice({ kind: "err", text: errorSummary(err) });
    }
  }

  return (
    <div className="rm">
      {notice && (
        <div className={`notice ${notice.kind}`} role={notice.kind === "err" ? "alert" : "status"}>
          {notice.text}
          <button type="button" className="x" aria-label="Yopiş" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      {canCreate && (
        <div className="rm-bar">
          <button type="button" className="btn primary" onClick={openNew}>{addLabel}</button>
          {hasFiles && <QualitySelect value={quality} onChange={setQuality} />}
          {bulk && layout !== "grid" && (
            <label className={`btn outline ${prog ? "disabled" : ""}`} style={{ cursor: "pointer" }}>
              {prog ? `Yuklanmoqda… ${prog.done}/${prog.total}` : bulk.label || "Köp fayl yuklaş"}
              <input
                type="file"
                multiple
                hidden
                disabled={!!prog}
                accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                onChange={(e) => {
                  uploadMany(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      )}

      {canCreate && bulk && layout === "grid" && (
        <label
          className={`dropzone${drag ? " over" : ""}${prog ? " busy" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (!prog) uploadMany(e.dataTransfer.files); }}
        >
          <span className="dz-ico" aria-hidden="true">⇪</span>
          <b>{prog ? `Yuklanmoqda… ${prog.done}/${prog.total}` : "Rasm yoki videolarni şu yerga taşlang"}</b>
          <small>yoki bosib tanlang · bir neçta faylni birdan yuklaş mumkin</small>
          {prog && <i className="dz-bar" style={{ width: `${(prog.done / prog.total) * 100}%` }} />}
          <input
            type="file"
            multiple
            hidden
            disabled={!!prog}
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
            onChange={(e) => { uploadMany(e.target.files); e.target.value = ""; }}
          />
        </label>
      )}

      {loading ? (
        <p className="muted">Yuklanmoqda…</p>
      ) : items.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        layout === "grid" ? (
          <ul className="mgrid">
            {items.map((item, i) => {
              const info = row(item);
              const thumb = mediaUrl(info.thumb);
              const hidden = toggle ? !item[toggle.field] : false;
              return (
                <li key={item.id} className={`mcard${hidden ? " is-hidden" : ""}`}>
                  <div className={`mthumb ${info.video ? "video" : ""}`}>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" loading="lazy" />
                    ) : info.video ? (
                      <span className="mplay" aria-hidden="true">▶</span>
                    ) : null}
                    {reorder && <span className="mnum">{i + 1}</span>}
                    {hidden && <span className="mhid">Yaşirin</span>}
                    {info.video && <span className="mkind">Video</span>}
                  </div>
                  <div className="mbody">
                    <b title={info.title}>{info.title}</b>
                    {info.sub && <span className="muted">{info.sub}</span>}
                  </div>
                  <div className="mbar">
                    {reorder && (
                      <span className="mmove">
                        <button type="button" className="icon" aria-label="Oldinga" disabled={i === 0} onClick={() => move(i, -1)}>←</button>
                        <button type="button" className="icon" aria-label="Keyinga" disabled={i === items.length - 1} onClick={() => move(i, 1)}>→</button>
                      </span>
                    )}
                    {toggle && (
                      <button type="button" className="btn ghost sm" onClick={() => flip(item)}>
                        {item[toggle.field] ? toggle.off : toggle.on}
                      </button>
                    )}
                    <button type="button" className="btn outline sm" onClick={() => openEdit(item)}>Tahrirlaş</button>
                    {canDelete && (
                      <button type="button" className="btn danger sm" aria-label="Öçiriş" onClick={() => remove(item)}>Öçiriş</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
        <ul className="rows">
          {items.map((item, i) => {
            const info = row(item);
            const thumb = mediaUrl(info.thumb);
            const hidden = toggle ? !item[toggle.field] : false;
            return (
              <li key={item.id} className="row" style={{ opacity: hidden ? 0.55 : 1 }}>
                {reorder && <span className="pos">{i + 1}</span>}
                <div className={`thumb ${info.video ? "video" : ""}`}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" />
                  ) : info.video ? (
                    <span aria-hidden="true">▶</span>
                  ) : null}
                </div>
                <div className="row-main">
                  <b>{info.title}</b>
                  {info.sub && <span className="muted">{info.sub}</span>}
                </div>
                {info.badge}
                <div className="row-actions">
                  {reorder && (
                    <>
                      <button type="button" className="icon" aria-label="Yuqoriga" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                      <button type="button" className="icon" aria-label="Pastga" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
                    </>
                  )}
                  {toggle && (
                    <button type="button" className="btn ghost sm" onClick={() => flip(item)}>
                      {item[toggle.field] ? toggle.off : toggle.on}
                    </button>
                  )}
                  <button type="button" className="btn outline sm" onClick={() => openEdit(item)}>Tahrirlaş</button>
                  {canDelete && (
                    <button type="button" className="btn danger sm" onClick={() => remove(item)}>Öçiriş</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        )
      )}

      {editing && (
        <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}>
          <form className="modal" role="dialog" aria-modal="true" onSubmit={save}>
            <div className="modal-head">
              <h3>{editing === "new" ? addLabel.replace("+ ", "") : "Tahrirlaş"}</h3>
              <button type="button" className="icon" aria-label="Yopiş" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="modal-body">
              <FormFields
                fields={fields}
                values={values}
                errors={errors}
                isAdmin={isAdmin}
                onChange={(name, v) => setValues((s) => ({ ...s, [name]: v }))}
              />
              {hasFiles && <div style={{ marginTop: 14 }}><QualitySelect value={quality} onChange={setQuality} /></div>}
            </div>
            <div className="modal-foot">
              {notice?.kind === "err" && <span className="err">{notice.text}</span>}
              <button type="button" className="btn ghost" disabled={busy} onClick={() => { setValues(blankValues(fields, defaults)); setErrors(null); }}>Tozalaş</button>
              <button type="button" className="btn outline" onClick={() => setEditing(null)}>Bekor qiliş</button>
              <button type="submit" className="btn primary" disabled={busy}>{busy ? "Saqlanmoqda…" : "Saqlaş"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
