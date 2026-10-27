"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, listOf } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Role = { id: number; name: string; description: string; permissions: Record<string, string>; user_count: number };
type Section = { key: string; label: string };
const LEVELS: [string, string][] = [["", "Yöq"], ["view", "Körish"], ["edit", "Tahrirlaş"]];

export default function RolesPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [edit, setEdit] = useState<Partial<Role> | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api("/roles/").then((d) => setRoles(listOf(d))).catch(() => setRoles([]));
  }, []);
  useEffect(() => { if (!loading && !isAdmin) router.replace("/"); }, [loading, isAdmin, router]);
  useEffect(() => {
    if (!isAdmin) return;
    load();
    api("/roles/sections/").then((d) => setSections(Array.isArray(d) ? d : [])).catch(() => {});
  }, [isAdmin, load]);
  if (!isAdmin) return null;

  async function save() {
    if (!edit) return;
    setBusy(true); setErr("");
    try {
      const body = { name: edit.name || "", description: edit.description || "", permissions: Object.fromEntries(Object.entries(edit.permissions || {}).filter(([, v]) => v)) };
      if (edit.id) await api(`/roles/${edit.id}/`, { method: "PATCH", json: body });
      else await api("/roles/", { method: "POST", json: body });
      setEdit(null); load();
    } catch (e: any) {
      setErr(e?.message || "Saqlab bölmadi.");
    } finally { setBusy(false); }
  }

  async function remove(r: Role) {
    if (!confirm(`«${r.name}» rolini öçirasizmi?`)) return;
    try { await api(`/roles/${r.id}/`, { method: "DELETE" }); load(); } catch (e: any) { setErr(e?.message || "Öçirib bölmadi."); }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Rollar</h1><p>Yangi rol yaratib, har bir bölim uçun «Körish» yoki «Tahrirlaş» huquqini bering. Foydalanuvçilar bölimida rolni biriktirasiz.</p></div>
        <button className="btn teal" onClick={() => { setErr(""); setEdit({ name: "", description: "", permissions: {} }); }}>+ Rol qöşiş</button>
      </div>
      {err && !edit && <div className="notice err">{err}</div>}
      {roles === null ? <p className="muted">Yuklanmoqda…</p> : roles.length === 0 ? <p className="muted">Hozirça rol yöq.</p> : (
        <div className="card" style={{ padding: 0 }}>
          {roles.map((r) => (
            <div key={r.id} className="rl-row">
              <div>
                <b>{r.name}</b>{r.description && <small> — {r.description}</small>}
                <div className="rl-tags">
                  {Object.entries(r.permissions).map(([k, v]) => <span key={k} className={`badge ${v === "edit" ? "" : "muted"}`}>{sections.find((s) => s.key === k)?.label || k}: {v === "edit" ? "tahrir" : "körish"}</span>)}
                  {Object.keys(r.permissions).length === 0 && <span className="muted">Ruxsatlar yöq</span>}
                </div>
              </div>
              <div className="rl-act">
                <small>{r.user_count} ta foydalanuvçi</small>
                <button className="btn btn-outline" onClick={() => { setErr(""); setEdit(r); }}>Tahrirlaş</button>
                <button className="btn btn-outline" onClick={() => remove(r)}>Öçiriş</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {edit && (
        <div className="rl-modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setEdit(null); }}>
          <div className="rl-box">
            <h2>{edit.id ? "Rolni tahrirlaş" : "Yangi rol"}</h2>
            {err && <div className="notice err">{err}</div>}
            <label className="rl-f"><span>Nomi</span><input value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} maxLength={80} placeholder="Masalan: Operator" /></label>
            <label className="rl-f"><span>Izoh</span><input value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} maxLength={200} /></label>
            <div className="rl-matrix">
              {sections.map((s) => (
                <div key={s.key} className="rl-line">
                  <span>{s.label}</span>
                  <div className="rl-seg">
                    {LEVELS.map(([v, l]) => (
                      <button type="button" key={v} className={(edit.permissions?.[s.key] || "") === v ? "on" : ""} onClick={() => setEdit({ ...edit, permissions: { ...(edit.permissions || {}), [s.key]: v } })}>{l}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 12 }}>Foydalanuvçilar va rollarni boşqariş faqat platforma administratorida qoladi.</p>
            <div className="rl-foot">
              <button className="btn btn-outline" onClick={() => setEdit(null)}>Bekor qiliş</button>
              <button className="btn teal" disabled={busy || !(edit.name || "").trim()} onClick={save}>{busy ? "Saqlanmoqda…" : "Saqlaş"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
