import BridgeScene from "@/components/BridgeScene";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icons";
import { getBlocks } from "@/lib/api";
import { bl, bm, bt, heroBg } from "@/lib/blocks";
import { getT, isLocale } from "@/lib/i18n";
import SmartLink from "@/components/SmartLink";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: isLocale(locale) ? getT(locale)("nav.about") : "About" };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getT(locale);
  const blocks = await getBlocks(locale);
  const s2img = bm(blocks, "about.s2").image;
  const feats = [
    { icon: "news", c: "#e5483b", k: "f1" },
    { icon: "visa", c: "#0fa896", k: "f2" },
    { icon: "events", c: "#5b3fd0", k: "f3" },
  ];

  return (
    <main className="about">
      {/* 1. Kirish */}
      <section className="page-hero ab-hero" style={{ paddingTop: 120, ...heroBg(bm(blocks, "about.hero").image) }}>
        <div className="wrap">
          <div className="crumbs"><Link href={`/${locale}`}>{t("common.home")}</Link> › {t("nav.about")}</div>
          <span className="eyebrow" style={{ color: "#ffb4a8" }}>{t("about.eyebrow")}</span>
          <h1 className="disp">{bt(blocks, "about.hero", "title", locale, t("about.title"))}</h1>
          <p className="ab-lead">{bt(blocks, "about.hero", "text", locale, t("about.lead"))}</p>
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
          <h2 className="h2 disp">{bt(blocks, "about.s2", "title", locale, t("about.s2.title"))}</h2>
          <p className="ab-text">{bt(blocks, "about.s2", "text", locale, t("about.s2.text"))}</p>
          <ul className="ab-list">
            {[1, 2, 3].map((i) => (
              <li key={i}><span className="ab-dot" />{t(`about.s2.b${i}`)}</li>
            ))}
          </ul>
          <SmartLink className="btn btn-dark" href={bl(blocks, "about.s2", "/universities")} locale={locale}>{bt(blocks, "about.s2", "link_label", locale, t("about.s2.cta"))} →</SmartLink>
        </div>
        {s2img && (
          <div className="ab-pic">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s2img} alt="" loading="lazy" />
          </div>
        )}
      </section>

      {/* 3. Kabinetda nimalar bor */}
      <section className="wrap ab-feats">
        <span className="eyebrow">{t("about.s3.eyebrow")}</span>
        <h2 className="h2 disp">{bt(blocks, "about.s3", "title", locale, t("about.s3.title"))}</h2>
        <p className="ab-text">{bt(blocks, "about.s3", "text", locale, t("about.s3.text"))}</p>
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
          <h2 className="disp">{bt(blocks, "about.cta", "title", locale, t("about.cta.title"))}</h2>
          <p>{bt(blocks, "about.cta", "text", locale, t("about.cta.text"))}</p>
          <SmartLink className="btn btn-white" href={bl(blocks, "about.cta", "/universities")} locale={locale}>{bt(blocks, "about.cta", "link_label", locale, t("about.cta.btn"))} →</SmartLink>
        </div>
      </section>
    </main>
  );
}
