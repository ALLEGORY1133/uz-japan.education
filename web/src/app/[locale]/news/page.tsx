import { notFound, redirect } from "next/navigation";
import NewsListPage, { listMeta } from "@/components/NewsListPage";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? listMeta("news", locale) : { title: "News" };
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Eski havolalar: /news?category=event → /events
  const { category } = await searchParams;
  if (category === "event") redirect(`/${locale}/events`);
  if (category === "cooperation") redirect(`/${locale}/cooperation`);
  return <NewsListPage locale={locale} kind="news" />;
}
