import Link from "next/link";
import { notFound } from "next/navigation";
import Carousel from "@/components/Carousel";
import NewsCard from "@/components/NewsCard";
import SmartLink from "@/components/SmartLink";
import { getNews } from "@/lib/api";
import { DEMO, pickDemo } from "@/lib/demo";
import { formatDate, getT, isLocale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: isLocale(locale) ? getT(locale)("news.title") : "News" };
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { category } = await searchParams;
  const t = getT(locale);
  const cat = ["news", "cooperation", "event"].includes(category || "") ? category : undefined;
  const items = await getNews(locale, cat);

  const tabs = [
    { key: undefined, label: t("news.all") },
    { key: "news", label: t("news.cat.news") },
    { key: "cooperation", label: t("news.cat.cooperation") },
    { key: "event", label: t("news.cat.event") },
  ];

  return (
    <main>
      <section className="page-hero" style={{ paddingTop: 110 }}>
        <div className="wrap">
          <div className="crumbs">
            <Link href={`/${locale}`}>{t("common.home")}</Link> › {t("nav.news")}
          </div>
          <h1 className="disp">{t("news.title")}</h1>
        </div>
      </section>

      {items.length > 1 && (
        <section className="wrap hx news-feat" style={{ "--c": "#5b3fd0", paddingTop: 36 } as React.CSSProperties}>
          <Carousel label={t("news.title")} prev={t("slider.prev")} next={t("slider.next")} auto={3400}>
            {items.slice(0, 6).map((n, i) => {
              const cover = mediaUrl(n.cover) || pickDemo(DEMO[n.category as "news" | "cooperation" | "event"] || DEMO.news, i);
              const external = n.link_type === "external" && !!n.external_url;
              return (
                <SmartLink key={n.id} href={n.href} locale={locale} className="cs cs-news">
                  <span className="cs-pic">
                    {n.video ? (
                      <video src={mediaUrl(n.video) || undefined} poster={cover} muted loop autoPlay playsInline preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" loading="lazy" />
                    )}
                    <span className={`tag ${n.category} cs-tag`}>{t(`news.cat.${n.category}`)}</span>
                  </span>
                  <span className="cs-body">
                    <small>{formatDate(n.event_starts_at || n.published_at, locale)}</small>
                    <b>{n.title}</b>
                    {n.summary && <small className="cs-sum">{n.summary}</small>}
                    <span className="cs-go">{external ? t("news.join") : t("news.read")} {external ? "↗" : "→"}</span>
                  </span>
                </SmartLink>
              );
            })}
          </Carousel>
        </section>
      )}

      <div className="wrap" style={{ paddingTop: 28 }}>
        <div className="tabs" role="navigation" style={{ flexWrap: "wrap" }}>
          {tabs.map((tb) => (
            <Link
              key={tb.label}
              href={`/${locale}/news${tb.key ? `?category=${tb.key}` : ""}`}
              style={{
                fontWeight: 700, fontSize: 14, borderRadius: 9, padding: "12px 20px", minHeight: 44, display: "flex", alignItems: "center",
                background: cat === tb.key ? "#fff" : "transparent",
                color: cat === tb.key ? "var(--red-dark)" : "var(--muted)",
              }}
              aria-current={cat === tb.key ? "page" : undefined}
            >
              {tb.label}
            </Link>
          ))}
        </div>
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
