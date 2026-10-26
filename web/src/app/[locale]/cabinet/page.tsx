import Link from "next/link";
import { notFound } from "next/navigation";
import Cabinet from "@/components/Cabinet";
import { getT, isLocale, pickPrefix } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getT(locale)("cab.title"), robots: { index: false } };
}

export default async function CabinetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getT(locale);
  return (
    <main>
      <section className="page-hero" style={{ paddingTop: 110, paddingBottom: 40 }}>
        <div className="wrap">
          <div className="crumbs"><Link href={`/${locale}`}>{t("common.home")}</Link> › {t("cab.title")}</div>
          <h1 className="disp">{t("cab.title")}</h1>
        </div>
      </section>
      <div className="wrap cab-wrap">
        <Cabinet locale={locale} L={pickPrefix(locale, "cab.")} A={pickPrefix(locale, "apply.")} />
      </div>
    </main>
  );
}
