"use client";

import { useEffect, useState } from "react";
import { api, listOf, mediaUrl } from "@/lib/api";
import ResourceManager from "@/components/ResourceManager";
import MediaPanel from "@/components/MediaPanel";
import { FieldDef } from "@/components/Form";

export type NewsCategory = "news" | "event" | "cooperation" | "platform";

const MEDIA_FIELDS: FieldDef[] = [
  { name: "kind", label: "Turi", type: "select", options: [{ value: "image", label: "Rasm" }, { value: "video", label: "Video" }] },
  { name: "file", label: "Fayl (rasm yoki video)", type: "file" },
  { name: "video_url", label: "Video havolasi (YouTube/Vimeo)", type: "url", showIf: (v) => v.kind === "video" },
  { name: "caption", label: "Izoh" },
];

/** Har bir bo'lim (yangilik / tadbir / hamkorlik) o'z alohida sahifasida, faqat o'z yozuvlari bilan ishlaydi. */
export default function NewsSection({
  category, title, lead, addLabel, galleryTitle, galleryHint, pickLabel,
}: {
  category: NewsCategory;
  title: string;
  lead: string;
  addLabel: string;
  galleryTitle: string;
  galleryHint: string;
  pickLabel: string;
}) {
  const isEvent = category === "event";
  const fields: FieldDef[] = [
    { name: "title", label: "Sarlavha", tr: true, required: true },
    { name: "summary", label: "Qisqa mazmun", tr: true },
    { name: "body", label: "Töliq matn", tr: true, type: "textarea" },
    { name: "cover", label: "Muqova rasmi", type: "image" },
    { name: "video", label: "Video (MP4 / WebM) — kartada va sahifada körinadi", type: "file", accept: "video/mp4,video/webm", help: "Rasm o‘rniga video chiqadi. Muqova rasmi video «afişasi» bölib qoladi." },
    { name: "link_type", label: "Havola turi", type: "select", options: [
      { value: "internal", label: "Içki sahifa (matn saytda oçiladi)" }, { value: "external", label: "Taşqi manba" },
    ] },
    { name: "external_url", label: "Taşqi havola", type: "url", showIf: (v) => v.link_type === "external", help: isEvent ? "Tadbir röyxatdan ötiş sahifasi" : "Taşqi manba havolasi" },
    { name: "source_name", label: "Manba nomi", showIf: (v) => v.link_type === "external" },
    { name: "published_at", label: "Çop etilgan vaqt", type: "datetime" },
    ...(isEvent
      ? ([
          { name: "event_starts_at", label: "Tadbir boşlanişi", type: "datetime" },
          { name: "event_location", label: "Tadbir joyi", tr: true },
        ] as FieldDef[])
      : []),
    { name: "is_published", label: "Çop etilsin", type: "bool" },
  ];

  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    api(`/news/?category=${category}`).then((d) => setList(listOf(d))).catch(() => {});
  }, [category]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
      </div>
      <ResourceManager
        endpoint="/news/"
        fields={fields}
        query={{ category }}
        fixed={{ category }}
        toggle={{ field: "is_published", on: "Yaşiriş", off: "Çop etiş" }}
        defaults={{ link_type: "internal", is_published: true }}
        addLabel={addLabel}
        row={(n) => ({
          title: n.title,
          sub: new Date(isEvent && n.event_starts_at ? n.event_starts_at : n.published_at).toLocaleDateString(),
          thumb: n.cover ? mediaUrl(n.cover) : null,
        })}
      />
      <MediaPanel
        icon="media" title={galleryTitle} hint={galleryHint} pickLabel={pickLabel}
        items={list.map((n) => ({ id: n.id, label: n.title || n.slug, sub: new Date(n.published_at).toLocaleDateString(), thumb: n.cover ? mediaUrl(n.cover) : null }))}
      >
        {(sel) => (
          <ResourceManager
            key={sel.id}
            endpoint="/news-media/"
            fields={MEDIA_FIELDS}
            query={{ news: sel.id }}
            fixed={{ news: sel.id }}
            defaults={{ kind: "image" }}
            reorder
            layout="grid"
            bulk={{ field: "file", label: "Köp rasm/video yuklaş" }}
            addLabel="+ Rasm / video qöşiş"
            row={(m) => ({
              title: m.caption || (m.kind === "video" ? "Video" : "Rasm"),
              sub: m.kind,
              thumb: m.kind === "image" && m.file ? mediaUrl(m.file) : null,
              video: m.kind === "video",
            })}
          />
        )}
      </MediaPanel>
    </>
  );
}
