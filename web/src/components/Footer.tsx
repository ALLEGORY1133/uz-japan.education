import { HeadsetIcon, Logo, PhoneIcon, TelegramIcon } from "./Icons";
import type { TFn } from "@/lib/i18n";
import SmartLink from "./SmartLink";
import type { LinkItem, Locale, SiteSettings } from "@/lib/types";

const tgHref = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://t.me/${v.replace(/^@/, "")}`);
const tgText = (v: string) => (/^https?:\/\//i.test(v) ? v.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "@") : `@${v.replace(/^@/, "")}`);

const USEFUL: { title: string; url: string }[] = [
  { title: "Study in Japan (JASSO)", url: "https://www.studyinjapan.go.jp" },
  { title: "MEXT", url: "https://www.mext.go.jp" },
  { title: "JASSO", url: "https://www.jasso.go.jp" },
  { title: "JICA", url: "https://www.jica.go.jp" },
];

export default function Footer({ locale, t, settings, links = [] }: { locale: Locale; t: TFn; settings?: SiteSettings; links?: LinkItem[] }) {
  const s = settings;
  const socials = [
    { url: s?.telegram_url, label: "Telegram", text: "Tg" },
    { url: s?.youtube_url, label: "YouTube", text: "YT" },
    { url: s?.linkedin_url, label: "LinkedIn", text: "in" },
    { url: s?.instagram_url, label: "Instagram", text: "Ig" },
  ].filter((x) => x.url);

  const operators = (s?.operators || []).filter((o) => o.phone || o.telegram);

  return (
    <footer className="footer footer-sm" id="contact">
      <div className="wrap footer-in">
        <div className="fs-row">
          <div className="fs-brand">
            <div className="brand">
              <Logo size={30} />
              <b style={{ fontSize: 17 }}>
                UzJapan<span>Education</span>
              </b>
            </div>
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
          <nav className="fs-links" aria-label={t("footer.links")}>
            <h4>{t("footer.links")}</h4>
            <div>
              {links.slice(0, 4).map((l) => (
                <SmartLink key={`l${l.id}`} href={l.url} locale={locale}>{l.title}</SmartLink>
              ))}
              {USEFUL.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.title} ↗</a>
              ))}
            </div>
          </nav>
          <div className="fs-contact">
            <h4>{t("footer.contact")}</h4>
            {s?.contact_email && <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a>}
            {s?.contact_phone && <a href={`tel:${s.contact_phone.replace(/\s/g, "")}`}>{s.contact_phone}</a>}
            {s?.address && <span>{s.address}</span>}
          </div>
        </div>
        {operators.length > 0 && (
          <section className="fs-ops" aria-label={t("footer.operators")}>
            <h4>{t("footer.operators")}</h4>
            <ul>
              {operators.map((o, i) => (
                <li key={i} className="fs-op">
                  <span className="fs-op-ic"><HeadsetIcon size={20} /></span>
                  <div className="fs-op-body">
                    {o.name && <b>{o.name}</b>}
                    {o.role && <small>{o.role}</small>}
                    <div className="fs-op-links">
                      {o.phone && (
                        <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}><PhoneIcon />{o.phone}</a>
                      )}
                      {o.telegram && (
                        <a href={tgHref(o.telegram)} target="_blank" rel="noopener noreferrer"><TelegramIcon />{tgText(o.telegram)}</a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} UzJapan Education. {t("footer.rights")}</div>
          <div style={{ color: "#fff", fontWeight: 600 }}>{t("footer.tagline")}</div>
        </div>
      </div>
    </footer>
  );
}
