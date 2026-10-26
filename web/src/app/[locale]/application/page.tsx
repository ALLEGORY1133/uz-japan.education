import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/** Eski manzil: kabinetga yo'naltiriladi. */
export default async function ApplicationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}/cabinet`);
}
