import { embedUrl, mediaUrl } from "@/lib/media";

type Item = { kind: "image" | "video"; file: string | null; video_url: string; caption?: string };

/** Rasm, yuklangan video yoki YouTube/Vimeo — bittasini mos ravishda chiqaradi. */
export default function MediaView({ item }: { item: Item }) {
  const media = renderMedia(item);
  if (!media) return null;
  const cap = (item.caption || "").trim();
  return (
    <>
      {media}
      {cap && <figcaption className={`mv-cap ${item.kind === "image" ? "" : "top"}`}><span>{cap}</span></figcaption>}
    </>
  );
}

function renderMedia(item: Item) {
  if (item.kind === "image") {
    const src = mediaUrl(item.file);
    // eslint-disable-next-line @next/next/no-img-element
    return src ? <img src={src} alt={item.caption || ""} loading="lazy" /> : null;
  }
  if (item.file) {
    return <video src={mediaUrl(item.file)!} controls playsInline preload="metadata" aria-label={item.caption || undefined} />;
  }
  const e = embedUrl(item.video_url);
  if (e) {
    return <iframe src={e} title={item.caption || "Video"} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />;
  }
  return null;
}
