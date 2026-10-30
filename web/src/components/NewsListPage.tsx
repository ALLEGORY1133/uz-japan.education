import Link from "next/link";
import NewsCard from "@/components/NewsCard";
import { getBlocks, getNews } from "@/lib/api";
import { bm, bt, heroBg } from "@/lib/blocks";
import { getT } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export type ListKind = "news" | "cooperation" | "event" | "platform";

const CFG: Record<ListKind, { block: string; nav: string; title: string; lead: string; eyebrow: string }> = {
  news: { block: "news.head", nav: "nav.news", title: "news.title", lead: "news.lead", eyebrow: "news.eyebrow" },
  cooperation: { block: "cooperation.head", nav: "nav.cooperation", title: "coop.title", lead: "coop.lead", eyebrow: "coop.eyebrow" },
  platform: { block: "updates.head", nav: "nav.updates", title: "updates.title", lead: "updates.lead", eyebrow: "updates.eyebrow" },
  event: { block: "events.head", nav: "nav.events", title: "events.title", lead: "events.lead", eyebrow: "events.eyebrow" },
};

/** Yangiliklar / hamkorlik / tadbirlar — har biri o'z sahifasi, bitta umumiy ko'rinish. */
export default async function NewsListPage({ locale, kind }: { locale: Locale; kind: ListKind }) {
  const t = getT(locale);
  const c = CFG[kind];
  const [items, blocks] = await Promise.all([getNews(locale, kind), getBlocks(locale)]);
  const bg = bm(blocks, c.block).image;

  return (
    <main>
      <section className="page-hero" style={{ paddingTop: 110, ...heroBg(bg) }}>
        <div className="wrap">
          <div className="crumbs">
            <Link href={`/${locale}`}>{t("common.home")}</Link> › {t(c.nav)}
          </div>
          <span className="eyebrow" style={{ color: "#ffd0c8" }}>{t(c.eyebrow)}</span>
          <h1 className="disp">{bt(blocks, c.block, "title", locale, t(c.title))}</h1>
          <p style={{ margin: 0, color: "#d4cdee", maxWidth: 640 }}>{bt(blocks, c.block, "text", locale, t(c.lead))}</p>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 36 }}>
        <div className="grid-cards">
          {items.length === 0 && <p className="empty" style={{ gridColumn: "1/-1" }}>{t("common.empty")}</p>}
          {items.map((n, i) => (
            <NewsCard key={n.id} n={n} locale={locale} t={t} index={i} />
          ))}
        </div>
      </div>
    </main>
  );
}

export function listMeta(kind: ListKind, locale: Locale) {
  return { title: getT(locale)(CFG[kind].title) };
}
