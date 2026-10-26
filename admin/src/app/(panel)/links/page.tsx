"use client";

import ResourceManager from "@/components/ResourceManager";
import { LINK_FIELDS } from "../universities/fields";

export default function LinksPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Foydali havolalar</h1>
          <p>Umumiy havolalar (stipendiya, til sinovi, viza). Boş sahifada körinadi. Universitetga xos havolalar universitet sahifasidan qöşiladi.</p>
        </div>
      </div>
      <ResourceManager
        endpoint="/useful-links/"
        fields={LINK_FIELDS}
        clientFilter={(l) => l.university === null || l.university === undefined}
        reorder
        toggle={{ field: "is_visible", on: "Yaşiriş", off: "Körsatiş" }}
        defaults={{ icon: "other", is_external: true, is_visible: true }}
        addLabel="+ Havola qöşiş"
        row={(l) => ({ title: l.title, sub: l.url })}
      />
    </>
  );
}
