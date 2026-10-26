"use client";

import ResourceManager from "@/components/ResourceManager";
import { FieldDef } from "@/components/Form";
import { mediaUrl } from "@/lib/api";

const NAMES: Record<string, string> = {
  students_card: "Talabalar kartasi", collab_card: "Hamkorlik kartasi", online_video: "Onlayn hamkorlik videosi",
};

const FIELDS: FieldDef[] = [
  { name: "key", label: "Joyi", type: "select", options: Object.entries(NAMES).map(([value, label]) => ({ value, label })), help: "Har bir joy uçun bitta yozuv bölişi mumkin." },
  { name: "kind", label: "Turi", type: "select", options: [{ value: "image", label: "Rasm" }, { value: "video", label: "Video" }] },
  { name: "image", label: "Rasm", type: "image", showIf: (v) => v.kind === "image" },
  { name: "video", label: "Video fayli", type: "file", accept: "video/*", showIf: (v) => v.kind === "video" },
  { name: "video_url", label: "yoki YouTube/Vimeo havolasi", type: "url", showIf: (v) => v.kind === "video" },
  { name: "caption", label: "Izoh", tr: true },
];

export default function SiteMediaPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Sayt rasm va videolari</h1>
          <p>Boş sahifadagi kartalar uçun rasm yoki videoni şu yerdan almaştiring, qöşing yoki öçiring.</p>
        </div>
      </div>
      <ResourceManager
        endpoint="/site-media/"
        fields={FIELDS}
        defaults={{ kind: "image", key: "students_card" }}
        addLabel="+ Rasm / video qöşiş"
        row={(m) => ({
          title: NAMES[m.key] || m.key,
          sub: m.caption,
          thumb: m.kind === "image" && m.image ? mediaUrl(m.image) : null,
          video: m.kind === "video",
        })}
      />
    </>
  );
}
