import BridgeScene from "@/components/BridgeScene";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icons";
import { getT, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: isLocale(locale) ? getT(locale)("nav.about") : "About" };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getT(locale);
  const feats = [
    { icon: "news", c: "#e5483b", k: "f1" },
    { icon: "visa", c: "#0fa896", k: "f2" },
    { icon: "events", c: "#5b3fd0", k: "f3" },
  ];

  return (
    <main className="about">
      {/* 1. Kirish */}
      <section className="page-hero ab-hero" style={{ paddingTop: 120 }}>
        <div className="wrap">
          <div className="crumbs"><Link href={`/${locale}`}>{t("common.home")}</Link> › {t("nav.about")}</div>
          <span className="eyebrow" style={{ color: "#ffb4a8" }}>{t("about.eyebrow")}</span>
          <h1 className="disp">{t("about.title")}</h1>
          <p className="ab-lead">{t("about.lead")}</p>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 56 }}>
        <div className="ab-banner">
          <BridgeScene uz={t("about.art.uz")} jp={t("about.art.jp")} items={[t("about.art.k1"), t("about.art.k2"), t("about.art.k3"), t("about.art.k4")]} />
        </div>
      </section>

      {/* 2. Biz nima qilamiz */}
      <section className="wrap ab-split">
        <div className="ab-copy">
          <span className="eyebrow">{t("about.s2.eyebrow")}</span>
          <h2 className="h2 disp">{t("about.s2.title")}</h2>
          <p className="ab-text">{t("about.s2.text")}</p>
          <ul className="ab-list">
            {[1, 2, 3].map((i) => (
              <li key={i}><span className="ab-dot" />{t(`about.s2.b${i}`)}</li>
            ))}
          </ul>
          <Link className="btn btn-dark" href={`/${locale}/universities`}>{t("about.s2.cta")} →</Link>
        </div>
      </section>

      {/* 3. Kabinetda nimalar bor */}
      <section className="wrap ab-feats">
        <span className="eyebrow">{t("about.s3.eyebrow")}</span>
        <h2 className="h2 disp">{t("about.s3.title")}</h2>
        <p className="ab-text">{t("about.s3.text")}</p>
        <div className="ab-grid">
          {feats.map((f) => (
            <article className="ab-feat" key={f.k} style={{ ["--c" as string]: f.c }}>
              <span className="ab-ico"><Icon name={f.icon} color="#fff" size={26} /></span>
              <h3>{t(`about.${f.k}.t`)}</h3>
              <p>{t(`about.${f.k}.d`)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Chaqiruv */}
      <section className="wrap ab-ctaw">
        <div className="ab-cta">
          <i className="ab-cta-glow" aria-hidden="true" />
          <span className="eyebrow" style={{ color: "#fff", opacity: 0.85 }}>{t("about.cta.eyebrow")}</span>
          <h2 className="disp">{t("about.cta.title")}</h2>
          <p>{t("about.cta.text")}</p>
          <Link className="btn btn-white" href={`/${locale}/universities`}>{t("about.cta.btn")} →</Link>
        </div>
      </section>
    </main>
  );
}
