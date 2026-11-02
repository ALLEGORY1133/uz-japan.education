"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { blankValues, buildFormData, errorSummary, FieldDef, FormFields, initValues } from "@/components/Form";
import { api } from "@/lib/api";
import type { Operator } from "@/components/Operators";

const ADDRESS: FieldDef[] = [{ name: "address", label: "Manzil", tr: true }];
const MAIL_PHONE: FieldDef[] = [
  { name: "contact_email", label: "Email", type: "email" },
  { name: "contact_phone", label: "Telefon" },
];
const SOCIAL: { name: string; label: string; ph: string; color: string; icon: ReactNode }[] = [
  { name: "telegram_url", label: "Telegram", ph: "https://t.me/…", color: "#229ed9", icon: <path d="M21.5 3.5L2.5 10.8l6.2 2.3 2.3 6.4 3.2-4.2 5.3 3.9zM8.7 13.1l12.8-9.6" /> },
  { name: "instagram_url", label: "Instagram", ph: "https://instagram.com/…", color: "#e1306c", icon: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" /></> },
  { name: "youtube_url", label: "YouTube", ph: "https://youtube.com/…", color: "#ff0033", icon: <><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.5v5l4.5-2.5z" /></> },
  { name: "linkedin_url", label: "LinkedIn", ph: "https://linkedin.com/…", color: "#0a66c2", icon: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></> },
];
const ALL_FIELDS: FieldDef[] = [...ADDRESS, ...MAIL_PHONE, ...SOCIAL.map((s) => ({ name: s.name, label: s.label, type: "url" } as FieldDef))];

function Ic({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
  );
}
const MailI = <Ic><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></Ic>;
const PhoneI = <Ic><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Ic>;
const PinI = <Ic><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Ic>;
const TgI = <Ic>{SOCIAL[0].icon}</Ic>;

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "•";
const EMPTY_OP: Operator = { name: "", role: "", email: "", phone: "", telegram: "" };
type Cand = { id: number; name: string; role: string; email?: string };

function SupportTab() {
  const [ops, setOps] = useState<Operator[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<Cand[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api("/operators/candidates/").then((c) => { setUsers(c.users || []); setRoles(c.roles || []); }).catch(() => {});
    api("/site-settings/").then((d) => setOps((d.operators || []).map((o: any) => ({ ...EMPTY_OP, ...o })))).catch((e) => setMsg({ ok: false, text: errorSummary(e) }));
  }, []);

  const set = (i: number, k: keyof Operator, v: string) => setOps((s) => s!.map((o, j) => (j === i ? { ...o, [k]: v } : o)));
  const picked = useMemo(() => new Set((ops || []).map((o) => o.name.trim().toLowerCase())), [ops]);
  const shown = users.filter((u) => !picked.has(u.name.trim().toLowerCase()) && `${u.name} ${u.role} ${u.email || ""}`.toLowerCase().includes(q.trim().toLowerCase()));

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const d = await api("/site-settings/", { method: "PATCH", json: { operators: ops } });
      setOps((d.operators || []).map((o: any) => ({ ...EMPTY_OP, ...o })));
      setMsg({ ok: true, text: "Texnik yordam xodimlari saqlandi." });
    } catch (err: any) {
      setMsg({ ok: false, text: err?.data?.operators?.[0] || errorSummary(err) });
    } finally {
      setBusy(false);
    }
  }

  if (!ops) return msg ? <div className="notice err">{msg.text}</div> : <p className="muted">Yuklanmoqda…</p>;
  return (
    <div className="sp">
      {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}

      <div className="card sp-pick">
        <h2>Xodim tanlaş</h2>
        <p className="muted">Panel xodimlaridan birini bosing — u ro’yxatga qöşiladi. Ma’lumotlarini pastda to’ldirasiz.</p>
        <input className="sp-search" type="search" placeholder="Ism, lavozim yoki email bo’yiça izlaş…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="sp-people">
          {shown.map((u) => (
            <button type="button" key={u.id} className="sp-person" disabled={ops.length >= 8} onClick={() => setOps([...ops, { ...EMPTY_OP, name: u.name, role: u.role, email: u.email || "" }])}>
              <span className="sp-av">{initials(u.name)}</span>
              <span className="sp-pt"><b>{u.name}</b><small>{u.role}</small></span>
              <span className="sp-plus" aria-hidden="true">+</span>
            </button>
          ))}
          {!shown.length && <p className="muted">{users.length ? "Mos xodim topilmadi yoki hammasi qöşilgan." : "Xodimlar ro’yxati bosh."}</p>}
        </div>
      </div>

      <div className="card">
        <div className="sp-head">
          <h2>Texnik yordam xodimlari <span className="sp-count">{ops.length}/8</span></h2>
          {ops.length < 8 && <button type="button" className="btn ghost sm" onClick={() => setOps([...ops, { ...EMPTY_OP }])}>+ Qöl bilan qöşiş</button>}
        </div>
        <datalist id="op-roles">{roles.map((r) => <option key={r} value={r} />)}</datalist>
        {!ops.length && <p className="muted">Hali xodim qöşilmagan. Yuqoridan tanlang.</p>}
        <div className="sp-list">
          {ops.map((o, i) => (
            <div key={i} className="sp-card">
              <div className="sp-card-top">
                <span className="sp-av lg">{initials(o.name || o.role)}</span>
                <div className="sp-id">
                  <input className="sp-name" placeholder="Ism familiya" value={o.name} onChange={(e) => set(i, "name", e.target.value)} />
                  <input className="sp-role" placeholder="Lavozimi" list="op-roles" value={o.role} onChange={(e) => set(i, "role", e.target.value)} />
                </div>
                <button type="button" className="btn ghost sm" onClick={() => setOps(ops.filter((_, j) => j !== i))} aria-label="Xodimni öçiriş">Öçiriş</button>
              </div>
              <div className="sp-fields">
                <label className="sp-in"><span className="sp-ic">{MailI}</span><input type="email" placeholder="email@misol.uz" value={o.email} onChange={(e) => set(i, "email", e.target.value)} /></label>
                <label className="sp-in"><span className="sp-ic">{PhoneI}</span><input placeholder="+998 90 123 45 67" value={o.phone} onChange={(e) => set(i, "phone", e.target.value)} /></label>
                <label className="sp-in"><span className="sp-ic" style={{ color: "#229ed9" }}>{TgI}</span><input placeholder="@username" value={o.telegram} onChange={(e) => set(i, "telegram", e.target.value)} /></label>
              </div>
            </div>
          ))}
        </div>
        <div className="form-foot">
          <button type="button" className="btn primary" disabled={busy} onClick={save}>{busy ? "Saqlanmoqda…" : "Saqlaş"}</button>
        </div>
      </div>
    </div>
  );
}

function ContactTab() {
  const [values, setValues] = useState<Record<string, any> | null>(null);
  const [errors, setErrors] = useState<any>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/site-settings/").then((d) => setValues(initValues(ALL_FIELDS, d))).catch((e) => setMsg({ ok: false, text: errorSummary(e) }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors(null);
    try {
      const d = await api("/site-settings/", { method: "PATCH", form: buildFormData(ALL_FIELDS, values!) });
      setValues(initValues(ALL_FIELDS, d));
      setMsg({ ok: true, text: "Saqlandi." });
    } catch (err: any) {
      setErrors(err?.data);
      setMsg({ ok: false, text: errorSummary(err) });
    } finally {
      setBusy(false);
    }
  }

  if (!values) return <p className="muted">Yuklanmoqda…</p>;
  const on = (k: string, v: any) => setValues((s) => ({ ...s!, [k]: v }));
  return (
    <form className="sp" onSubmit={submit}>
      {msg && <div className={`notice ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      <div className="card sp-sec">
        <h2><span className="sp-ic">{PinI}</span> Manzil</h2>
        <FormFields fields={ADDRESS} values={values} errors={errors} onChange={on} />
      </div>
      <div className="card sp-sec">
        <h2><span className="sp-ic">{MailI}</span> Email va <span className="sp-ic">{PhoneI}</span> telefon</h2>
        <FormFields fields={MAIL_PHONE} values={values} errors={errors} onChange={on} />
      </div>
      <div className="card sp-sec">
        <h2>Ijtimoiy tarmoqlar</h2>
        <div className="sp-social">
          {SOCIAL.map((s) => (
            <label key={s.name} className="sp-in sp-soc">
              <span className="sp-ic sp-brand" style={{ background: s.color }}><Ic color="#fff">{s.icon}</Ic></span>
              <span className="sp-soc-body">
                <small>{s.label}</small>
                <input type="url" placeholder={s.ph} value={values[s.name] || ""} onChange={(e) => on(s.name, e.target.value)} />
              </span>
            </label>
          ))}
        </div>
        {errors && SOCIAL.some((s) => errors[s.name]) && <p className="notice err">Havola noto’g’ri kiritilgan.</p>}
      </div>
      <div className="form-foot">
        <button className="btn primary" disabled={busy}>{busy ? "Saqlanmoqda…" : "Saqlaş"}</button>
        <button type="button" className="btn ghost" disabled={busy} onClick={() => { setValues(blankValues(ALL_FIELDS)); setErrors(null); setMsg(null); }}>Tozalaş</button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<"contact" | "support">("contact");
  return (
    <>
      <div className="page-head">
        <div><h1>Sozlamalar</h1><p>{tab === "contact" ? "Sayt footer’idagi manzil, email, telefon va ijtimoiy tarmoq havolalari." : "Texnik yordam xodimlari: email, telefon va Telegram."}</p></div>
      </div>
      <div className="set-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "contact"} className={tab === "contact" ? "on" : ""} onClick={() => setTab("contact")}>Aloqa</button>
        <button type="button" role="tab" aria-selected={tab === "support"} className={tab === "support" ? "on" : ""} onClick={() => setTab("support")}>Texnik yordam</button>
      </div>
      {tab === "support" ? <SupportTab /> : <ContactTab />}
    </>
  );
}
