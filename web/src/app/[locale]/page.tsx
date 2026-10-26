import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import HeroSlider from "@/components/HeroSlider";
import Icon from "@/components/Icons";
import CountUp from "@/components/CountUp";
import InquiryForm from "@/components/InquiryForm";
import Marquee from "@/components/Marquee";
import SmartLink from "@/components/SmartLink";
import { getHome } from "@/lib/api";
import { getT, isLocale, pickPrefix } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getT(locale);
  const data = await getHome(locale);

  type Row = { label: string; href: string; icon?: string };
  const cards: { k: string; icon: string; c: string; img: string | null; id: string; rows: Row[]; sub?: string }[] = [
    {
      k: "c1", icon: "scholarship", c: "#e5483b", img: mediaUrl(data.media.students_card?.image), id: "students",
      rows: [
        { label: t("home.c1.status"), href: `/${locale}/cabinet`, icon: "visa" },
        ...data.links.slice(0, 4).map((l) => ({ label: l.title, href: l.url, icon: l.icon })),
      ],
      sub: data.links.length ? t("home.links") : undefined,
    },
    {
      k: "c2", icon: "university", c: "#0fa896", img: mediaUrl(data.media.collab_card?.image), id: "cooperation",
      rows: [
        { label: t("home.c2.jp"), href: `/${locale}/universities?country=jp` },
        { label: t("home.c2.uz"), href: `/${locale}/universities?country=uz` },
        { label: t("home.c2.all"), href: `/${locale}/universities` },
      ],
    },
    {
      k: "c3", icon: "news", c: "#5b3fd0", img: null, id: "exchange",
      rows: [
        { label: t("nav.news"), href: `/${locale}/news`, icon: "news" },
        { label: t("nav.cooperation"), href: `/${locale}/news?category=cooperation`, icon: "cooperation" },
        { label: t("nav.events"), href: `/${locale}/news?category=event`, icon: "events" },
      ],
    },
  ];

  return (
    <main>
      <HeroSlider
        slides={data.hero}
        locale={locale}
        labels={{ prev: t("slider.prev"), next: t("slider.next"), pause: t("slider.pause") }}
      />

      {/* Biz haqimizda: uchta yo'nalish */}
      <section className="wrap hm-about" id="directions">
        <div className="hm-top">
          <div className="hm-copy">
            <span className="eyebrow">{t("home.s1.eyebrow")}</span>
            <h2 className="h2 disp">{t("home.s1.title")}</h2>
            <p>{t("home.s1.text")}</p>
          </div>
          {data.stats.length > 0 && (
            <div className="hm-stats">
              {data.stats.slice(0, 3).map((s) => (
                <div key={s.id}>
                  <b><CountUp value={s.value} /><i>{s.suffix}</i></b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="hm-cards">
          {cards.map((c) => (
            <article key={c.k} id={c.id} className="hm-card" style={{ "--c": c.c } as CSSProperties}>
              <span className={`hm-pic ${c.img ? "" : `art ${c.k}`}`} style={c.img ? { backgroundImage: `url(${c.img})` } : undefined}>
                {!c.img && <i aria-hidden="true" />}
                <span className="hm-badge"><Icon name={c.icon} color="#fff" size={22} /></span>
              </span>
              <div className="hm-body">
                <h3>{t(`home.${c.k}.t`)}</h3>
                <p>{t(`home.${c.k}.d`)}</p>
                {c.sub && <small className="hm-sub">{c.sub}</small>}
                <ul className="hm-links">
                  {c.rows.map((r, i) => (
                    <li key={`${r.href}-${i}`}>
                      <SmartLink href={r.href} locale={locale}>
                        {r.icon && <span className="hm-lic"><Icon name={r.icon} size={16} /></span>}
                        <span className="hm-lt">{r.label}</span>
                        <span className="hm-arr" aria-hidden="true">→</span>
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Hamkor universitetlar: harakatlanuvchi lenta */}
      {data.universities.length > 0 && (
        <section className="hm-marq" aria-label={t("home.c2.t")}>
          <Marquee items={data.universities} locale={locale} />
        </section>
      )}

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
