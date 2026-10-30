import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsItem } from "@/lib/api";
import MediaView from "@/components/MediaView";
import { formatDate, getT, isLocale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { NewsItem } from "@/lib/types";

/** Matnni xatboshilarga bo'ladi: "• " bilan boshlanganlar ro'yxat, "Eslatma:" bilan boshlangan — ajratilgan blok. */
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) out.push(<ul className="art-list" key={`l${out.length}`}>{list.map((x, i) => <li key={i}>{x}</li>)}</ul>);
    list = [];
  };
  blocks.forEach((b) => {
    if (/^[•\-–]\s/.test(b)) { list.push(b.replace(/^[•\-–]\s+/, "")); return; }
    flush();
    if (/^(Eslatma|Note|Remark|注)\s*[:：]/i.test(b)) out.push(<p className="art-note" key={out.length}>{b}</p>);
    else out.push(<p key={out.length}>{b}</p>);
  });
  flush();
  return <>{out}</>;
}

export const dynamic = "force-dynamic";

async function load(locale: any, slug: string): Promise<NewsItem> {
  try {
    return await getNewsItem(locale, slug);
  } catch (e: any) {
    if (e?.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  try {
    const n = await getNewsItem(locale, slug);
    return { title: n.title, description: n.summary };
  } catch {
    return {};
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getT(locale);
  const n = await load(locale, slug);
  const cover = mediaUrl(n.cover);
  const back = ({ platform: { path: "news?tab=3", nav: "nav.updates" }, event: { path: "news?tab=2", nav: "nav.events" }, cooperation: { path: "cooperation", nav: "nav.cooperation" } } as Record<string, { path: string; nav: string }>)[n.category] || { path: "news", nav: "nav.news" };

  return (
    <main>
      <section className="page-hero" style={{ paddingTop: 110, paddingBottom: 40 }}>
        <div className="wrap">
          <div className="crumbs">
            <Link href={`/${locale}`}>{t("common.home")}</Link> › <Link href={`/${locale}/${back.path}`}>{t(back.nav)}</Link>
          </div>
          <div className="chips" style={{ marginTop: 10 }}>
            <span className={`tag ${n.category}`}>{t(`news.cat.${n.category}`)}</span>
            <span className="chip" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>
              {formatDate(n.event_starts_at || n.published_at, locale)}
            </span>
          </div>
          <h1 className="disp" style={{ maxWidth: 820 }}>{n.title}</h1>
        </div>
      </section>

      <div className="wrap">
        <article className="article">
          {n.video ? (
            <video className="cover" src={mediaUrl(n.video) || undefined} poster={cover || undefined} controls playsInline preload="metadata" />
          ) : cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="cover" src={cover} alt="" />
          ) : null}
          {n.event_location && <p style={{ fontWeight: 700 }}>{n.event_location}</p>}
          {n.summary && <p style={{ fontSize: 18, fontWeight: 600 }}>{n.summary}</p>}
          {n.body && <Body text={n.body} />}
          {n.media && n.media.length > 0 && (
            <div className="gallery" style={{ margin: "26px 0" }}>
              {n.media.map((m) => (
                <div className="g" key={m.id}><MediaView item={m} /></div>
              ))}
            </div>
          )}
          {n.link_type === "external" && n.external_url && (
            <p>
              <a className="btn btn-primary" href={n.external_url} target="_blank" rel="noopener noreferrer">
                {n.category === "event" ? t("news.join") : n.source_name ? `${t("news.source")}: ${n.source_name}` : t("news.read")} ↗
              </a>
            </p>
          )}
          <p>
            <Link href={`/${locale}/${back.path}`} style={{ color: "var(--red)", fontWeight: 700 }}>← {t(back.nav)}</Link>
          </p>
        </article>
      </div>
    </main>
  );
}
