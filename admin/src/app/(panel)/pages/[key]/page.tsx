"use client";

import { useParams } from "next/navigation";
import PagesEditor from "@/components/PagesEditor";

export default function PageSectionsPage() {
  const { key } = useParams<{ key: string }>();
  return <PagesEditor only={key} />;
}
