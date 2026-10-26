"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Icons";
import type { Locale } from "@/lib/types";

type Props = {
  locale: Locale;
  labels: Record<string, string>;
  locales: { code: Locale; name: string }[];
};

export default function Header({ locale, labels, locales }: Props) {
  const pathname = usePathname() || `/${locale}`;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const isHome = pathname === `/${locale}`;
  const rest = pathname.replace(/^\/(uz|ja|en)/, "") || "";

  const items = [
    { href: `/${locale}/about`, label: labels.about },
    { href: `/${locale}/universities`, label: labels.universities },
    { href: `/${locale}#students`, label: labels.scholarships },
    { href: `/${locale}#online`, label: labels.exchange },
    { href: `/${locale}#cooperation`, label: labels.cooperation },
    { href: `/${locale}/news?category=event`, label: labels.events },
    { href: `/${locale}/news`, label: labels.news },
  ];

  return (
    <header className={`site-header ${isHome ? "" : "solid"} ${scrolled ? "scrolled" : ""}`}>
      <div className="header-bar">
        <Link href={`/${locale}`} className="brand" aria-label="UzJapan Education">
          <Logo />
          <b>
            UzJapan<span>Education</span>
          </b>
        </Link>
        <nav className="nav" aria-label="Asosiy menyu">
          {items.map((it) => (
            <Link key={it.href} href={it.href} aria-current={pathname === it.href.split("?")[0] ? "page" : undefined}>
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          <div className="lang" role="group" aria-label="Language">
            {locales.map((l) => (
              <Link key={l.code} href={`/${l.code}${rest}`} aria-current={l.code === locale} hrefLang={l.code}>
                {l.name}
              </Link>
            ))}
          </div>
          <a href="#contact" className="btn btn-white hide-m">
            {labels.contact}
          </a>
          <button
            type="button"
            className="burger"
            aria-label={labels.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="mobile-menu">
          {items.map((it) => (
            <Link key={it.href} href={it.href} onClick={() => setOpen(false)}>
              {it.label}
            </Link>
          ))}
          <a href="#contact" onClick={() => setOpen(false)}>
            {labels.contact}
          </a>
        </div>
      )}
    </header>
  );
}
