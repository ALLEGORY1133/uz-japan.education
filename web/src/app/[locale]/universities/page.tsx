import Link from "next/link";
import { notFound } from "next/navigation";
import UniversityMark from "@/components/UniversityMark";
import { getUniversities } from "@/lib/api";
import { formatDate, getT, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: isLocale(locale) ? getT(locale)("list.title") : "Universities" };
}

export default async function UniversitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string; degree?: string; search?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const t = getT(locale);
  const items = await getUniversities(locale, { country: sp.country, degree: sp.degree, search: sp.search });

  return (
    <main>
      <section className="page-hero" style={{ paddingTop: 110 }}>
        <div className="wrap">
          <div className="crumbs">
            <Link href={`/${locale}`}>{t("common.home")}</Link> › {t("nav.universities")}
          </div>
          <h1 className="disp">{t("list.title")}</h1>
          <p style={{ margin: 0, color: "#d4cdee" }}>{t("list.sub")}</p>
        </div>
      </section>

      <div className="wrap">
        <form className="filters" method="get" role="search">
          <label>
            {t("common.search")}
            <input type="search" name="search" defaultValue={sp.search || ""} placeholder={t("common.searchPlaceholder")} />
          </label>
          <label>
            {t("common.country")}
            <select name="country" defaultValue={sp.country || ""}>
              <option value="">{t("common.all")}</option>
              <option value="uz">{t("common.country.uz")}</option>
              <option value="jp">{t("common.country.jp")}</option>
            </select>
          </label>
          <label>
            {t("common.degree")}
            <select name="degree" defaultValue={sp.degree || ""}>
              <option value="">{t("common.all")}</option>
              <option value="bachelor">{t("common.degree.bachelor")}</option>
              <option value="master">{t("common.degree.master")}</option>
              <option value="doctoral">{t("common.degree.doctoral")}</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary" style={{ flex: "0 0 auto" }}>{t("common.search")}</button>
        </form>

        <p className="results-count"><b>{items.length}</b> {t("list.count")}</p>
        <div className="grid-cards" style={{ marginTop: 16, paddingBottom: 8 }}>
          {items.length === 0 && <p className="empty" style={{ gridColumn: "1/-1" }}>{t("common.empty")}</p>}
          {items.map((u) => (
            <Link key={u.id} href={`/${locale}/universities/${u.slug}`} className="uni-card" style={{ "--brand": u.brand_color || "#14183F" } as React.CSSProperties}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <UniversityMark u={u} />
                <div style={{ minWidth: 0 }}>
                  <h3>{u.name}</h3>
                  <div className="meta" style={{ marginTop: 2 }}>
                    <span>{t(`common.country.${u.country}`)}{u.city ? ` · ${u.city}` : ""}</span>
                  </div>
                </div>
              </div>
              <div className="chips">
                {u.degrees.map((d) => (
                  <span key={d} className="chip">{t(`common.degree.${d}`)}</span>
                ))}
              </div>
              <div className="card-foot" style={{ alignItems: "center" }}>
                <span className={`tag ${u.admission_status}`}>{t(`status.${u.admission_status}`)}</span>
                <span style={{ color: "var(--muted)", fontWeight: 600 }}>
                  {u.application_deadline ? `${t("common.deadline")}: ${formatDate(u.application_deadline, locale)}` : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
