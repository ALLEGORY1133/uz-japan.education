import Link from "next/link";
import { notFound } from "next/navigation";
import ApplyPanel from "@/components/ApplyPanel";
import FundingTabs from "@/components/FundingTabs";
import MediaView from "@/components/MediaView";
import SmartLink from "@/components/SmartLink";
import { getUniversity } from "@/lib/api";
import { pickPrefix, formatDate, getT, isLocale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { UniversityDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(locale: any, slug: string): Promise<UniversityDetail> {
  try {
    return await getUniversity(locale, slug);
  } catch (e: any) {
    if (e?.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  try {
    const u = await getUniversity(locale, slug);
    return { title: u.name, description: u.description?.slice(0, 160) };
  } catch {
    return {};
  }
}

export default async function UniversityPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getT(locale);
  const u = await load(locale, slug);

  const banner = mediaUrl(u.banner);
  const logo = mediaUrl(u.logo);
  const campusVideo = u.media.find((m) => m.slot === "campus_video");
  const gallery = u.media.filter((m) => m !== campusVideo);
  const deadline = u.application_deadline ? formatDate(u.application_deadline, locale) : "";
  const host = u.website_url ? u.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") : "";

  const dates = [
    { label: t("uni.date.start"), v: u.application_start },
    { label: t("uni.date.deadline"), v: u.application_deadline, hot: true },
    { label: t("uni.date.results"), v: u.results_date },
    { label: t("uni.date.term"), v: u.term_start },
  ].filter((d) => d.v);

  const levels = (["bachelor", "master", "doctoral"] as const)
    .map((lv) => ({ lv, items: u.programs.filter((p) => p.level === lv) }))
    .filter((g) => g.items.length > 0);

  const hasFunding = !!(u.contract_fee || u.payment_terms || u.living_cost || u.grant_name || u.grant_coverage || u.grant_criteria);

  const applyLabels: Record<string, string> = {
    ...pickPrefix(locale, "apply."),
    contract: t("uni.contract"), grant: t("uni.grant"),
    "degree.bachelor": t("common.degree.bachelor"), "degree.master": t("common.degree.master"), "degree.doctoral": t("common.degree.doctoral"),
    statusHref: `/${locale}/cabinet`,
    applyHref: `/${locale}/universities/${slug}/apply`,
  };

  return (
    <main>
      <section className="page-hero" style={{ paddingTop: 110 }}>
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="banner" src={banner} alt="" />
        )}
        <div className="wrap" style={{ position: "relative" }}>
          <div className="crumbs">
            <Link href={`/${locale}`}>{t("common.home")}</Link> › <Link href={`/${locale}/universities`}>{t("nav.universities")}</Link> › {u.short_name || u.name}
          </div>
          <div className="uni-head">
            <div className={`uni-logo ${u.native_name ? "jp" : ""}`} style={!logo ? { color: u.brand_color } : undefined}>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" />
              ) : (
                (u.native_name ? u.native_name.slice(0, 1) : u.short_name || u.name.slice(0, 2)).slice(0, 4)
              )}
            </div>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <div className="chips">
                <span className="chip" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>
                  {t(`common.country.${u.country}`)}{u.city ? ` · ${u.city}` : ""}
                </span>
                <span className={`tag ${u.admission_status}`}>{t(`status.${u.admission_status}`)}</span>
              </div>
              <h1 className="disp">{u.name}</h1>
              {u.native_name && <div className="jp" style={{ color: "#cfe0ff", fontSize: 16 }}>{u.native_name}</div>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {u.admission_status !== "closed" && (
                u.apply_mode === "external" && u.apply_url ? (
                  <a className="btn btn-primary" href={u.apply_url} target="_blank" rel="noopener noreferrer">{t("apply.cta")} ↗</a>
                ) : (
                  <a className="btn btn-primary" href="#apply">{t("apply.cta")}</a>
                )
              )}
              {u.website_url && (
                <a className="btn btn-white" href={u.website_url} target="_blank" rel="noopener noreferrer">
                  {t("uni.websiteCta")} ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="facts">
          <div><small>{t("uni.fact.deadline")}</small><b>{deadline || "—"}</b></div>
          <div><small>{t("uni.fact.degrees")}</small><b>{u.degrees.map((d) => t(`common.degree.${d}`)).join(" · ") || "—"}</b></div>
          <div><small>{t("uni.fact.language")}</small><b>{u.instruction_language || "—"}</b></div>
          <div><small>{t("uni.fact.funding")}</small><b>{t("uni.fact.fundingValue")}</b></div>
        </div>

        <div className="layout">
          <div className="main-col">
            {(u.description || campusVideo) && (
              <section className="panel">
                <h2 className="disp">{t("uni.about")}</h2>
                {u.description && <p>{u.description}</p>}
                {campusVideo && (
                  <div className="gallery" style={{ marginTop: 18 }}>
                    <div className="g wide"><MediaView item={campusVideo} /></div>
                  </div>
                )}
              </section>
            )}

            {u.requirements.length > 0 && (
              <section className="panel">
                <h2 className="disp">{t("uni.requirements")}</h2>
                <ul className="req">
                  {u.requirements.map((r) => (
                    <li key={r.id}>
                      <span className="c" />
                      <div><b>{r.title}</b>{r.detail ? ` — ${r.detail}` : ""}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {dates.length > 0 && (
              <section className="panel">
                <h2 className="disp">{t("uni.deadlines")}</h2>
                <div className="timeline">
                  {dates.map((d) => (
                    <div className="tl" key={d.label}>
                      <div className="dot"><i style={d.hot ? { background: "#d3213b" } : undefined} /><u /></div>
                      <div><b>{d.label}</b><span>{formatDate(d.v, locale)}</span></div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {hasFunding && (
              <section className="panel">
                <h2 className="disp">{t("uni.funding")}</h2>
                <FundingTabs
                  contractLabel={t("uni.contract")}
                  grantLabel={t("uni.grant")}
                  contract={[
                    { label: t("uni.fee"), value: u.contract_fee },
                    { label: t("uni.paymentTerms"), value: u.payment_terms },
                    { label: t("uni.living"), value: u.living_cost },
                  ]}
                  grant={[
                    { label: t("uni.grantName"), value: u.grant_name },
                    { label: t("uni.grantCoverage"), value: u.grant_coverage },
                    { label: t("uni.grantCriteria"), value: u.grant_criteria },
                  ]}
                />
              </section>
            )}

            {levels.length > 0 && (
              <section className="panel">
                <h2 className="disp">{t("uni.programs")}</h2>
                {levels.map((g) => (
                  <div className="prog" key={g.lv}>
                    <b>{t(`common.degree.${g.lv}`)}</b>
                    <span style={{ color: "var(--muted)" }}>{g.items.map((p) => p.name).join(", ")}</span>
                  </div>
                ))}
              </section>
            )}

            {gallery.length > 0 && (
              <section className="panel">
                <h2 className="disp">{t("uni.gallery")}</h2>
                <div className="gallery">
                  {gallery.map((m) => (
                    <div className="g" key={m.id}><MediaView item={m} /></div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="side-col">
            <ApplyPanel
              mode={u.apply_mode}
              status={u.admission_status}
              applyUrl={u.apply_url}
              deadline={deadline}
              labels={applyLabels}
            />

            {u.website_url && (
              <div className="web-card">
                <div className="eyebrow">{t("uni.website")}</div>
                <div className="web-id">
                  <div className={`uni-logo ${u.native_name ? "jp" : ""}`} style={{ width: 54, height: 54, borderRadius: 16, fontSize: 24, color: u.brand_color }}>
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="" />
                    ) : (
                      (u.native_name ? u.native_name.slice(0, 1) : (u.short_name || u.name).slice(0, 2))
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <b>{host}</b>
                    <small>{u.name}{u.native_name ? ` · ${u.native_name}` : ""}</small>
                  </div>
                </div>
                <a className="btn btn-white btn-block" href={u.website_url} target="_blank" rel="noopener noreferrer" style={{ minHeight: 50, fontSize: 15 }}>
                  {t("uni.websiteCta")} ↗
                </a>
                <div style={{ fontSize: 12, color: "#d4cdee", marginTop: 12, lineHeight: 1.5 }}>{t("uni.websiteNote")}</div>
              </div>
            )}

            {(u.links.length > 0 || u.admission_url) && (
              <div className="panel">
                <h2 className="disp" style={{ fontSize: 17, marginBottom: 6 }}>{t("uni.links")}</h2>
                <div>
                  {u.admission_url && (
                    <a className="link-row" href={u.admission_url} target="_blank" rel="noopener noreferrer">
                      <span>{t("uni.admissions")}</span><span className="ar" aria-hidden="true">↗</span>
                    </a>
                  )}
                  {u.links.map((l) => (
                    <SmartLink key={l.id} href={l.url} locale={locale} className="link-row">
                      <span>{l.title}</span><span className="ar" aria-hidden="true">{l.is_external ? "↗" : "→"}</span>
                    </SmartLink>
                  ))}
                </div>
              </div>
            )}

            {(u.contact_email || u.contact_phone) && (
              <div className="panel">
                <h2 className="disp" style={{ fontSize: 17, marginBottom: 10 }}>{t("uni.contact")}</h2>
                <div className="kv-line">
                  {u.contact_email && <div><span>{t("uni.admissions")}: </span><a href={`mailto:${u.contact_email}`}>{u.contact_email}</a></div>}
                  {u.contact_phone && <div><span>{t("uni.phone")}: </span><a href={`tel:${u.contact_phone.replace(/\s/g, "")}`}>{u.contact_phone}</a></div>}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
