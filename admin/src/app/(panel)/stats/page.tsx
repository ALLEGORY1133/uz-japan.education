"use client";

import ResourceManager from "@/components/ResourceManager";
import { FieldDef } from "@/components/Form";

const FIELDS: FieldDef[] = [
  { name: "label", label: "Nomi", tr: true, required: true },
  { name: "value", label: "Qiymat", type: "number", required: true },
  { name: "suffix", label: "Qöşimça belgi", help: "Masalan: +" },
  { name: "is_visible", label: "Saytda körsatilsin", type: "bool" },
];

export default function StatsPage() {
  return (
    <>
      <div className="page-head">
        <div><h1>Statistika</h1><p>Boş sahifadagi raqamlar bloki.</p></div>
      </div>
      <ResourceManager
        endpoint="/stats/"
        fields={FIELDS}
        reorder
        toggle={{ field: "is_visible", on: "Yaşiriş", off: "Körsatiş" }}
        defaults={{ suffix: "+", is_visible: true }}
        addLabel="+ Körsatkiç qöşiş"
        row={(s) => ({ title: `${s.value}${s.suffix}`, sub: s.label })}
      />
    </>
  );
}
