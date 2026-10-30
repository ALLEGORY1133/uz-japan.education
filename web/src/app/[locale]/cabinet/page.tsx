import Link from "next/link";
import { notFound } from "next/navigation";
import Cabinet from "@/components/Cabinet";
import { getBlocks } from "@/lib/api";
import { bm, bt, heroBg } from "@/lib/blocks";
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
  const blocks = await getBlocks(locale);
  const own = bm(blocks, "cabinet.hero");
  const lead = bt(blocks, "cabinet.hero", "text", locale, "");
  return (
    <main>
      <section className={`page-hero${own.video ? " pg-vid" : ""}`} style={{ paddingTop: 110, paddingBottom: 40, ...(own.video ? undefined : heroBg(own.image)) }}>
        {own.video && <video className="pg-vid-bg" src={own.video} poster={own.image || undefined} muted loop autoPlay playsInline preload="metadata" aria-hidden="true" />}
        <div className="wrap pg-vid-in">
          <div className="crumbs"><Link href={`/${locale}`}>{t("common.home")}</Link> › {t("cab.title")}</div>
          <h1 className="disp">{bt(blocks, "cabinet.hero", "title", locale, t("cab.title"))}</h1>
          {lead && <p className="ab-lead">{lead}</p>}
        </div>
      </section>
      <div className="wrap cab-wrap">
        <Cabinet locale={locale} L={pickPrefix(locale, "cab.")} A={pickPrefix(locale, "apply.")} />
      </div>
    </main>
  );
}
