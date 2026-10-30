import Link from "next/link";
import NewsCard from "@/components/NewsCard";
import { getBlocks, getNewsCounts, getNewsPage } from "@/lib/api";
import { bm, bt, heroBg } from "@/lib/blocks";
import { getT } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** /news?tab=1|2|3&q=&page= — yangiliklar, tadbirlar va e'lonlar bitta sahifada tablar bilan. */
export const NEWS_TABS = [
  { n: 1, cat: "news", nav: "nav.news", block: "news.head", title: "news.title", lead: "news.lead", eyebrow: "news.eyebrow" },
  { n: 2, cat: "event", nav: "nav.events", block: "events.head", title: "events.title", lead: "events.lead", eyebrow: "events.eyebrow" },
  { n: 3, cat: "platform", nav: "nav.updates", block: "updates.head", title: "nav.updates", lead: "updates.lead", eyebrow: "updates.eyebrow" },
] as const;

const PAGE_SIZE = 12;

export const tabOf = (v?: string) => NEWS_TABS.find((x) => String(x.n) === v) || NEWS_TABS[0];

/** Joriy sahifa atrofidagi raqamlar: 1 … 4 5 [6] 7 8 … 20 */
function pageList(cur: number, last: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let p = 1; p <= last; p++) {
    if (p === 1 || p === last || Math.abs(p - cur) <= 2) out.push(p);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

export default async function NewsHub({ locale, tab, q, page }: { locale: Locale; tab?: string; q?: string; page?: string }) {
  const t = getT(locale);
  const cur = tabOf(tab);
  const query = (q || "").trim().slice(0, 100);
  const pageNo = Math.max(1, Number.parseInt(page || "1", 10) || 1);

  const [data, counts, blocks] = await Promise.all([
    getNewsPage(locale, { category: cur.cat, q: query, page: pageNo, size: PAGE_SIZE }),
    getNewsCounts(locale, query),
    getBlocks(locale),
  ]);
  const last = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  const href = (n: number, p = 1) => {
    const sp = new URLSearchParams({ tab: String(n), q: query });
    if (p > 1) sp.set("page", String(p));
    return `/${locale}/news?${sp}`;
  };

  return (
    <main>
      <section className="page-hero" style={{ paddingTop: 110, ...heroBg(bm(blocks, cur.block).image) }}>
        <div className="wrap">
          <div className="crumbs">
            <Link href={`/${locale}`}>{t("common.home")}</Link> › <Link href={href(1)}>{t("nav.news")}</Link>
            {cur.n !== 1 && <> › {t(cur.nav)}</>}
          </div>
          <span className="eyebrow" style={{ color: "#ffd0c8" }}>{t(cur.eyebrow)}</span>
          <h1 className="disp">{bt(blocks, cur.block, "title", locale, t(cur.title))}</h1>
          <p style={{ margin: 0, color: "#d4cdee", maxWidth: 640 }}>{bt(blocks, cur.block, "text", locale, t(cur.lead))}</p>
        </div>
      </section>

      <div className="wrap nh">
        <form className="nh-search" action={`/${locale}/news`} method="get" role="search">
          <input type="hidden" name="tab" value={cur.n} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" name="q" defaultValue={query} placeholder={t("news.search.ph")} aria-label={t("news.search.ph")} maxLength={100} />
          <button type="submit">{t("news.search.btn")}</button>
        </form>

        <nav className="nh-tabs" aria-label={t("nav.news")}>
          {NEWS_TABS.map((x) => (
            <Link key={x.n} href={href(x.n)} className={`nh-tab ${x.cat}`} aria-current={x.n === cur.n ? "page" : undefined}>
              {t(x.nav)}
              <b>{counts[x.cat] ?? 0}</b>
            </Link>
          ))}
        </nav>

        {query && data.count > 0 && (
          <p className="nh-found">{t("news.found").replace("{q}", query).replace("{n}", String(data.count))}</p>
        )}

        <div className="grid-cards">
          {data.results.length === 0 && (
            <p className="empty" style={{ gridColumn: "1/-1" }}>{query ? t("news.notfound") : t("common.empty")}</p>
          )}
          {data.results.map((n, i) => (
            <NewsCard key={n.id} n={n} locale={locale} t={t} index={(pageNo - 1) * PAGE_SIZE + i} />
          ))}
        </div>

        {last > 1 && (
          <nav className="nh-pager" aria-label={t("page.label")}>
            {pageNo > 1 ? <Link href={href(cur.n, pageNo - 1)} rel="prev">← {t("page.prev")}</Link> : <span className="off">← {t("page.prev")}</span>}
            {pageList(pageNo, last).map((p, i) =>
              p === "…" ? (
                <span key={`g${i}`} className="gap">…</span>
              ) : (
                <Link key={p} href={href(cur.n, p)} aria-current={p === pageNo ? "page" : undefined}>{p}</Link>
              ),
            )}
            {pageNo < last ? <Link href={href(cur.n, pageNo + 1)} rel="next">{t("page.next")} →</Link> : <span className="off">{t("page.next")} →</span>}
          </nav>
        )}
      </div>
    </main>
  );
}
