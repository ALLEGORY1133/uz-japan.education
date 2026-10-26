"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getT, isLocale } from "@/lib/i18n";

/** Sahifa ichidagi kutilmagan xatolik (masalan, backend javob bermasa) — xom "500" o'rniga tushunarli ekran. */
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname() || "/uz";
  const seg = pathname.split("/")[1] || "uz";
  const locale = isLocale(seg) ? seg : "uz";
  const t = getT(locale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="err-page">
      <div className="wrap">
        <p className="err-code" aria-hidden="true">500</p>
        <h1>{t("error.title")}</h1>
        <p className="err-text">{t("error.text")}</p>
        <div className="err-actions">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>{t("error.retry")}</button>
          <Link className="btn btn-outline" href={`/${locale}`}>{t("error.home")}</Link>
        </div>
        {error.digest && <p className="err-digest">ID: {error.digest}</p>}
      </div>
    </main>
  );
}
