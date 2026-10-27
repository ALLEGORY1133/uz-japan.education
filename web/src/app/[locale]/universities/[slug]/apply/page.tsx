import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ApplyForm from "@/components/ApplyForm";
import { getUniversity } from "@/lib/api";
import { getT, isLocale, pickPrefix } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getT(locale)("apply.f.title"), robots: { index: false } };
}

export default async function ApplyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getT(locale);
  let u;
  try {
    u = await getUniversity(locale, slug);
  } catch (e: any) {
    if (e?.status === 404) notFound();
    throw e;
  }
  const back = `/${locale}/universities/${slug}`;
  // Tashqi ariza yoki yopiq qabul bo'lsa — universitet sahifasiga qaytaramiz
  if (u.apply_mode === "external" || u.admission_status !== "open") redirect(back);

  const labels: Record<string, string> = {
    ...pickPrefix(locale, "apply."),
    contract: t("uni.contract"), grant: t("uni.grant"),
    "degree.bachelor": t("common.degree.bachelor"), "degree.master": t("common.degree.master"), "degree.doctoral": t("common.degree.doctoral"),
    statusHref: `/${locale}/cabinet`,
  };

  return (
    <main>
      <section className="page-hero" style={{ paddingTop: 110, paddingBottom: 40 }}>
        <div className="wrap">
          <div className="crumbs">
            <Link href={`/${locale}`}>{t("common.home")}</Link> › <Link href={`/${locale}/universities`}>{t("nav.universities")}</Link> › <Link href={back}>{u.short_name || u.name}</Link> › {t("apply.f.title")}
          </div>
          <h1 className="disp">{t("apply.f.title")}</h1>
        </div>
      </section>
      <div className="wrap" style={{ paddingBottom: 80 }}>
        <ApplyForm slug={u.slug} uniName={u.name} backHref={back} labels={labels} />
      </div>
    </main>
  );
}
