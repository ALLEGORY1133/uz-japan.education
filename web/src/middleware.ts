import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["uz", "ja", "en"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  // Brauzer tilidan taxmin: ja / en, aks holda uz
  const accept = (req.headers.get("accept-language") || "").toLowerCase();
  let locale = "uz";
  for (const part of accept.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2);
    if (LOCALES.includes(code)) {
      locale = code;
      break;
    }
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
