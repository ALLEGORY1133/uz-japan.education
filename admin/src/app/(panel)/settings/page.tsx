"use client";

import { useEffect, useState } from "react";
import { blankValues, buildFormData, errorSummary, FieldDef, FormFields, initValues } from "@/components/Form";
import { api } from "@/lib/api";
import type { Operator } from "@/components/Operators";

const FIELDS: FieldDef[] = [
  { name: "contact_email", label: "Email", type: "email" },
  { name: "contact_phone", label: "Telefon" },
  { name: "address", label: "Manzil", tr: true },
  { name: "telegram_url", label: "Telegram", type: "url" },
  { name: "youtube_url", label: "YouTube", type: "url" },
  { name: "linkedin_url", label: "LinkedIn", type: "url" },
  { name: "instagram_url", label: "Instagram", type: "url" },
];

const EMPTY_OP: Operator = { name: "", role: "", phone: "", telegram: "" };

function OperatorsCard() {
  const [ops, setOps] = useState<Operator[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cand, setCand] = useState<{ users: { id: number; name: string; role: string }[]; roles: string[] }>({ users: [], roles: [] });

  useEffect(() => {
    api("/operators/candidates/").then(setCand).catch(() => {});
  }, []);

  useEffect(() => {
    api("/site-settings/").then((d) => setOps(d.operators || [])).catch((e) => setMsg({ ok: false, text: errorSummary(e) }));
  }, []);

  const set = (i: number, k: keyof Operator, v: string) => setOps((s) => s!.map((o, j) => (j === i ? { ...o, [k]: v } : o)));

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const d = await api("/site-settings/", { method: "PATCH", json: { operators: ops } });
      setOps(d.operators || []);
      setMsg({ ok: true, text: "Operatorlar saqlandi." });
    } catch (err: any) {
      setMsg({ ok: false, text: err?.data?.operators?.[0] || errorSummary(err) });
    } finally {
      setBusy(false);
    }
  }

  if (!ops) return null;
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Aloqa operatorlari</h2>
      <p className="muted" style={{ margin: "0 0 14px" }}>Xodimni bazadan tanlang (ism va lavozim avtomatik töladi) yoki qöl bilan yozing. Footerda ikonkalar bilan körinadi. Har biriga telefon yoki Telegram kiriting (ko‘pi bilan 8 ta).</p>
      {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      <datalist id="op-roles">{cand.roles.map((r) => <option key={r} value={r} />)}</datalist>
      {ops.map((o, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr)) auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <select
            aria-label="Bazadagi xodimni tanlaş"
            value=""
            onChange={(e) => {
              const u = cand.users.find((x) => String(x.id) === e.target.value);
              if (u) setOps((s) => s!.map((o, j) => (j === i ? { ...o, name: u.name, role: u.role } : o)));
            }}
          >
            <option value="">Xodimni tanlaş…</option>
            {cand.users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
          </select>
          <input placeholder="Ismi" value={o.name} onChange={(e) => set(i, "name", e.target.value)} aria-label="Operator ismi" />
          <input placeholder="Lavozimi (ixtiyoriy)" list="op-roles" value={o.role} onChange={(e) => set(i, "role", e.target.value)} aria-label="Lavozimi" />
          <input placeholder="+998 90 123 45 67" value={o.phone} onChange={(e) => set(i, "phone", e.target.value)} aria-label="Telefon" />
          <input placeholder="@telegram" value={o.telegram} onChange={(e) => set(i, "telegram", e.target.value)} aria-label="Telegram" />
          <button type="button" className="btn ghost" onClick={() => setOps(ops.filter((_, j) => j !== i))} aria-label="Operatorni öçiriş">✕</button>
        </div>
      ))}
      <div className="form-foot">
        {ops.length < 8 && <button type="button" className="btn ghost" onClick={() => setOps([...ops, { ...EMPTY_OP }])}>+ Operator qöşiş</button>}
        <button type="button" className="btn primary" disabled={busy} onClick={save}>{busy ? "Saqlanmoqda…" : "Saqlaş"}</button>
      </div>
    </div>
  );
}

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
        <div><h1>Sozlamalar</h1><p>Sayt footer’idagi aloqa ma’lumotlari va ijtimoiy tarmoq havolalari. «Foydali havolalar» alohida bölimda.</p></div>
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
      <OperatorsCard />
    </>
  );
}
