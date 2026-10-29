import { notFound } from "next/navigation";
import NewsListPage, { listMeta } from "@/components/NewsListPage";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? listMeta("event", locale) : { title: "events" };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <NewsListPage locale={locale} kind="event" />;
}
