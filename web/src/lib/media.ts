const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL || "http://localhost:8000";

/** Backend nisbiy (/media/...) URL qaytaradi; brauzer uchun to'liq manzilga aylantiradi. */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** YouTube/Vimeo havolasini embed manzilga aylantiradi (boshqasi — null). */
export function embedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/);
      if (m) return `https://www.youtube-nocookie.com/embed/${m[2]}`;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* noto'g'ri URL */
  }
  return null;
}

export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
