"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { blankValues, buildFormData, errorSummary, FieldDef, FormFields, initValues } from "@/components/Form";
import Icon from "@/components/Icon";
import ResourceManager from "@/components/ResourceManager";
import { api, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  ADMISSION_FIELDS, FUNDING_FIELDS, LINK_FIELDS, MAIN_FIELDS, MEDIA_FIELDS, PROGRAM_FIELDS, REQUIREMENT_FIELDS,
} from "../fields";

const TABS = [
  ["main", "Asosiy"], ["admission", "Qabul va muddatlar"], ["funding", "Kontrakt va grant"],
  ["req", "Talablar"], ["prog", "Yönalişlar"], ["media", "Rasm va video"], ["links", "Havolalar"],
] as const;

function UniversityForm({ id, fields, uni, onSaved }: { id: string; fields: FieldDef[]; uni: any; onSaved: (u: any) => void }) {
  const { isAdmin } = useAuth();
  const [values, setValues] = useState(() => initValues(fields, uni));
  const [errors, setErrors] = useState<any>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors(null);
    setMsg(null);
    try {
      const visible = fields.filter((f) => !(f.adminOnly && !isAdmin));
      const saved = await api(`/universities/${id}/`, { method: "PATCH", form: buildFormData(visible, values) });
      onSaved(saved);
      setValues(initValues(fields, saved));
      setMsg({ ok: true, text: "Saqlandi." });
    } catch (err: any) {
      setErrors(err?.data);
      setMsg({ ok: false, text: errorSummary(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`} role="status">{msg.text}</div>}
      <FormFields fields={fields} values={values} errors={errors} isAdmin={isAdmin} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
      <div className="form-foot">
        <button className="btn primary" disabled={busy}>{busy ? "Saqlanmoqda…" : "Saqlaş"}</button>
        <button type="button" className="btn ghost" disabled={busy} onClick={() => { setValues(blankValues(fields)); setErrors(null); setMsg(null); }}>Tozalaş</button>
      </div>
    </form>
  );
}

export default function UniversityEdit() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [uni, setUni] = useState<any>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("main");

  useEffect(() => {
    api(`/universities/${id}/`).then(setUni).catch((e) => setErr(errorSummary(e)));
  }, [id]);

  if (err) return <div className="notice err">{err}</div>;
  if (!uni) return <div className="muted">Yuklanmoqda…</div>;

  const scope = { university: id };
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{uni.name || uni.slug}</h1>
          <p>
            {uni.logo && <img src={mediaUrl(uni.logo)} alt="" style={{ height: 24, verticalAlign: "middle", marginRight: 8 }} />}
            Ma’lumotlar o‘zgarishi ommaviy saytdagi qabul sahifasida darhol ko‘rinadi.
          </p>
        </div>
        <a className="btn outline sm" href={`${process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"}/uz/universities/${uni.slug}`} target="_blank" rel="noopener noreferrer">
          Saytda ko‘rish ↗
        </a>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === "main" && <UniversityForm key="main" id={id} fields={MAIN_FIELDS} uni={uni} onSaved={setUni} />}
      {tab === "admission" && <UniversityForm key="adm" id={id} fields={ADMISSION_FIELDS} uni={uni} onSaved={setUni} />}
      {tab === "funding" && <UniversityForm key="fun" id={id} fields={FUNDING_FIELDS} uni={uni} onSaved={setUni} />}
      {tab === "req" && (
        <ResourceManager endpoint="/requirements/" fields={REQUIREMENT_FIELDS} query={scope} fixed={scope} reorder isAdmin={isAdmin}
          addLabel="+ Talab qöşiş" row={(r) => ({ title: r.title, sub: r.detail })} />
      )}
      {tab === "prog" && (
        <ResourceManager endpoint="/programs/" fields={PROGRAM_FIELDS} query={scope} fixed={scope} defaults={{ level: "bachelor" }} reorder isAdmin={isAdmin}
          addLabel="+ Yönaliş qöşiş" row={(p) => ({ title: p.name, sub: p.level })} />
      )}
      {tab === "media" && (
        <div className="mp mp-flat">
          <header className="mp-head">
            <span className="mp-ico"><Icon name="media" size={24} /></span>
            <div><h2>Rasm va videolar</h2><p>Universitet sahifasidagi galereya. Bir vaqtning özida köp fayl taşlang, tartibni ↑ ↓ bilan özgartiring.</p></div>
          </header>
        <ResourceManager endpoint="/university-media/" fields={MEDIA_FIELDS} query={scope} fixed={scope} defaults={{ kind: "image", slot: "gallery", is_visible: true }}
          reorder layout="grid" toggle={{ field: "is_visible", on: "Yaşiriş", off: "Körsatiş" }} isAdmin={isAdmin}
          addLabel="+ Rasm / video qöşiş" bulk={{ field: "file", label: "Köp rasm/video yuklaş" }}
          emptyText="Rasm va videolar şu yerdagi tartibda saytda körinadi. Tartibni ↑ ↓ tugmalari bilan özgartiring."
          row={(m) => ({
            title: m.caption || (m.kind === "video" ? "Video" : "Rasm"),
            sub: m.slot === "campus_video" ? "Kampus videosi" : "Galereya",
            thumb: m.kind === "image" && m.file ? mediaUrl(m.file) : null,
            video: m.kind === "video",
          })} />
        </div>
      )}
      {tab === "links" && (
        <ResourceManager endpoint="/useful-links/" fields={LINK_FIELDS} query={scope} fixed={scope} defaults={{ icon: "other", is_external: true, is_visible: true }}
          reorder toggle={{ field: "is_visible", on: "Yaşiriş", off: "Körsatiş" }} isAdmin={isAdmin}
          addLabel="+ Havola qöşiş" row={(l) => ({ title: l.title, sub: l.url })} />
      )}
    </>
  );
}
