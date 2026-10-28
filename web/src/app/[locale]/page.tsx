import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import HeroSlider from "@/components/HeroSlider";
import Icon from "@/components/Icons";
import Carousel from "@/components/Carousel";
import CountUp from "@/components/CountUp";
import UniversityMark from "@/components/UniversityMark";
import InquiryForm from "@/components/InquiryForm";
import Marquee from "@/components/Marquee";
import SmartLink from "@/components/SmartLink";
import { getHome } from "@/lib/api";
import { formatDate, getT, isLocale, pickPrefix } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getT(locale);
  const data = await getHome(locale);

  const stat = (i: number) => ["#e5483b", "#0fa896", "#5b3fd0", "#f5a524", "#2b7bd8", "#a02c78"][i % 6];
  const cr = { prev: t("slider.prev"), next: t("slider.next") };
  const studentsImg = mediaUrl(data.media.students_card?.image);
  const collabImg = mediaUrl(data.media.collab_card?.image);

  const pic = (img: string | null, art: string, icon: string, color: string) => (
    <span className={`cs-pic ${img ? "" : `art ${art}`}`} style={{ "--c": color } as CSSProperties}>
      {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="" loading="lazy" /> : <i aria-hidden="true" />}
      <span className="cs-badge"><Icon name={icon} color="#fff" size={22} /></span>
    </span>
  );

  return (
    <main>
      <HeroSlider
        slides={data.hero}
        locale={locale}
        labels={{ prev: t("slider.prev"), next: t("slider.next"), pause: t("slider.pause") }}
      />

      {/* Statistika: headerning tagida karta ko'rinishida */}
      {data.stats.length > 0 && (
        <section className="wrap hs" aria-label={t("home.s1.eyebrow")}>
          <div className="hs-grid">
            {data.stats.slice(0, 6).map((s, i) => (
              <div key={s.id} className="hs-card" style={{ "--c": stat(i), "--d": `${i * 90}ms` } as CSSProperties}>
                <span className="hs-ico" aria-hidden="true"><Icon name={["university", "scholarship", "cooperation", "news", "events", "visa"][i % 6]} color="#fff" size={22} /></span>
                <b><CountUp value={s.value} /><i>{s.suffix}</i></b>
                <span className="hs-l">{s.label}</span>
                <em aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Kirish matni */}
      <section className="wrap hm-about" id="directions">
        <div className="hm-top">
          <div className="hm-copy">
            <span className="eyebrow">{t("home.s1.eyebrow")}</span>
            <h2 className="h2 disp">{t("home.s1.title")}</h2>
            <p>{t("home.s1.text")}</p>
          </div>
        </div>
      </section>

      {/* 1) Talaba kabineti */}
      <section className="wrap hx" id="students" style={{ "--c": "#e5483b" } as CSSProperties}>
        <div className="hx-head">
          <span className="eyebrow">{t("nav.scholarships")}</span>
          <h2 className="h2 disp">{t("home.c1.t")}</h2>
          <p>{t("home.c1.d")}</p>
        </div>
        <Carousel label={t("home.c1.t")} {...cr}>
          <SmartLink href={`/${locale}/cabinet`} locale={locale} className="cs">
            {pic(studentsImg, "c1", "visa", "#e5483b")}
            <span className="cs-body"><b>{t("home.c1.status")}</b><small>{t("cab.title")}</small><span className="cs-go">{t("home.open")} →</span></span>
          </SmartLink>
          {data.links.map((l, i) => (
            <SmartLink key={l.id} href={l.url} locale={locale} className="cs">
              {pic(null, ["c1", "c2", "c3"][i % 3], l.icon, ["#e5483b", "#0fa896", "#5b3fd0"][i % 3])}
              <span className="cs-body"><b>{l.title}</b>{l.description && <small>{l.description}</small>}<span className="cs-go">{t("home.open")} →</span></span>
            </SmartLink>
          ))}
        </Carousel>
      </section>

      {/* 2) Universitetlar va hamkorlik */}
      <section className="wrap hx" id="cooperation" style={{ "--c": "#0fa896" } as CSSProperties}>
        <div className="hx-head">
          <span className="eyebrow">{t("nav.cooperation")}</span>
          <h2 className="h2 disp">{t("home.c2.t")}</h2>
          <p>{t("home.c2.d")}</p>
          <div className="hx-chips">
            <SmartLink href={`/${locale}/universities?country=jp`} locale={locale}>{t("home.c2.jp")}</SmartLink>
            <SmartLink href={`/${locale}/universities?country=uz`} locale={locale}>{t("home.c2.uz")}</SmartLink>
            <SmartLink href={`/${locale}/universities`} locale={locale}>{t("home.c2.all")} →</SmartLink>
          </div>
        </div>
        {data.universities.length > 0 && (
          <Carousel label={t("home.c2.t")} {...cr} auto={4800}>
            {data.universities.map((u) => {
              const banner = mediaUrl(u.banner);
              return (
                <SmartLink key={u.id} href={`/${locale}/universities/${u.slug}`} locale={locale} className="cs cs-uni">
                  <span className={`cs-pic ${banner ? "" : "art c2"}`} style={{ background: banner ? undefined : `linear-gradient(135deg, ${u.brand_color}, #0fa896)` }}>
                    {banner ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={banner} alt="" loading="lazy" /> : <i aria-hidden="true" />}
                    <span className="cs-mark"><UniversityMark u={u} /></span>
                    <span className={`tag ${u.admission_status} cs-tag`}>{t(`status.${u.admission_status}`)}</span>
                  </span>
                  <span className="cs-body">
                    <b>{u.name}</b>
                    <small>{u.native_name ? `${u.native_name} · ` : ""}{u.city} · {t(`common.country.${u.country}`)}</small>
                    {u.application_deadline && <small>{t("common.deadline")}: <b style={{ display: "inline" }}>{formatDate(u.application_deadline, locale)}</b></small>}
                    <span className="cs-go">{t("home.open")} →</span>
                  </span>
                </SmartLink>
              );
            })}
          </Carousel>
        )}
      </section>

      {/* Hamkor universitetlar lentasi */}
      {data.universities.length > 0 && (
        <section className="hm-marq" aria-label={t("home.c2.t")}>
          <Marquee items={data.universities} locale={locale} />
        </section>
      )}

      {/* 3) Yangiliklar, hamkorlik, tadbirlar */}
      <section className="wrap hx" id="exchange" style={{ "--c": "#5b3fd0" } as CSSProperties}>
        <div className="hx-head">
          <span className="eyebrow">{t("nav.news")}</span>
          <h2 className="h2 disp">{t("home.c3.t")}</h2>
          <p>{t("home.c3.d")}</p>
          <div className="hx-chips">
            <SmartLink href={`/${locale}/news`} locale={locale}>{t("nav.news")}</SmartLink>
            <SmartLink href={`/${locale}/news?category=cooperation`} locale={locale}>{t("nav.cooperation")}</SmartLink>
            <SmartLink href={`/${locale}/news?category=event`} locale={locale}>{t("nav.events")} →</SmartLink>
          </div>
        </div>
        {data.news.length > 0 && (
          <Carousel label={t("home.c3.t")} {...cr} auto={6200}>
            {data.news.map((n, i) => {
              const cover = mediaUrl(n.cover);
              const external = n.link_type === "external" && !!n.external_url;
              return (
                <SmartLink key={n.id} href={n.href} locale={locale} className="cs cs-news">
                  <span className={`cs-pic ${cover || n.video ? "" : `art c${(i % 3) + 1}`}`}>
                    {n.video ? (
                      <video src={mediaUrl(n.video) || undefined} poster={cover || undefined} muted loop autoPlay playsInline preload="metadata" />
                    ) : cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" loading="lazy" />
                    ) : <i aria-hidden="true" />}
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
        )}
      </section>

      {/* Onlayn ariza / savol formasi */}
      <section className="wrap hm-qw" id="online">
        <div className="hm-q">
          <i className="hm-q-glow" aria-hidden="true" />
          <div className="hm-q-fuji jp" aria-hidden="true">鳥居</div>
          <div className="hm-q-copy">
            <span className="eyebrow" style={{ color: "#fff", opacity: 0.9 }}>{t("home.q.eyebrow")}</span>
            <h2 className="disp">{t("home.q.title")}</h2>
            <p>{t("home.q.text")}</p>
          </div>
          <InquiryForm labels={pickPrefix(locale, "home.q.")} />
        </div>
      </section>
    </main>
  );
}
