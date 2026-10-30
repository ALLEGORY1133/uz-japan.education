import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/** Tadbirlar endi /news sahifasidagi 2-tab (eski havolalar ishlayversin; maqola sahifasi o'z joyida). */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}/news?tab=2`);
}
