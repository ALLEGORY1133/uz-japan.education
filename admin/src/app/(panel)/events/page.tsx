"use client";

import NewsSection from "@/components/NewsSection";

export default function EventsPage() {
  return (
    <NewsSection
      category="event"
      title="Tadbirlar"
      lead="Tadbirlar alohida boşqariladi: boşlaniş vaqti, joyi va röyxatdan ötiş havolasi bilan."
      addLabel="+ Tadbir qöşiş"
      galleryTitle="Tadbir galereyasi"
      galleryHint="Tadbirni tanlang va unga rasm yoki video qöşing."
      pickLabel="Tadbirni tanlang"
    />
  );
}
