"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getTokens, login as apiLogin, setTokens } from "./api";

export type Me = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "platform_admin" | "university_rep";
  university: number | null;
  university_name: string | null;
  last_login?: string | null;
  date_joined?: string;
};

type Ctx = {
  user: Me | null;
  loading: boolean;
  isAdmin: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
};

const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setTokens(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let alive = true;
    if (!getTokens()) {
      setLoading(false);
      return;
    }
    api<Me>("/me/")
      .then((me) => alive && setUser(me))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      router.replace("/login");
    };
    window.addEventListener("uzj-logout", onLogout);
    return () => window.removeEventListener("uzj-logout", onLogout);
  }, [router]);

  const login = useCallback(async (username: string, password: string) => {
    const me = await apiLogin(username, password);
    setUser(me);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, isAdmin: user?.role === "platform_admin", login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
