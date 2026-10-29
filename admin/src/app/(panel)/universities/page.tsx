"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ResourceManager from "@/components/ResourceManager";
import { useAuth } from "@/lib/auth";
import { mediaUrl } from "@/lib/api";
import { UNIVERSITY_CREATE_FIELDS } from "./fields";

export default function UniversitiesPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isAdmin) router.replace(`/universities/${user.university}`);
  }, [user, isAdmin, router]);

  if (!isAdmin) return null;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Universitetlar</h1>
          <p>Yangi universitet qöşing. Batafsil ma’lumotlar (muddatlar, moliya, media) uçun universitetni tahrirlaş sahifasiga öting.</p>
        </div>
      </div>
      <ResourceManager
        endpoint="/universities/"
        fields={UNIVERSITY_CREATE_FIELDS}
        reorder
        toggle={{ field: "is_published", on: "Yaşiriş", off: "Çop etiş" }}
        addLabel="+ Universitet qöşiş"
        defaults={{ country: "jp", brand_color: "#14183F", is_published: true }}
        row={(u) => ({
          title: u.name || u.slug,
          sub: `${u.country === "jp" ? "Yaponiya" : "Özbekiston"} · ${u.slug}`,
          thumb: u.logo ? mediaUrl(u.logo) : null,
          badge: (
            <a className="btn outline sm" href={`/universities/${u.id}`}>Tahrirlaş →</a>
          ),
        })}
      />
    </>
  );
}
