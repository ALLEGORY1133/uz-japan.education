"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth";
import { SITE } from "@/lib/sitemap";

export default function SiteHubPage() {
  const { key } = useParams<{ key: string }>();
  const { user, isAdmin } = useAuth();
  const page = SITE.find((p) => p.key === key);
  const perms = user?.permissions || {};
  if (!page) return <div className="card"><p className="muted">Bunday sahifa topilmadi.</p></div>;
  const leaves = page.leaves.filter((l) => (l.perm === "admin" ? isAdmin : isAdmin || perms[l.perm]));
  return (
    <>
      <div className="page-head">
        <div><h1>{page.label}</h1><p>{page.lead}</p></div>
      </div>
      <div className="hub-grid">
        {leaves.map((l) => (
          <Link key={l.href} href={l.href} className="card hub-card">
            <span className="hub-ic"><Icon name={l.icon} size={22} /></span>
            <b>{l.label}</b>
            <p>{l.desc}</p>
            {l.tags && <span className="hub-tags">{l.tags.map((t) => <i key={t}>{t}</i>)}</span>}
            <span className="hub-go" aria-hidden="true">Oçiş →</span>
          </Link>
        ))}
        {!leaves.length && <p className="muted">Sizda bu sahifa bölimlariga ruxsat yöq.</p>}
      </div>
    </>
  );
}
