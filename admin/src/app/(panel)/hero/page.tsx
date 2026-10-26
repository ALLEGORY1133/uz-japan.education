"use client";

import { useEffect, useState } from "react";
import { api, listOf } from "@/lib/api";
import ResourceManager from "@/components/ResourceManager";
import MediaPanel from "@/components/MediaPanel";
import { FieldDef } from "@/components/Form";
import { mediaUrl } from "@/lib/api";

const FIELDS: FieldDef[] = [
  { name: "eyebrow", label: "Kiçik yozuv (sarlavha tepasida)", tr: true },
  { name: "title", label: "Sarlavha", tr: true, required: true },
  { name: "highlight", label: "Rangli söz", tr: true, help: "Sarlavhadagi ajratib körsatiladigan söz" },
  { name: "description", label: "Tavsif", tr: true, type: "textarea" },
  { name: "primary_label", label: "Asosiy tugma matni", tr: true },
  { name: "primary_url", label: "Asosiy tugma havolasi", help: "/universities yoki https://..." },
  { name: "secondary_label", label: "Ikkinçi tugma matni", tr: true },
  { name: "secondary_url", label: "Ikkinçi tugma havolasi" },
  { name: "theme", label: "Rang mavzusi", type: "select", options: [
    { value: "sunset", label: "Quyoş botişi (Yaponiya)" }, { value: "teal", label: "Firuza (Özbekiston)" }, { value: "violet", label: "Binafşa (Almaşinuv)" },
  ] },
  { name: "media_kind", label: "Fon turi", type: "select", options: [
    { value: "none", label: "Rasmsiz (faqat rang)" }, { value: "image", label: "Rasm" }, { value: "video", label: "Video" },
  ] },
  { name: "image", label: "Fon rasmi", type: "image", showIf: (v) => v.media_kind === "image" },
  { name: "video", label: "Fon video fayli", type: "file", accept: "video/*", showIf: (v) => v.media_kind === "video" },
  { name: "video_url", label: "yoki YouTube/Vimeo havolasi", type: "url", showIf: (v) => v.media_kind === "video" },
  { name: "is_visible", label: "Saytda körsatilsin", type: "bool" },
];

function SlideImages() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    api("/hero-slides/").then((d) => setList(listOf(d))).catch(() => {});
  }, []);
  return (
    <MediaPanel
      icon="hero" title="Slayd uçun qöşimça rasmlar"
      hint="Slaydni tanlab, unga bir neçta rasm yuklang — ular asosiy rasm bilan birga yumşoq almaşib turadi (slaydning “Fon turi” — Rasm bölişi kerak)."
      pickLabel="Slaydni tanlang"
      items={list.map((n) => ({ id: n.id, label: n.title || String(n.id), sub: n.primary_label, thumb: n.media_kind === "image" && n.image ? mediaUrl(n.image) : null }))}
    >
      {(sel) => (
        <ResourceManager
          key={sel.id}
          endpoint="/hero-slide-images/"
          fields={[{ name: "image", label: "Rasm", type: "image", required: true }]}
          query={{ slide: sel.id }}
          fixed={{ slide: sel.id }}
          reorder
          layout="grid"
          bulk={{ field: "image", label: "Köp rasm yuklaş" }}
          addLabel="+ Rasm qöşiş"
          row={(m) => ({ title: "Rasm", thumb: m.image ? mediaUrl(m.image) : null })}
        />
      )}
    </MediaPanel>
  );
}

export default function HeroPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Boş sahifa slayderi</h1>
          <p>Slaydlar saytda şu yerdagi tartibda almaşadi. Tartibni ↑ ↓ tugmalari bilan özgartiring.</p>
        </div>
      </div>
      <ResourceManager
        endpoint="/hero-slides/"
        fields={FIELDS}
        reorder
        toggle={{ field: "is_visible", on: "Yaşiriş", off: "Körsatiş" }}
        defaults={{ theme: "sunset", media_kind: "none", is_visible: true }}
        addLabel="+ Slayd qöşiş"
        row={(s) => ({
          title: s.title,
          sub: s.primary_label,
          thumb: s.media_kind === "image" && s.image ? mediaUrl(s.image) : null,
          video: s.media_kind === "video",
        })}
      />
      <SlideImages />
    </>
  );
}
