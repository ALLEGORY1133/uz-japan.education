import BridgeScene from "@/components/BridgeScene";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAbout, getBlocks } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import type { AboutItem } from "@/lib/types";
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
  const [blocks, about] = await Promise.all([getBlocks(locale), getAbout(locale)]);
  const s2img = bm(blocks, "about.s2").image;
  const Media = ({ it }: { it: AboutItem }) => {
    const img = mediaUrl(it.image);
    const vid = mediaUrl(it.video);
    if (!img && !vid) return null;
    return (
      <span className="ab-media">
        {vid ? (
          <video src={vid} poster={img || undefined} muted loop autoPlay playsInline preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img!} alt="" loading="lazy" />
        )}
      </span>
    );
  };
  const Body = ({ it }: { it: AboutItem }) =>
    it.body ? (
      <details className="ab-more">
        <summary>{t("about.more")}</summary>
        <p>{it.body}</p>
      </details>
    ) : null;

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

      {/* 3. Tarix */}
      {about.history.length > 0 && (
        <section className="wrap ab-hist" id="history">
          <span className="eyebrow">{t("about.hist.eyebrow")}</span>
          <h2 className="h2 disp">{bt(blocks, "about.history", "title", locale, t("about.hist.title"))}</h2>
          <p className="ab-text">{bt(blocks, "about.history", "text", locale, t("about.hist.text"))}</p>
          <ol className="ab-tl">
            {about.history.map((it) => (
              <li key={it.id}>
                <span className="ab-tl-year">{it.year || "•"}</span>
                <div className="ab-tl-card">
                  <Media it={it} />
                  <h3>{it.title}</h3>
                  {it.summary && <p>{it.summary}</p>}
                  <Body it={it} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 4. Yutuqlarimiz katalogi */}
      {about.achievements.length > 0 && (
        <section className="wrap ab-ach" id="achievements">
          <span className="eyebrow">{t("about.ach.eyebrow")}</span>
          <h2 className="h2 disp">{bt(blocks, "about.achievements", "title", locale, t("about.ach.title"))}</h2>
          <p className="ab-text">{bt(blocks, "about.achievements", "text", locale, t("about.ach.text"))}</p>
          <div className="ab-cards">
            {about.achievements.map((it) => (
              <article className="ab-card" key={it.id}>
                <Media it={it} />
                <div className="ab-card-body">
                  {it.year && <span className="ab-chip">{it.year}</span>}
                  <h3>{it.title}</h3>
                  {it.summary && <p>{it.summary}</p>}
                  <Body it={it} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 5. Tahlillar */}
      {about.analyses.length > 0 && (
        <section className="wrap ab-ana" id="analysis">
          <span className="eyebrow">{t("about.ana.eyebrow")}</span>
          <h2 className="h2 disp">{bt(blocks, "about.analysis", "title", locale, t("about.ana.title"))}</h2>
          <p className="ab-text">{bt(blocks, "about.analysis", "text", locale, t("about.ana.text"))}</p>
          <div className="ab-cards">
            {about.analyses.map((it) => (
              <article className="ab-card" key={it.id}>
                <Media it={it} />
                <div className="ab-card-body">
                  {it.year && <span className="ab-chip">{it.year}</span>}
                  <h3>{it.title}</h3>
                  {it.summary && <p>{it.summary}</p>}
                  <Body it={it} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 6. Chaqiruv */}
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
