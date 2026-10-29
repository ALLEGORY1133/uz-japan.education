import type { CSSProperties } from "react";
import { mediaUrl } from "./media";
import type { Blocks, Locale } from "./types";

/** Admin kiritgan matn (shu til uchun); bo'sh bo'lsa — standart (fallback). */
export function bt(blocks: Blocks, key: string, field: "title" | "text" | "link_label", locale: Locale, fallback: string): string {
  const v = blocks[key]?.[field]?.[locale];
  return v && v.trim() ? v : fallback;
}

/** Admin yuklagan rasm/video URL'i (bo'lmasa null). */
export function bm(blocks: Blocks, key: string): { image: string | null; video: string | null } {
  const b = blocks[key];
  return { image: mediaUrl(b?.image), video: mediaUrl(b?.video) };
}

/** Admin kiritgan havola (bo'lmasa fallback). */
export function bl(blocks: Blocks, key: string, fallback: string): string {
  const v = blocks[key]?.link_url?.trim();
  return v || fallback;
}

/** Sahifa boshi fonida admin rasmi bo'lsa — inline style. */
export function heroBg(image: string | null): CSSProperties | undefined {
  return image
    ? { backgroundImage: `linear-gradient(rgba(20,24,63,.72), rgba(20,24,63,.72)), url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;
}
