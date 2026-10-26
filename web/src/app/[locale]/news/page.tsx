import Link from "next/link";
import { notFound } from "next/navigation";
import NewsCard from "@/components/NewsCard";
import { getNews } from "@/lib/api";
import { getT, isLocale } from "@/lib/i18n";

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
