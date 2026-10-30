import { notFound, redirect } from "next/navigation";
import NewsHub, { tabOf } from "@/components/NewsHub";
import { getT, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type SP = Promise<{ tab?: string; q?: string; page?: string; category?: string }>;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }) {
  const { locale } = await params;
  if (!isLocale(locale)) return { title: "News" };
  const { tab } = await searchParams;
  return { title: getT(locale)(tabOf(tab).title) };
}

export default async function NewsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SP }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { tab, q, page, category } = await searchParams;
  // Eski havolalar: /news?category=event|platform|cooperation
  if (category === "event") redirect(`/${locale}/news?tab=2`);
  if (category === "platform") redirect(`/${locale}/news?tab=3`);
  if (category === "cooperation") redirect(`/${locale}/cooperation`);
  return <NewsHub locale={locale} tab={tab} q={q} page={page} />;
}
