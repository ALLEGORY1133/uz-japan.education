import crypto from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { HomeData, Locale, NewsItem, UniversityDetail, UniversityListItem } from "./types";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Server tomoni keshi (faqat serverda ishlaydi):
 *  - FRESH_MS ichida backend'ga umuman so'rov yubormaydi;
 *  - backend javob bermasa / xato (5xx, tarmoq, timeout) bersa — STALE_MS gacha eski nusxani qaytaradi;
 *  - backend yiqilganda har so'rov kutib qolmasligi uchun qisqa muddat "o'chiq" deb belgilanadi;
 *  - nusxa diskka ham yoziladi, shuning uchun frontend qayta ishga tushsa ham yo'qolmaydi.
 */
const FRESH_MS = Number(process.env.WEB_CACHE_FRESH_SECONDS || 30) * 1000;
const STALE_MS = Number(process.env.WEB_CACHE_STALE_SECONDS || 3 * 3600) * 1000;
const TIMEOUT_MS = Number(process.env.WEB_API_TIMEOUT_MS || 5000);
const DOWN_MS = 15000;

type Entry = { at: number; data: any };
const mem = new Map<string, Entry>();
let downUntil = 0;

function cacheDir() {
  return process.env.WEB_CACHE_DIR || path.join(os.tmpdir(), "uzjapan-cache");
}

function fileFor(key: string) {
  return path.join(cacheDir(), crypto.createHash("sha1").update(key).digest("hex") + ".json");
}

async function readDisk(key: string): Promise<Entry | null> {
  try {
    const e = JSON.parse(await fs.readFile(fileFor(key), "utf8"));
    return e && typeof e.at === "number" ? e : null;
  } catch {
    return null;
  }
}

async function writeDisk(key: string, e: Entry) {
  try {
    await fs.mkdir(cacheDir(), { recursive: true });
    const f = fileFor(key);
    await fs.writeFile(f + ".tmp", JSON.stringify(e));
    await fs.rename(f + ".tmp", f);
  } catch {
    /* disk yozilmasa ham xotiradagi kesh ishlayveradi */
  }
}

async function dropDisk(key: string) {
  try {
    await fs.unlink(fileFor(key));
  } catch {}
}

async function get<T>(apiPath: string, locale: Locale): Promise<T> {
  const sep = apiPath.includes("?") ? "&" : "?";
  const key = `${locale}|${apiPath}`;
  const now = Date.now();

  let entry = mem.get(key) || null;
  if (!entry) {
    entry = await readDisk(key);
    if (entry) mem.set(key, entry);
  }
  if (entry && now - entry.at < FRESH_MS) return entry.data as T;

  const stale = () => (entry && Date.now() - entry.at < STALE_MS ? (entry.data as T) : null);

  if (now < downUntil) {
    const s = stale();
    if (s) return s;
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/public${apiPath}${sep}lang=${locale}`, {
        headers: { "Accept-Language": locale },
        cache: "no-store",
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 500) throw new Error(`API ${res.status}`);
    if (!res.ok) {
      // 404 va h.k.: backend ishlayapti, yozuv yo'q — eski nusxani ko'rsatmaymiz
      mem.delete(key);
      dropDisk(key);
      const err: any = new Error(`API ${res.status}: ${apiPath}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    downUntil = 0;
    const e = { at: Date.now(), data };
    mem.set(key, e);
    writeDisk(key, e);
    return data as T;
  } catch (err: any) {
    if (typeof err?.status === "number" && err.status < 500) throw err;
    downUntil = Date.now() + DOWN_MS;
    const s = stale();
    if (s) {
      console.warn(`[cache] backend javob bermadi, eski nusxa ishlatildi: ${apiPath} (${err?.message || err})`);
      return s;
    }
    throw err;
  }
}

export const getHome = (locale: Locale) => get<HomeData>("/home/", locale);

export const getUniversities = (
  locale: Locale,
  params: { country?: string; degree?: string; search?: string } = {},
) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
  const qs = q.toString();
  return get<UniversityListItem[]>(`/universities/${qs ? `?${qs}` : ""}`, locale);
};

export const getUniversity = (locale: Locale, slug: string) =>
  get<UniversityDetail>(`/universities/${encodeURIComponent(slug)}/`, locale);

export async function getNews(locale: Locale, category?: string) {
  const data = await get<{ results: NewsItem[] }>(
    `/news/${category ? `?category=${category}` : ""}`,
    locale,
  );
  return data.results;
}

export const getNewsItem = (locale: Locale, slug: string) =>
  get<NewsItem>(`/news/${encodeURIComponent(slug)}/`, locale);
