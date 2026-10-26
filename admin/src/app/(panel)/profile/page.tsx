"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, listOf } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const ROLE: Record<string, string> = { platform_admin: "Platforma administratori", university_rep: "Universitet vakili" };
const fmt = (iso?: string | null) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" }) : "—";
};

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const [acts, setActs] = useState<any[] | null>(null);

  useEffect(() => {
    if (!isAdmin || !user) return;
    api(`/history/?user=${user.id}&page=1`).then((d) => setActs(listOf(d).slice(0, 8))).catch(() => setActs([]));
  }, [isAdmin, user]);

  if (!user) return null;
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const rows: [string, string][] = [
    ["Foydalanuvçi nomi", user.username],
    ["Töliq ism", full || "—"],
    ["Email", user.email || "—"],
    ["Rol", ROLE[user.role] || user.role],
    ["Universitet", user.university_name || (isAdmin ? "Barça universitetlar" : "—")],
    ["Oxirgi kiriş", fmt(user.last_login)],
    ["Röyxatdan ötgan", fmt(user.date_joined)],
  ];

  return (
    <>
      <div className="page-head">
        <div><h1>Profil</h1><p>Sizning admin hisobingiz haqidagi ma’lumotlar.</p></div>
      </div>

      <section className="card profile">
        <div className="profile-head">
          <span className="profile-ava" aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span>
          <div>
            <h2>{full || user.username}</h2>
            <span className="badge accepted">{ROLE[user.role] || user.role}</span>
          </div>
          <button type="button" className="btn outline sm" style={{ marginLeft: "auto" }} onClick={logout}>Çiqiş</button>
        </div>
        <dl className="profile-grid">
          {rows.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </section>

      {isAdmin && (
        <section className="card">
          <div className="rail-head"><h2>Oxirgi harakatlarim</h2><Link href="/history">Barçasi →</Link></div>
          {acts === null ? <p className="muted">Yuklanmoqda…</p> : acts.length === 0 ? <p className="muted">Hozirça harakat yöq.</p> : (
            <ul className="rows hist">
              {acts.map((h) => (
                <li key={h.id} className="row">
                  <span className={`hist-badge ${h.action}`}>{h.action_label}</span>
                  <div className="row-main">
                    <b>{h.model_label}{h.object_repr ? ` — ${h.object_repr}` : ""}</b>
                    <span className="muted">{fmt(h.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
