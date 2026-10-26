const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MEDIA = process.env.NEXT_PUBLIC_MEDIA_URL || API;
const KEY = "uzj_admin_tokens";

export type Tokens = { access: string; refresh: string };

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any) {
    super(
      status >= 500
        ? `Serverda içki xatolik yuz berdi (${status}). Qayta urinib köring; takrorlansa, administratorga xabar bering.`
        : typeof data === "string"
          ? data
          : data?.detail || `Xatolik (${status})`,
    );
    this.status = status;
    this.data = data;
  }
}

export function getTokens(): Tokens | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function setTokens(t: Tokens | null) {
  try {
    if (t) localStorage.setItem(KEY, JSON.stringify(t));
    else localStorage.removeItem(KEY);
  } catch {
    /* brauzer xotirasi yopiq bo'lishi mumkin */
  }
}

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** DRF sahifalangan ({results}) yoki oddiy ro'yxat — ikkalasidan massiv qaytaradi. */
export function listOf<T = any>(data: any): T[] {
  return Array.isArray(data) ? data : data?.results || [];
}

export async function login(username: string, password: string) {
  let res: Response;
  try {
    res = await fetch(`${API}/api/admin/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new ApiError(0, "Serverga ulanib bölmadi. Internet yoki server holatini tekşiring.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  setTokens({ access: data.access, refresh: data.refresh });
  return data.user;
}

async function refreshAccess(): Promise<boolean> {
  const t = getTokens();
  if (!t?.refresh) return false;
  const res = await fetch(`${API}/api/admin/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: t.refresh }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  setTokens({ access: data.access, refresh: data.refresh || t.refresh });
  return true;
}

type Opts = { method?: string; json?: any; form?: FormData };

/** path: /api/admin ga nisbatan, masalan "/universities/1/" */
export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const send = () => {
    const t = getTokens();
    const headers: Record<string, string> = { "Accept-Language": "uz" };
    if (t?.access) headers.Authorization = `Bearer ${t.access}`;
    let body: BodyInit | undefined;
    if (opts.form) body = opts.form;
    else if (opts.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.json);
    }
    // Server javob bermasa (masalan qayta ishga tushayotgan bo'lsa) sahifa abadiy "Yuklanmoqda"da qotib qolmasin.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.form ? 120000 : 15000);
    return fetch(`${API}/api/admin${path}`, { method: opts.method || (body ? "POST" : "GET"), headers, body, signal: ctrl.signal }).finally(() => clearTimeout(timer));
  };

  // Server o'chiq yoki tarmoq uzilgan bo'lsa brauzerning "Failed to fetch" o'rniga tushunarli xabar.
  const safeSend = async () => {
    try {
      return await send();
    } catch {
      throw new ApiError(0, "Serverga ulanib bölmadi. Internet yoki server holatini tekşiring.");
    }
  };

  let res = await safeSend();
  if (res.status === 401 && (await refreshAccess())) res = await safeSend();
  if (res.status === 401) {
    setTokens(null);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("uzj-logout"));
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data ?? res.statusText);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

/** Himoyalangan faylni (Bearer token bilan) yuklab olib, brauzerda saqlash oynasini ochadi. */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const get = () => {
    const t = getTokens();
    return fetch(`${API}/api/admin${path}`, { headers: t?.access ? { Authorization: `Bearer ${t.access}` } : {} });
  };
  let res = await get();
  if (res.status === 401 && (await refreshAccess())) res = await get();
  if (!res.ok) throw new ApiError(res.status, res.status === 404 ? "Fayl topilmadi." : res.statusText);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function publicPost(path: string, body: any) {
  let res: Response;
  try {
    res = await fetch(`${API}/api/admin/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "Serverga ulanib bölmadi. Internet yoki server holatini tekşiring.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/** Parolni tiklash havolasini so'rash (hisob bor-yo'qligi oshkor qilinmaydi). */
export const forgotPassword = (identifier: string) => publicPost("forgot/", { identifier });
/** Havoladagi uid/token bilan yangi parol o'rnatish. */
export const resetPassword = (uid: string, token: string, password: string) => publicPost("reset/", { uid, token, password });
