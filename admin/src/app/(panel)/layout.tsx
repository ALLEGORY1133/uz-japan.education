"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Shell from "@/components/Shell";
import { useAuth } from "@/lib/auth";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <div className="center">Yuklanmoqda…</div>;
  return <Shell>{children}</Shell>;
}
