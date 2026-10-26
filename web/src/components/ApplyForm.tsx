"use client";

import { FormEvent, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_MB = 10;
const MAX_FILES = 30;
const EXT = /\.(pdf|jpe?g|png|webp|docx?)$/i;
const CODES = [
  { code: "+998", label: "UZ", ph: "90 123 45 67", min: 9, max: 9 },
  { code: "+81", label: "JP", ph: "90 1234 5678", min: 9, max: 10 },
];
const REQUIRED = ["passport", "diploma", "transcript", "motivation"];

const SECTIONS: { title: string; types: string[] }[] = [
  { title: "f.sec.diploma", types: ["diploma", "transcript"] },
  { title: "f.sec.idlang", types: ["passport", "language_cert"] },
  { title: "f.sec.cvmot", types: ["cv", "motivation"] },
  { title: "f.sec.extra", types: ["recommendation", "photo", "other"] },
];

type FileItem = { id: number; type: string; file: File; state: "queued" | "uploading" | "done" | "error"; pct: number; err?: string };

type Props = {
  slug: string;
  uniName: string;
  backHref: string;
  labels: Record<string, string>;
};

function fmtSize(n: number) {
  return n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function uploadOne(code: string, f: FileItem, onPct: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/api/public/applications/${code}/documents/`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onPct(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status === 201) return resolve();
      let msg = "";
      try {
        const d = JSON.parse(xhr.responseText);
        msg = [].concat(d.file || d.detail || []).join(" ");
      } catch {}
      reject(new Error(msg || String(xhr.status)));
    };
    xhr.onerror = () => reject(new Error("network"));
    const fd = new FormData();
    fd.append("doc_type", f.type);
    fd.append("file", f.file);
    xhr.send(fd);
  });
}

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 16V4M7 9l5-5 5 5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

export default function ApplyForm({ slug, uniName, backHref, labels: L }: Props) {
  const initial = {} as Record<string, string>;
  const [data, setData] = useState<Record<string, string>>(initial);
  const [jaOk, setJaOk] = useState(false);
  const [cc, setCc] = useState(CODES[0].code);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const idRef = useRef(1);
  const pickType = useRef("other");
  const picker = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));

  function addFiles(list: FileList | null, type: string) {
    if (!list) return;
    const next: FileItem[] = [];
    let err = "";
    for (const f of Array.from(list)) {
      if (!EXT.test(f.name) || f.size > MAX_MB * 1024 * 1024) {
        err = L.badFile;
        continue;
      }
      next.push({ id: idRef.current++, type, file: f, state: "queued", pct: 0 });
    }
    setFiles((cur) => {
      if (cur.length + next.length > MAX_FILES) {
        err = L.tooManyFiles;
        return cur;
      }
      return [...cur, ...next];
    });
    setError(err);
  }

  function patchFile(id: number, p: Partial<FileItem>) {
    setFiles((cur) => cur.map((f) => (f.id === id ? { ...f, ...p } : f)));
  }

  function clearAll() {
    if (busy) return;
    setData(initial);
    setJaOk(false);
    setCc(CODES[0].code);
    setFiles([]);
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const missing = REQUIRED.filter((t) => !files.some((f) => f.type === t));
    if (missing.length) {
      setError(`${L["f.missing"]} ${missing.map((t) => L[`doc.${t}`]).join(", ")}`);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const rule = CODES.find((c) => c.code === cc)!;
    let digits = (data.phone_local || "").replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (digits.length < rule.min || digits.length > rule.max) {
      setError(L["f.phoneBad"]);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!jaOk) {
      setError(L["f.jaConfirm"]);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setBusy(true);
    setError("");
    try {
      let c = code;
      if (!c) {
        const res = await fetch(`${API}/api/public/applications/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, phone: `${cc} ${digits}`, university: slug }),
        });
        if (res.status === 429) throw new Error(L.tooMany);
        if (res.status === 400) {
          const d = await res.json().catch(() => ({}));
          if (JSON.stringify(d.email || "").includes("email_taken")) throw new Error(L["f.emailTaken"]);
        }
        if (res.status !== 201) throw new Error(L.error);
        c = (await res.json()).code as string;
        setCode(c);
      }
      let failed = 0;
      for (const f of files) {
        if (f.state === "done") continue;
        patchFile(f.id, { state: "uploading", pct: 0, err: undefined });
        try {
          await uploadOne(c, f, (p) => patchFile(f.id, { pct: p }));
          patchFile(f.id, { state: "done", pct: 100 });
        } catch (er: any) {
          failed++;
          patchFile(f.id, { state: "error", err: er?.message });
        }
      }
      if (failed) {
        setError(L.uploadFailed);
        return;
      }
      const sub = await fetch(`${API}/api/public/applications/${c}/submit/`, { method: "POST" });
      if (sub.status === 409) throw new Error(L["f.emailTaken"]);
      if (!sub.ok) {
        let m = "";
        try { const j = await sub.json(); m = (Array.isArray(j?.documents) ? j.documents[0] : j?.documents) || j?.detail || ""; } catch {}
        throw new Error(m || L.error);
      }
      setDone(true);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (er: any) {
      setError(er?.message || L.error);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="af-card af-done" role="status" ref={topRef}>
        <span className="ok" />
        <h2 className="disp">{L.doneTitle}</h2>
        <p>{L.doneText}</p>
        <div className="ap-code">
          <small>{L.codeTitle}</small>
          <b>{code}</b>
        </div>
        <p className="ap-hint">{L.codeHint}</p>
        <div className="af-actions" style={{ justifyContent: "center" }}>
          <a className="btn btn-outline" href={L.statusHref}>{L.checkStatus}</a>
          <a className="btn btn-primary" href={backHref}>{L["f.backToUni"]}</a>
        </div>
      </div>
    );
  }

  const text = (k: string, label: string, extra: Record<string, any> = {}) => (
    <label className="field">
      {label}
      <input value={data[k] || ""} onChange={(e) => set(k, e.target.value)} {...extra} />
    </label>
  );

  return (
    <form className="af-card" onSubmit={onSubmit} noValidate={false} ref={topRef as any}>
      <div className="eyebrow">{L["f.title"]}</div>
      <h2 className="af-uni disp">{uniName}</h2>
      <p className="af-intro">{L["f.intro"]}</p>
      <span className="af-pill">{L["f.limits"]}</span>

      {error && <div className="alert err" role="alert">{error}</div>}

      <h3 className="af-sec"><span>{L["f.sec.personal"]}</span></h3>
      <div className="af-grid3">
        {text("first_name", L.firstName, { required: true, maxLength: 100, autoComplete: "given-name" })}
        {text("last_name", L.lastName, { required: true, maxLength: 100, autoComplete: "family-name" })}
        {text("middle_name", L.middleName, { maxLength: 100 })}
        {text("email", L.email, { type: "email", required: true, autoComplete: "email" })}
        <label className="field">
          {L.phone}
          <div className="af-phone">
            <select aria-label={L.phone} value={cc} onChange={(e) => setCc(e.target.value)}>
              {CODES.map((c) => <option key={c.code} value={c.code}>{c.label} {c.code}</option>)}
            </select>
            <input
              type="tel"
              inputMode="numeric"
              required
              autoComplete="tel-national"
              placeholder={CODES.find((c) => c.code === cc)?.ph}
              value={data.phone_local || ""}
              onChange={(e) => set("phone_local", e.target.value.replace(/[^\d\s-]/g, "").slice(0, 16))}
            />
          </div>
        </label>
      </div>

      <div className="hp" aria-hidden="true">
        <label>Website<input tabIndex={-1} autoComplete="off" value={data.website || ""} onChange={(e) => set("website", e.target.value)} /></label>
      </div>

      <input
        ref={picker}
        type="file"
        multiple
        hidden
        accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,application/pdf,image/*"
        onChange={(e) => {
          addFiles(e.target.files, pickType.current);
          e.target.value = "";
        }}
      />

      {SECTIONS.map((s) => (
        <section key={s.title}>
          <h3 className="af-sec"><span>{L[s.title]}</span></h3>
          <div className="af-docs">
            {s.types.map((t) => {
              const mine = files.filter((f) => f.type === t);
              return (
                <div key={t} className={`af-doc${mine.length ? " has" : ""}`}>
                  <span className="af-ic"><UploadIcon /></span>
                  <div className="af-doc-b">
                    <b>{L[`doc.${t}`]}{REQUIRED.includes(t) && <em title={L["f.req"]}> *</em>}</b>
                    <button type="button" className="af-pick" disabled={busy} onClick={() => { pickType.current = t; picker.current?.click(); }}>
                      {mine.length ? L["f.more"] : L["f.choose"]}
                    </button>
                    {mine.map((f) => (
                      <div key={f.id} className={`ap-file st-${f.state}`}>
                        <span className="ap-fn" title={f.file.name}>{f.file.name}</span>
                        <small>{f.state === "uploading" ? `${f.pct}%` : f.state === "done" ? "✓" : f.state === "error" ? `! ${f.err || ""}` : fmtSize(f.file.size)}</small>
                        {f.state !== "uploading" && f.state !== "done" && (
                          <button type="button" className="ap-rm" aria-label={L.remove} onClick={() => setFiles((c) => c.filter((x) => x.id !== f.id))}>×</button>
                        )}
                        {f.state === "uploading" && <i className="ap-bar" style={{ width: `${f.pct}%` }} />}
                      </div>
                    ))}
                    {!mine.length && <small className="af-lim">{L["f.limits"]}</small>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <label className="af-check">
        <input type="checkbox" checked={jaOk} onChange={(e) => setJaOk(e.target.checked)} />
        <span>{L["f.jaConfirm"]}</span>
      </label>

      <div className="af-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? L["f.sending"] : files.some((f) => f.state === "error") ? L.retry : L["f.submit"]}
        </button>
        <button type="button" className="btn btn-outline" disabled={busy} onClick={clearAll}>{L["f.clear"]}</button>
      </div>
    </form>
  );
}
