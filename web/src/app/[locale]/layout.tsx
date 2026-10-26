import "@fontsource-variable/onest/index.css";
import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource-variable/source-serif-4/index.css";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "@fontsource/noto-sans-jp/500.css";
import "@fontsource/noto-sans-jp/700.css";
import "@fontsource/noto-serif-jp/500.css";
import "@fontsource/noto-serif-jp/700.css";
import "../globals.css";
import "../polish.css";
import "../refine.css";
import "../fun.css";
import "../lively.css";
import "../about.css";
import "../home.css";
import "../cabinet.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RevealRoot from "@/components/RevealRoot";
import TiltRoot from "@/components/TiltRoot";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getHome } from "@/lib/api";
import { getT, isLocale, localeNames, locales } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/types";

const FONT_VARS = {"--f-bricolage": "'Bricolage Grotesque Variable'", "--f-onest": "'Onest Variable'", "--f-serif": "'Source Serif 4 Variable'", "--f-jp": "'Noto Sans JP'", "--f-jpserif": "'Noto Serif JP'" } as React.CSSProperties;

export const metadata: Metadata = {
  title: { default: "UzJapan Education", template: "%s · UzJapan Education" },
  description: "O‘zbekiston va Yaponiya universitetlari o‘rtasidagi ta’lim aloqalari platformasi.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getT(locale);

  let settings: SiteSettings | undefined;
  try {
    settings = (await getHome(locale)).settings;
  } catch {
    settings = undefined; // backend vaqtincha ishlamasa ham footer chiqadi
  }

  const labels = {
    about: t("nav.about"),
    universities: t("nav.universities"),
    scholarships: t("nav.scholarships"),
    exchange: t("nav.exchange"),
    cooperation: t("nav.cooperation"),
    events: t("nav.events"),
    news: t("nav.news"),
    contact: t("nav.contact"),
    menu: t("nav.menu"),
  };

  return (
    <html lang={locale} style={FONT_VARS}>
      <body>
        <Header locale={locale} labels={labels} locales={locales.map((c) => ({ code: c, name: localeNames[c] }))} />
        {children}
        <Footer locale={locale} t={t} settings={settings} />
        <RevealRoot />
        <TiltRoot />
      </body>
    </html>
  );
}
