import Link from "next/link";
import UniversityMark from "./UniversityMark";
import type { Locale, UniversityListItem } from "@/lib/types";

function Row({ items, locale, dir }: { items: UniversityListItem[]; locale: Locale; dir: "left" | "right" }) {
  // Cheksiz harakat uchun ro'yxat ikki marta takrorlanadi (-50% siljish)
  const loop = [...items, ...items];
  return (
    <div className={`mq mq-${dir}`}>
      <div className="mq-track">
        {loop.map((u, i) => (
          <Link
            key={`${u.id}-${i}`}
            href={`/${locale}/universities/${u.slug}`}
            className="uchip"
            aria-hidden={i >= items.length ? true : undefined}
            tabIndex={i >= items.length ? -1 : undefined}
          >
            <UniversityMark u={u} />
            <b>
              {u.name}
              <small>{u.native_name ? `${u.native_name} · ` : ""}{u.city}</small>
            </b>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Marquee({ items, locale }: { items: UniversityListItem[]; locale: Locale }) {
  if (items.length === 0) return null;
  // Kam universitet bo'lsa, qator to'lishi uchun ko'paytiramiz
  let base = items;
  while (base.length < 8) base = [...base, ...items];
  return (
    <>
      <Row items={base} locale={locale} dir="left" />
    </>
  );
}
