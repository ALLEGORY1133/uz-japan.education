"use client";

import NewsSection from "@/components/NewsSection";

export default function UpdatesPage() {
  return (
    <NewsSection
      category="platform"
      title="Sayt yangiliklari"
      lead="Saytning özi haqidagi yangilik va ma’lumotlar: yangi imkoniyatlar, özgarişlar, yöriqnomalar. Bosh sahifadagi video band yonida va «E’lonlar» sahifasida körinadi."
      addLabel="+ E’lon qöşiş"
      galleryTitle="E’lon galereyasi"
      galleryHint="E’lonni tanlang va unga rasm yoki video qöşing."
      pickLabel="E’lonni tanlang"
    />
  );
}
