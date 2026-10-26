import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { isExternal } from "@/lib/media";
import type { Locale } from "@/lib/types";

/** "/universities" -> "/uz/universities"; tashqi yoki #anchor o'zgarmaydi. */
export function localizeHref(locale: Locale, url: string): string {
  if (!url) return `/${locale}`;
  if (isExternal(url) || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) return url;
  if (/^\/(uz|ja|en)(\/|$|#|\?)/.test(url)) return url;
  if (url === "/") return `/${locale}`;
  return `/${locale}${url.startsWith("/") ? "" : "/"}${url}`;
}

type Props = {
  href: string;
  locale: Locale;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
};

export default function SmartLink({ href, locale, children, ...rest }: Props) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  const local = localizeHref(locale, href);
  if (local.startsWith("#") || local.startsWith("mailto:") || local.startsWith("tel:")) {
    return (
      <a href={local} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={local} {...rest}>
      {children}
    </Link>
  );
}
