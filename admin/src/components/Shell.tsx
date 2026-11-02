"use client";

import Operators, { type Operator } from "./Operators";
import Toaster from "./Toaster";
import AdminAssistant from "./AdminAssistant";
import UploadTray from "./UploadTray";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth";
import { SITE } from "@/lib/sitemap";

const WEB = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

type Item = { href: string; label: string; icon: string; children?: Item[] };
type Group = { title?: string; items: Item[] };

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isManager, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newCount, setNewCount] = useState<number | null>(null);

  const perms = user?.permissions || {};
  // [ruxsat kaliti | "admin" (faqat administrator) | "" (hamma), href, nom, ikonka]
  type Def = [string, string, string, string];
  const MASTER: { title?: string; defs: Def[] }[] = [
    { defs: [["", "/", "Boşqaruv", "dashboard"]] },
    {
      title: "Arizalar",
      defs: [["applications", "/applications", "Arizalar", "inbox"], ["inquiries", "/inquiries", "Murojaatlar", "inbox"], ["kpi", "/kpi", "KPI samaradorligi", "stats"]],
    },
    { title: "Sayt sahifalari", defs: [] },
    {
      title: "Umumiy",
      defs: [
        ["media", "/media", "Media kutubxonasi", "media"],
        ["settings", "/settings", "Sozlamalar: aloqa, yordam", "settings"],
      ],
    },
    {
      title: "Tizim",
      defs: [["admin", "/users", "Foydalanuvçilar", "users"], ["admin", "/roles", "Rollar", "users"], ["history", "/history", "Harakatlar tarixi", "clock"]],
    },
  ];
  const allowed = ([k]: Def) => (k === "" ? true : k === "admin" ? isAdmin : isAdmin || !!perms[k]);
  const groups: Group[] =
    isManager || isAdmin
      ? MASTER.map((g) => ({
          title: g.title,
          items: g.title === "Sayt sahifalari"
            ? SITE.map((p) => {
                const ok = p.leaves.filter((l) => allowed([l.perm, "", "", ""]));
                if (!ok.length) return null;
                if (p.direct) return { href: p.direct, label: p.label, icon: p.icon };
                return {
                  href: `/site/${p.key}`, label: p.label, icon: p.icon,
                  children: ok.filter((l) => !l.hubOnly).map((l) => ({ href: l.href, label: l.label, icon: l.icon })),
                };
              }).filter((p): p is Item => !!p && (!p.children || p.children.length > 0))
            : g.defs.filter(allowed).map(([, href, label, icon]) => ({ href, label, icon })),
        })).filter((g) => g.items.length > 0)
      : [
          {
            items: [
              { href: "/", label: "Boşqaruv", icon: "dashboard" },
              { href: `/universities/${user?.university}`, label: "Mening universitetim", icon: "university" },
              { href: "/applications", label: "Arizalar", icon: "inbox" },
            ],
          },
        ];

  const searchItems = useMemo(() => {
    const all = groups.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children || [])]));
    const t = q.trim().toLocaleLowerCase("uz");
    return all.filter((i) => i.label.toLocaleLowerCase("uz").includes(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, isAdmin, user?.university]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setBellOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isManager) api<{ applications: { new: number } }>("/dashboard/").then((d) => setNewCount(d.applications.new)).catch(() => {});
  }, [pathname]);

  const [support, setSupport] = useState<Operator[]>([]);
  useEffect(() => {
    api<Operator[]>("/operators/").then((d) => setSupport(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const initial = (user?.username || "?").slice(0, 1).toUpperCase();

  return (
    <div className="shell">
      <button type="button" className="shell-burger" aria-label="Menyu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>☰</button>
      <aside className={`side ${open ? "open" : ""}`}>
        <Link href="/" className="side-brand" aria-label="UzJapan — boşqaruv paneliga ötiş" onClick={() => setOpen(false)}>
          <span className="side-logo" aria-hidden="true"><Icon name="cap" size={22} /></span>
          <span className="side-name">
            <b>UzJapan</b>
            <span>Admin panel</span>
          </span>
        </Link>
        <nav aria-label="Admin menyu">
          {groups.map((g, gi) => {
            const hasActive = g.items.some((n) => isActive(n.href) || (n.children || []).some((c) => isActive(c.href)));
            const isOpen = !g.title || (collapsed[g.title] === undefined ? true : !collapsed[g.title]) || hasActive;
            return (
            <div className="nav-group" key={gi}>
              {g.title && (
                <button type="button" className="nav-title nav-toggle" aria-expanded={isOpen} onClick={() => setCollapsed((c) => ({ ...c, [g.title!]: isOpen && !hasActive }))}>
                  <span>{g.title}</span><i aria-hidden="true" className={isOpen ? "open" : ""}>›</i>
                </button>
              )}
              {isOpen && g.items.map((n) => {
                if (!n.children) {
                  return (
                    <Link key={n.href} href={n.href} className={isActive(n.href) ? "active" : ""} aria-current={isActive(n.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                      <span className="nav-ico"><Icon name={n.icon} size={19} /></span>
                      {n.label}
                    </Link>
                  );
                }
                const childActive = n.children.some((c) => isActive(c.href));
                const hubActive = isActive(n.href);
                const exp = openSub[n.href] ?? (childActive || hubActive);
                return (
                  <div className={`nav-sub ${exp ? "open" : ""}`} key={n.href}>
                    <div className="nav-sub-head">
                      <Link href={n.href} className={hubActive ? "active" : childActive ? "has-active" : ""} onClick={() => { setOpen(false); setOpenSub((o) => ({ ...o, [n.href]: true })); }}>
                        <span className="nav-ico"><Icon name={n.icon} size={19} /></span>
                        {n.label}
                      </Link>
                      <button type="button" className="nav-sub-btn" aria-expanded={exp} aria-label={`${n.label} bölimlarini ${exp ? "yig‘iş" : "oçiş"}`} onClick={() => setOpenSub((o) => ({ ...o, [n.href]: !exp }))}>
                        <i className={exp ? "open" : ""} aria-hidden="true">›</i>
                      </button>
                    </div>
                    {exp && (
                      <div className="nav-sub-list">
                        {n.children.map((c) => (
                          <Link key={c.href} href={c.href} className={isActive(c.href) ? "active" : ""} aria-current={isActive(c.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            );
          })}
        </nav>
        <div className="side-foot">
          <a href={WEB} target="_blank" rel="noopener noreferrer" className="side-ext">Oçiq saytni köriş ↗</a>
          <span className="side-deco" aria-hidden="true"><i className="ring" /><i className="sun" /></span>
          <Link href="/profile" className="who-card" onClick={() => setOpen(false)}>
            <span className="avatar" aria-hidden="true">{initial}</span>
            <div className="who">
              <b>{user?.username}</b>
              <span>{isAdmin ? "Platforma administratori" : isManager ? user?.custom_role_name || "Kontent menejeri" : user?.university_name || "Universitet vakili"}</span>
            </div>
          </Link>
          <button type="button" className="btn ghost sm" onClick={logout}>Çiqiş</button>
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <button type="button" className="top-search" onClick={() => { setQ(""); setSearchOpen(true); }} aria-label="Qidiruvni oçiş">
            <Icon name="search" size={17} />
            <span>Qidiriş...</span>
            <kbd>Ctrl + K</kbd>
          </button>
          <div className="top-actions">
            <div className="top-bell-wrap">
              <button type="button" className="top-btn" aria-label="Bildirişnomalar" aria-expanded={bellOpen} onClick={() => setBellOpen((v) => !v)}>
                <Icon name="bell" size={19} />
                {!!newCount && <i className="dot" />}
              </button>
              {bellOpen && (
                <div className="bell-pop" role="status">
                  <b>Bildirişnomalar</b>
                  <p>{newCount ? `${newCount} ta yangi ariza körib çiqilişini kutmoqda.` : "Yangi arizalar yöq."}</p>
                  <Link href="/applications" onClick={() => setBellOpen(false)}>Arizalarni oçiş →</Link>
                </div>
              )}
            </div>
            <Link href="/profile" className="top-user" aria-label="Profil: ma’lumotlarni köriş">
              <span className="top-avatar" aria-hidden="true">{initial}</span>
              <span className="top-name">{user?.username}</span>
            </Link>
          </div>
        </header>
        {children}
        <footer className="admin-foot">
          <Operators items={support} />
          <span>© {new Date().getFullYear()} UzJapan Education · Admin panel</span>
          <span className="af-links">
            <a href={WEB} target="_blank" rel="noopener noreferrer">Oçiq sayt ↗</a>
            <Link href="/profile">Profil</Link>
            {perms["settings"] && <Link href="/settings">Sozlamalar</Link>}
            <kbd>Ctrl + K</kbd>
          </span>
        </footer>
        <Toaster />
        <AdminAssistant />
        <UploadTray />
      </main>
      {searchOpen && (
        <div className="search-back" onMouseDown={(e) => e.target === e.currentTarget && setSearchOpen(false)}>
          <div className="search-box" role="dialog" aria-modal="true" aria-label="Bölim qidiriş">
            <div className="search-input">
              <Icon name="search" size={18} />
              <input
                autoFocus
                value={q}
                placeholder="Bölimni qidiring..."
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchItems[0]) {
                    router.push(searchItems[0].href);
                    setSearchOpen(false);
                  }
                }}
              />
              <kbd>ESC</kbd>
            </div>
            <div className="search-list">
              {searchItems.map((i) => (
                <Link key={i.href} href={i.href} onClick={() => setSearchOpen(false)}>
                  <span className="nav-ico"><Icon name={i.icon} size={18} /></span>{i.label}<em>↗</em>
                </Link>
              ))}
              {searchItems.length === 0 && <p className="muted" style={{ padding: 14 }}>Heç narsa topilmadi.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
