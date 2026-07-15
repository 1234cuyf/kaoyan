"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { FAVORITES_STORAGE_KEY, toggleFavorite, USER_STORAGE_KEY } from "@/lib/core";
import type { AccessFormData, UserProfile } from "@/lib/types";
import { AccessGate } from "./access-gate";

interface SessionContextValue {
  user: UserProfile;
  favorites: number[];
  logout: () => void;
  toggleFavorite: (id: number) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return ["name", "currentSchool", "targetSchool", "major", "examYear"].every((key) => typeof user[key] === "string" && String(user[key]).trim());
}

function readFavorites(): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? Array.from(new Set(value.filter((id): id is number => Number.isInteger(id)))) : [];
  } catch {
    return [];
  }
}

export function SessionGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ ready: boolean; user: UserProfile | null; favorites: number[] }>({
    ready: false,
    user: null,
    favorites: [],
  });

  useEffect(() => {
    let restoredUser: UserProfile | null = null;
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isUserProfile(parsed)) restoredUser = parsed;
        else localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      try { localStorage.removeItem(USER_STORAGE_KEY); } catch { /* browser storage unavailable */ }
    }
    const restoredFavorites = readFavorites();
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setSession({ ready: true, user: restoredUser, favorites: restoredFavorites });
    });
    return () => { cancelled = true; };
  }, []);

  function login(data: AccessFormData) {
    const { accessKey: _accessKey, ...profile } = data;
    void _accessKey;
    setSession((current) => ({ ...current, user: profile }));
    try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile)); } catch { /* keep in-memory session */ }
  }

  function logout() {
    setSession((current) => ({ ...current, user: null }));
    try { localStorage.removeItem(USER_STORAGE_KEY); } catch { /* browser storage unavailable */ }
  }

  function updateFavorite(id: number) {
    setSession((current) => {
      const next = toggleFavorite(current.favorites, id);
      try { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next)); } catch { /* keep in-memory favorites */ }
      return { ...current, favorites: next };
    });
  }

  const context = useMemo(() => session.user ? ({ user: session.user, favorites: session.favorites, logout, toggleFavorite: updateFavorite }) : null, [session.user, session.favorites]);

  if (!session.ready) {
    return <div className="hydration-screen" role="status"><span className="brand-mark">研</span><strong>正在读取你的备考空间…</strong></div>;
  }
  if (!session.user || !context) return <AccessGate onLogin={login} />;

  return <SessionContext.Provider value={context}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionGate");
  return value;
}
