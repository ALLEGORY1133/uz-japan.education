import SmartLink from "./SmartLink";
import { formatDate, type TFn } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { DEMO, pickDemo } from "@/lib/demo";
import type { Locale, NewsItem } from "@/lib/types";

/** Karta tugmasi matni: tashqi tadbir → «Tadbirga ulanish», tashqi manba → «Manba: …», qolgani → «Batafsil». */
export function newsCta(n: NewsItem, t: TFn): string {
  const external = n.link_type === "external" && !!n.external_url;
  if (external && n.category === "event") return t("news.join");
  if (external && n.source_name) return `${t("news.source")}: ${n.source_name}`;
  return t("news.read");
}

export default function NewsCard({ n, locale, t, index = 0 }: { n: NewsItem; locale: Locale; t: TFn; index?: number }) {
  const cover = mediaUrl(n.cover) || pickDemo(DEMO[n.category as "news" | "cooperation" | "event" | "platform"] || DEMO.news, index);
  const external = n.link_type === "external" && !!n.external_url;
  const date = formatDate(n.event_starts_at || n.published_at, locale);
  const foot = newsCta(n, t);

  return (
    <SmartLink href={n.href} locale={locale} className="card-link">
      {n.video ? (
        <span className="card-vid">
          <video className="card-cover" src={mediaUrl(n.video) || undefined} poster={cover || undefined} muted loop autoPlay playsInline preload="metadata" aria-hidden="true" />
          <span className="card-play" aria-hidden="true">▶</span>
        </span>
      ) : cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="card-cover" src={cover} alt="" loading="lazy" />
      ) : (
        <div className={`card-cover ${["", "t2", "t3"][index % 3]}`} aria-hidden="true" />
      )}
      <div className="card-body">
        <div className="meta">
          <span className={`tag ${n.category}`}>{t(`news.cat.${n.category}`)}</span>
          <span>{date}</span>
        </div>
        <h3>{n.title}</h3>
        {n.summary && <p>{n.summary}</p>}
        <div className="card-foot">
          <span>{foot}</span>
          <span aria-hidden="true">{external ? "↗" : "→"}</span>
        </div>
      </div>
    </SmartLink>
  );
}
