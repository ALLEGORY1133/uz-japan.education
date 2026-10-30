import Icon from "./Icons";
import SmartLink from "./SmartLink";
import { isExternal, mediaUrl } from "@/lib/media";
import type { TFn } from "@/lib/i18n";
import type { LinkItem, Locale } from "@/lib/types";

const tone: Record<string, { cls: string; color: string }> = {
  scholarship: { cls: "red", color: "#e5483b" },
  language: { cls: "teal", color: "#0fa896" },
  visa: { cls: "violet", color: "#5b3fd0" },
  housing: { cls: "red", color: "#e5483b" },
  other: { cls: "violet", color: "#5b3fd0" },
};

export default function LinkCard({ l, locale, t }: { l: LinkItem; locale: Locale; t: TFn }) {
  const ext = l.is_external || isExternal(l.url);
  const tn = tone[l.icon] || tone.other;
  return (
    <SmartLink href={l.url} locale={locale} className="card-link icon-card" style={{ ["--c" as string]: tn.color }}>
      {l.image || l.video ? (
        <span className="lc-media">
          {l.video ? (
            <video src={mediaUrl(l.video)!} poster={mediaUrl(l.image) || undefined} muted loop autoPlay playsInline preload="metadata" aria-hidden="true" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(l.image)!} alt="" loading="lazy" />
          )}
        </span>
      ) : (
        <span className={`qi ${tn.cls}`}>
          <Icon name={l.icon} color={tn.color} />
        </span>
      )}
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>{l.title}</h3>
      {l.description && <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>{l.description}</p>}
      <div className="card-foot">
        <span>{ext ? t("links.external") : t("links.internal")}</span>
        <span aria-hidden="true">{ext ? "↗" : "→"}</span>
      </div>
    </SmartLink>
  );
}
