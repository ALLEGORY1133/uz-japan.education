"use client";

import { useEffect, useState } from "react";
import { api, listOf } from "@/lib/api";
import ResourceManager from "@/components/ResourceManager";
import MediaPanel from "@/components/MediaPanel";
import { FieldDef } from "@/components/Form";
import { mediaUrl } from "@/lib/api";

const FIELDS: FieldDef[] = [
  { name: "title", label: "Sarlavha", tr: true, required: true },
  { name: "summary", label: "Qisqa mazmun", tr: true },
  { name: "body", label: "Töliq matn", tr: true, type: "textarea" },
  { name: "category", label: "Turkum", type: "select", options: [
    { value: "news", label: "Yangilik" }, { value: "cooperation", label: "Hamkorlik" }, { value: "event", label: "Tadbir" }, { value: "platform", label: "Sayt yangiliklari" },
  ] },
  { name: "cover", label: "Muqova rasmi", type: "image" },
  { name: "video", label: "Video (MP4 / WebM) — kartada va sahifada körinadi", type: "file", accept: "video/mp4,video/webm", help: "Rasm o‘rniga video chiqadi. Muqova rasmi video «afişasi» bölib qoladi." },
  { name: "link_type", label: "Havola turi", type: "select", options: [
    { value: "internal", label: "Içki sahifa (matn saytda oçiladi)" }, { value: "external", label: "Taşqi manba" },
  ] },
  { name: "external_url", label: "Taşqi havola", type: "url", showIf: (v) => v.link_type === "external", help: "Yangilik yoki tadbir röyxatdan ötiş sahifasi" },
  { name: "source_name", label: "Manba nomi", showIf: (v) => v.link_type === "external" },
  { name: "published_at", label: "Çop etilgan vaqt", type: "datetime" },
  { name: "event_starts_at", label: "Tadbir boşlanişi", type: "datetime", showIf: (v) => v.category === "event" },
  { name: "event_location", label: "Tadbir joyi", tr: true, showIf: (v) => v.category === "event" },
  { name: "is_published", label: "Çop etilsin", type: "bool" },
];

const MEDIA_FIELDS: FieldDef[] = [
  { name: "kind", label: "Turi", type: "select", options: [{ value: "image", label: "Rasm" }, { value: "video", label: "Video" }] },
  { name: "file", label: "Fayl (rasm yoki video)", type: "file" },
  { name: "video_url", label: "Video havolasi (YouTube/Vimeo)", type: "url", showIf: (v) => v.kind === "video" },
  { name: "caption", label: "Izoh" },
];

function NewsGallery() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    api("/news/").then((d) => setList(listOf(d))).catch(() => {});
  }, []);
  return (
    <MediaPanel
      icon="media" title="Yangilik galereyasi"
      hint="Yangilikni tanlang va unga bir neçta rasm yoki video qöşing — ular yangilik sahifasida galereya bölib çiqadi."
      pickLabel="Yangilikni tanlang"
      items={list.map((n) => ({ id: n.id, label: n.title || n.slug, sub: n.category, thumb: n.cover ? mediaUrl(n.cover) : null }))}
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
  );
}

export default function NewsPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Yangilik va tadbirlar</h1>
          <p>Har bir yangilikka içki matn yoki taşqi manba havolasini biriktirişingiz mumkin.</p>
        </div>
      </div>
      <ResourceManager
        endpoint="/news/"
        fields={FIELDS}
        toggle={{ field: "is_published", on: "Yaşiriş", off: "Çop etiş" }}
        defaults={{ category: "news", link_type: "internal", is_published: true }}
        addLabel="+ Yangilik qöşiş"
        row={(n) => ({
          title: n.title,
          sub: `${n.category} · ${new Date(n.published_at).toLocaleDateString()}`,
          thumb: n.cover ? mediaUrl(n.cover) : null,
        })}
      />
      <NewsGallery />
    </>
  );
}
