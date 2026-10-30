"use client";

import AdminAssistant from "./AdminAssistant";
import UploadTray from "./UploadTray";
import Operators, { type Operator } from "./Operators";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth";

const WEB = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

type Item = { href: string; label: string; icon: string };
type Group = { title?: string; items: Item[] };

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isManager, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [newCount, setNewCount] = useState<number | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);

  const perms = user?.permissions || {};
  const pick = (defs: [string, string, string, string][]) => defs.filter(([k]) => perms[k]).map(([, href, label, icon]) => ({ href, label, icon }));
  const managerGroups: Group[] = [
    { items: [{ href: "/", label: "Boşqaruv", icon: "dashboard" }, ...pick([["applications", "/applications", "Arizalar", "inbox"], ["inquiries", "/inquiries", "Murojaatlar", "inbox"], ["kpi", "/kpi", "KPI samaradorligi", "stats"]])] },
    {
      title: "Sayt kontenti",
      items: pick([
        ["hero", "/hero", "Boş sahifa slayderi", "hero"],
        ["pages", "/pages", "Sahifalar va bölimlar", "news"],
        ["site_media", "/site-media", "Sayt rasm va videolari", "media"],
        ["media", "/media", "Media kutubxonasi", "media"],
        ["news", "/news", "Barça yangilik va tadbirlar", "news"],
        ["news", "/cooperation", "Hamkorlik yangiliklari", "news"],
        ["news", "/events", "Tadbirlar", "news"],
        ["news", "/updates", "Sayt yangiliklari", "news"],
        ["stats", "/stats", "Statistika", "stats"],
        ["settings", "/settings", "Sozlamalar", "settings"],
      ]),
    },
    { title: "Tizim", items: pick([["history", "/history", "Harakatlar tarixi", "clock"]]) },
  ].filter((g) => g.items.length > 0);

  const groups: Group[] = isManager
    ? managerGroups
    : isAdmin
    ? [
        {
          items: [
            { href: "/", label: "Boşqaruv", icon: "dashboard" },
            { href: "/universities", label: "Universitetlar", icon: "university" },
            { href: "/applications", label: "Arizalar", icon: "inbox" },
            { href: "/inquiries", label: "Murojaatlar", icon: "inbox" },
            { href: "/kpi", label: "KPI samaradorligi", icon: "stats" },
          ],
        },
        {
          title: "Sayt kontenti",
          items: [
            { href: "/hero", label: "Boş sahifa slayderi", icon: "hero" },
            { href: "/pages", label: "Sahifalar va bölimlar", icon: "news" },
            { href: "/site-media", label: "Sayt rasm va videolari", icon: "media" },
            { href: "/media", label: "Media kutubxonasi", icon: "media" },
            { href: "/links", label: "Foydali havolalar", icon: "links" },
            { href: "/news", label: "Barça yangilik va tadbirlar", icon: "news" },
            { href: "/cooperation", label: "Hamkorlik yangiliklari", icon: "news" },
            { href: "/events", label: "Tadbirlar", icon: "news" },
            { href: "/updates", label: "Sayt yangiliklari", icon: "news" },
            { href: "/stats", label: "Statistika", icon: "stats" },
            { href: "/settings", label: "Sozlamalar", icon: "settings" },
          ],
        },
        {
          title: "Tizim",
          items: [
            { href: "/users", label: "Foydalanuvçilar", icon: "users" },
            { href: "/roles", label: "Rollar", icon: "users" },
            { href: "/history", label: "Harakatlar tarixi", icon: "clock" },
          ],
        },
      ]
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
    const all = groups.flatMap((g) => g.items);
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

  useEffect(() => {
    api<Operator[]>("/operators/").then((d) => setOperators(Array.isArray(d) ? d : [])).catch(() => {});
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
          {groups.map((g, gi) => (
            <div className="nav-group" key={gi}>
              {g.title && <div className="nav-title">{g.title}</div>}
              {g.items.map((n) => (
                <Link key={n.href} href={n.href} className={isActive(n.href) ? "active" : ""} aria-current={isActive(n.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                  <span className="nav-ico"><Icon name={n.icon} size={19} /></span>
                  {n.label}
                </Link>
              ))}
            </div>
          ))}
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
          <Operators items={operators} />
          <span>© {new Date().getFullYear()} UzJapan Education · Admin panel</span>
          <span className="af-links">
            <a href={WEB} target="_blank" rel="noopener noreferrer">Oçiq sayt ↗</a>
            <Link href="/profile">Profil</Link>
            {perms["settings"] && <Link href="/settings">Sozlamalar</Link>}
            <kbd>Ctrl + K</kbd>
          </span>
        </footer>
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
