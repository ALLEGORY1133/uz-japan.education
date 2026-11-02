"use client";

import { useParams } from "next/navigation";
import ResourceManager from "@/components/ResourceManager";
import { FieldDef } from "@/components/Form";
import { mediaUrl } from "@/lib/api";

const KINDS: Record<string, { value: string; title: string; lead: string; add: string; yearHelp: string }> = {
  achievements: {
    value: "achievement",
    title: "Yutuqlarimiz katalogi",
    lead: "«Biz haqimizda» sahifasidagi katalog va bosh sahifadagi «Yutuqlarimiz» bloki shu yerdan to‘ldiriladi: rasm yoki video, sarlavha, qisqa matn va batafsil.",
    add: "+ Yutuq qöşiş",
    yearHelp: "Yutuq erişilgan yil",
  },
  history: {
    value: "history",
    title: "Sayt va loyiha tarixi",
    lead: "«Biz haqimizda» sahifasidagi tarix taymlayni: yil bölyiça lavhalar, rasm yoki video bilan.",
    add: "+ Tarix lavhasini qöşiş",
    yearHelp: "Voqea yili (taymlayn shu bölyiça tartiblanadi)",
  },
  analysis: {
    value: "analysis",
    title: "Tahlillar",
    lead: "«Biz haqimizda» sahifasidagi tahlillar: qisqa xulosa va töliq matn, rasm yoki video bilan.",
    add: "+ Tahlil qöşiş",
    yearHelp: "Tahlil yili (ixtiyoriy)",
  },
};

export default function AboutItemsPage() {
  const { kind } = useParams<{ kind: string }>();
  const k = KINDS[kind];
  if (!k) return <div className="card"><p className="muted">Bunday bölim topilmadi.</p></div>;
  const fields: FieldDef[] = [
    { name: "title", label: "Sarlavha", tr: true, required: true },
    { name: "summary", label: "Qisqa matn", tr: true, help: "Kartada körinadi" },
    { name: "body", label: "Batafsil matn", tr: true, type: "textarea", help: "«Batafsil» tugmasi bosilganda ochiladi (ixtiyoriy)" },
    { name: "year", label: "Yil", type: "number", help: k.yearHelp },
    { name: "image", label: "Rasm", type: "image" },
    { name: "video", label: "Video (MP4 / WebM)", type: "file", accept: "video/mp4,video/webm", help: "Yuklansa, rasm o‘rniga video aylanadi; rasm afişa bölib qoladi." },
    { name: "is_visible", label: "Saytda körsatilsin", type: "bool" },
  ];
  return (
    <>
      <div className="page-head">
        <div><h1>{k.title}</h1><p>{k.lead}</p></div>
      </div>
      <ResourceManager
        key={kind}
        endpoint="/about-items/"
        fields={fields}
        query={{ kind: k.value }}
        fixed={{ kind: k.value }}
        defaults={{ is_visible: true }}
        reorder
        toggle={{ field: "is_visible", on: "Yaşiriş", off: "Körsatiş" }}
        addLabel={k.add}
        emptyText="Hozirça yozuv yöq. Yuqoridagi tugma orqali qöşing."
        row={(a) => ({ title: a.title || "—", sub: [a.year, a.summary].filter(Boolean).join(" · "), thumb: a.image ? mediaUrl(a.image) : null })}
      />
    </>
  );
}
