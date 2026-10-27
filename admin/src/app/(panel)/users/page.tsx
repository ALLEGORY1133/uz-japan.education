"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ResourceManager from "@/components/ResourceManager";
import { FieldDef } from "@/components/Form";
import { useAuth } from "@/lib/auth";

const FIELDS: FieldDef[] = [
  { name: "username", label: "Login", required: true },
  { name: "first_name", label: "Ism" },
  { name: "last_name", label: "Familiya" },
  { name: "email", label: "Email", type: "email" },
  { name: "role_key", label: "Rol", type: "select", remote: { endpoint: "/roles/options/", label: "name", empty: "— rolni tanlang —" }, required: true },
  { name: "university", label: "Universitet", type: "select", remote: { endpoint: "/universities/", label: "name", empty: "— (vakil uçun majburiy)" }, showIf: (v) => v.role_key === "university_rep" },
  { name: "password", label: "Parol", type: "password", help: "Kamida 8 belgi. Tahrirda böş qoldirsangiz özgarmaydi." },
  { name: "is_active", label: "Faol", type: "bool" },
];

export default function UsersPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !isAdmin) router.replace("/"); }, [loading, isAdmin, router]);
  if (!isAdmin) return null;
  return (
    <>
      <div className="page-head">
        <div><h1>Foydalanuvçilar</h1><p>Universitet vakillari faqat öz universitetining ma’lumotlarini tahrirlaydi.</p></div>
      </div>
      <ResourceManager
        endpoint="/users/"
        fields={FIELDS}
        defaults={{ role_key: "university_rep", is_active: true }}
        addLabel="+ Foydalanuvçi qöşiş"
        row={(u) => ({ title: u.username, sub: `${u.role === "platform_admin" ? "Administrator" : u.role === "content_manager" ? "Kontent menejeri" : u.role === "custom" ? (u.custom_role_name || "Maxsus rol") : "Vakil"} · ${u.email || ""}`, badge: u.is_active ? undefined : <span className="badge">Nofaol</span> })}
      />
    </>
  );
}
