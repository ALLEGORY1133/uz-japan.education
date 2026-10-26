"use client";

import { useEffect, useState } from "react";
import { api, listOf, mediaUrl } from "@/lib/api";

export const LANGS = [
  { code: "uz", label: "UZ" },
  { code: "ja", label: "JA" },
  { code: "en", label: "EN" },
] as const;

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "email" | "url" | "number" | "date" | "datetime" | "select" | "bool" | "image" | "file" | "color" | "password";
  tr?: boolean; // 3 tilli: name_uz, name_ja, name_en
  options?: { value: string; label: string }[];
  remote?: { endpoint: string; label: string; empty?: string };
  help?: string;
  required?: boolean;
  showIf?: (values: any) => boolean;
  accept?: string;
  adminOnly?: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO (UTC) -> <input type=datetime-local> uchun brauzer vaqti */
function isoToLocal(v: string): string {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Server obyektidan forma qiymatlarini tayyorlaydi. */
export function initValues(fields: FieldDef[], item: any, defaults: Record<string, any> = {}) {
  const v: Record<string, any> = { ...defaults };
  for (const f of fields) {
    if (f.tr) {
      for (const l of LANGS) v[`${f.name}_${l.code}`] = item?.[`${f.name}_${l.code}`] ?? "";
      continue;
    }
    let val = item ? item[f.name] : defaults[f.name];
    if (f.type === "datetime" && typeof val === "string" && val) val = isoToLocal(val);
    if (f.type === "bool") val = !!val;
    if (val === undefined || val === null) val = f.type === "bool" ? false : "";
    v[f.name] = val;
  }
  return v;
}

/** "Tozalash": barcha maydonlarni bo'sh holatga qaytaradi (tanlovlar — birinchi variant, `defaults` saqlanadi). */
export function blankValues(fields: FieldDef[], defaults: Record<string, any> = {}) {
  const v = initValues(fields, null, defaults);
  for (const f of fields) {
    if (f.type === "select" && !f.remote && !(f.name in defaults)) v[f.name] = f.options?.[0]?.value ?? "";
  }
  return v;
}

/** Forma qiymatlaridan multipart (rasm/video yuklash uchun) FormData yasaydi. */
export function buildFormData(fields: FieldDef[], values: Record<string, any>, fixed: Record<string, any> = {}) {
  const fd = new FormData();
  for (const f of fields) {
    if (f.tr) {
      for (const l of LANGS) fd.append(`${f.name}_${l.code}`, values[`${f.name}_${l.code}`] ?? "");
      continue;
    }
    const v = values[f.name];
    switch (f.type) {
      case "image":
      case "file":
        if (v instanceof File) fd.append(f.name, v);
        break;
      case "bool":
        fd.append(f.name, v ? "true" : "false");
        break;
      case "number":
        if (v !== "" && v !== undefined && v !== null) fd.append(f.name, String(v));
        break;
      case "datetime":
        fd.append(f.name, v ? new Date(v).toISOString() : "");
        break;
      case "password":
        if (v) fd.append(f.name, v);
        break;
      default:
        fd.append(f.name, v ?? "");
    }
  }
  for (const k of Object.keys(fixed)) fd.append(k, String(fixed[k]));
  return fd;
}

export function errorMessages(errors: any, name: string): string[] {
  if (!errors || typeof errors !== "object") return [];
  const keys = [name, ...LANGS.map((l) => `${name}_${l.code}`)];
  const out: string[] = [];
  for (const k of keys) {
    const e = errors[k];
    if (!e) continue;
    out.push(...(Array.isArray(e) ? e : [String(e)]).map(String));
  }
  return out;
}

function RemoteSelect({ f, value, onChange }: { f: FieldDef; value: any; onChange: (v: any) => void }) {
  const [opts, setOpts] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    let alive = true;
    api(f.remote!.endpoint)
      .then((d) => alive && setOpts(listOf(d).map((x: any) => ({ value: String(x.id), label: x[f.remote!.label] || x.username || String(x.id) }))))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [f.remote]);
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={f.required}>
      <option value="">{f.remote!.empty ?? "— tanlang —"}</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function FileInput({ f, value, onChange }: { f: FieldDef; value: any; onChange: (v: any) => void }) {
  const isImage = f.type === "image";
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (value instanceof File && value.type.startsWith("image/")) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [value]);

  const existing = typeof value === "string" ? mediaUrl(value) : null;
  const shown = preview || (isImage || /\.(jpe?g|png|webp|avif)$/i.test(existing || "") ? existing : null);

  return (
    <div className="file-input">
      {shown && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="" className="file-thumb" />
      )}
      {!shown && existing && (
        <a href={existing} target="_blank" rel="noopener noreferrer" className="file-link">Joriy fayl ↗</a>
      )}
      <label className="file-btn">
        {value instanceof File ? value.name : existing ? "Almaştiriş" : "Fayl tanlaş"}
        <input
          type="file"
          accept={f.accept || (isImage ? "image/*" : "image/*,video/*")}
          onChange={(e) => onChange(e.target.files?.[0] || "")}
        />
      </label>
    </div>
  );
}

export function FormFields({
  fields,
  values,
  onChange,
  errors,
  isAdmin = true,
}: {
  fields: FieldDef[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: any;
  isAdmin?: boolean;
}) {
  return (
    <div className="form-grid">
      {fields.map((f) => {
        if (f.adminOnly && !isAdmin) return null;
        if (f.showIf && !f.showIf(values)) return null;
        const errs = errorMessages(errors, f.name);
        const type = f.type || "text";
        const wide = f.tr || type === "textarea" || type === "image" || type === "file";

        if (type === "bool") {
          return (
            <div key={f.name} className="field full">
              <label className="check">
                <input type="checkbox" checked={!!values[f.name]} onChange={(e) => onChange(f.name, e.target.checked)} />
                <span>{f.label}</span>
              </label>
              {f.help && <small className="help">{f.help}</small>}
              {errs.map((m, i) => <small key={i} className="err">{m}</small>)}
            </div>
          );
        }

        return (
          <div key={f.name} className={`field ${wide ? "full" : ""}`}>
            <span className="label">{f.label}{f.required && " *"}</span>
            {f.tr ? (
              <div className="tr-stack">
                {LANGS.map((l) => {
                  const key = `${f.name}_${l.code}`;
                  const Tag: any = type === "textarea" ? "textarea" : "input";
                  return (
                    <div key={l.code} className="tr-row">
                      <b className="lang-chip">{l.label}</b>
                      <Tag
                        value={values[key] ?? ""}
                        onChange={(e: any) => onChange(key, e.target.value)}
                        required={f.required && l.code === "uz"}
                        aria-label={`${f.label} (${l.label})`}
                        {...(type === "textarea" ? { rows: 3 } : { type: "text" })}
                      />
                    </div>
                  );
                })}
              </div>
            ) : type === "textarea" ? (
              <textarea rows={4} value={values[f.name] ?? ""} onChange={(e) => onChange(f.name, e.target.value)} required={f.required} />
            ) : type === "select" && f.remote ? (
              <RemoteSelect f={f} value={values[f.name]} onChange={(v) => onChange(f.name, v)} />
            ) : type === "select" ? (
              <select value={values[f.name] ?? ""} onChange={(e) => onChange(f.name, e.target.value)} required={f.required}>
                {(f.options || []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : type === "image" || type === "file" ? (
              <FileInput f={f} value={values[f.name]} onChange={(v) => onChange(f.name, v)} />
            ) : type === "color" ? (
              <input type="color" value={values[f.name] || "#14183F"} onChange={(e) => onChange(f.name, e.target.value)} className="color" />
            ) : (
              <input
                type={type === "datetime" ? "datetime-local" : type}
                value={values[f.name] ?? ""}
                onChange={(e) => onChange(f.name, e.target.value)}
                required={f.required}
                autoComplete={type === "password" ? "new-password" : undefined}
              />
            )}
            {f.help && <small className="help">{f.help}</small>}
            {errs.map((m, i) => <small key={i} className="err">{m}</small>)}
          </div>
        );
      })}
    </div>
  );
}

export function errorSummary(e: any): string {
  const d = e?.data;
  if (!d || typeof d === "string") return e?.message || "Xatolik yuz berdi.";
  if (d.detail) return String(d.detail);
  if (d.non_field_errors) return String(d.non_field_errors[0]);
  return "Ma’lumotlarni tekşiring: ba’zi maydonlarda xato bor.";
}
