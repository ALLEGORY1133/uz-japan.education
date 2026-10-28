"use client";

import { useEffect, useState } from "react";
import { blankValues, buildFormData, errorSummary, FieldDef, FormFields, initValues } from "@/components/Form";
import { api } from "@/lib/api";

const FIELDS: FieldDef[] = [
  { name: "contact_email", label: "Email", type: "email" },
  { name: "contact_phone", label: "Telefon" },
  { name: "address", label: "Manzil", tr: true },
  { name: "telegram_url", label: "Telegram", type: "url" },
  { name: "youtube_url", label: "YouTube", type: "url" },
  { name: "linkedin_url", label: "LinkedIn", type: "url" },
  { name: "instagram_url", label: "Instagram", type: "url" },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, any> | null>(null);
  const [errors, setErrors] = useState<any>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/site-settings/").then((d) => setValues(initValues(FIELDS, d))).catch((e) => setMsg({ ok: false, text: errorSummary(e) }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors(null);
    try {
      const d = await api("/site-settings/", { method: "PATCH", form: buildFormData(FIELDS, values!) });
      setValues(initValues(FIELDS, d));
      setMsg({ ok: true, text: "Saqlandi." });
    } catch (err: any) {
      setErrors(err?.data);
      setMsg({ ok: false, text: errorSummary(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Sozlamalar</h1><p>Sayt footer’idagi aloqa ma’lumotlari va ijtimoiy tarmoq havolalari. «Foydali havolalar» alohida bo‘limda.</p></div>
      </div>
      {!values ? <p className="muted">Yuklanmoqda…</p> : (
        <form className="card" onSubmit={submit}>
          {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
          <FormFields fields={FIELDS} values={values} errors={errors} onChange={(k, v) => setValues((s) => ({ ...s!, [k]: v }))} />
          <div className="form-foot">
            <button className="btn primary" disabled={busy}>{busy ? "Saqlanmoqda…" : "Saqlaş"}</button>
            <button type="button" className="btn ghost" disabled={busy} onClick={() => { setValues(blankValues(FIELDS)); setErrors(null); setMsg(null); }}>Tozalaş</button>
          </div>
        </form>
      )}
    </>
  );
}
