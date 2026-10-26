import Link from "next/link";
import { Logo } from "./Icons";
import type { TFn } from "@/lib/i18n";
import type { Locale, SiteSettings } from "@/lib/types";

export default function Footer({ locale, t, settings }: { locale: Locale; t: TFn; settings?: SiteSettings }) {
  const s = settings;
  const socials = [
    { url: s?.telegram_url, label: "Telegram", text: "Tg" },
    { url: s?.youtube_url, label: "YouTube", text: "YT" },
    { url: s?.linkedin_url, label: "LinkedIn", text: "in" },
    { url: s?.instagram_url, label: "Instagram", text: "Ig" },
  ].filter((x) => x.url);

  return (
    <footer className="footer" id="contact">
      <div className="footer-ghost" aria-hidden="true">UzJapan</div>
      <div className="wrap footer-in">
        <div className="footer-cols">
          <div style={{ maxWidth: 380 }}>
            <div className="brand">
              <Logo size={38} />
              <b style={{ fontSize: 20 }}>
                UzJapan<span>Education</span>
              </b>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#c8c4e0", marginTop: 16 }}>
              {t("footer.about")} <b style={{ color: "#fff" }}>Connect · Learn · Grow</b>
            </p>
            {socials.length > 0 && (
              <div className="socials">
                {socials.map((x) => (
                  <a key={x.label} href={x.url} target="_blank" rel="noopener noreferrer" aria-label={x.label}>
                    {x.text}
                  </a>
                ))}
              </div>
            )}
          </div>
          <nav className="footer-nav" aria-label={t("footer.sections")}>
            <h4>{t("footer.sections")}</h4>
            <Link href={`/${locale}/about`}>{t("nav.about")}</Link>
            <Link href={`/${locale}/cabinet`}>{t("cab.title")}</Link>
            <Link href={`/${locale}/universities`}>{t("nav.universities")}</Link>
            <Link href={`/${locale}#students`}>{t("nav.scholarships")}</Link>
            <Link href={`/${locale}#online`}>{t("nav.exchange")}</Link>
            <Link href={`/${locale}#cooperation`}>{t("nav.cooperation")}</Link>
            <Link href={`/${locale}/news?category=event`}>{t("nav.events")}</Link>
            <Link href={`/${locale}/news`}>{t("nav.news")}</Link>
          </nav>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14, color: "#c8c4e0" }}>
            <h4>{t("footer.contact")}</h4>
            {s?.contact_email && <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a>}
            {s?.contact_phone && <a href={`tel:${s.contact_phone.replace(/\s/g, "")}`}>{s.contact_phone}</a>}
            {s?.address && <span>{s.address}</span>}
          </div>
        </div>
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} UzJapan Education. {t("footer.rights")}</div>
          <div style={{ color: "#fff", fontWeight: 600 }}>{t("footer.tagline")}</div>
        </div>
      </div>
    </footer>
  );
}
