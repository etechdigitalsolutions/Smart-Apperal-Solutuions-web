"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";

type LoginCredentials = { email: string; password: string };
type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_KEY = "smart-apparel-auth";
const DEMO_PASSWORD = "SmartApparel123!";
const authListeners = new Set<() => void>();
let authSnapshot: User | null = null;
let hydrationSnapshot = false;
const subscribe = (listener: () => void) => {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
};
const notifyAuthChange = () => authListeners.forEach((listener) => listener());
const getUserSnapshot = () => authSnapshot;
const getHydrationSnapshot = () => hydrationSnapshot;
const getServerUserSnapshot = () => null;
const getServerHydrationSnapshot = () => false;

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && "email" in parsed
      ? (parsed as User)
      : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(
    subscribe,
    getUserSnapshot,
    getServerUserSnapshot
  );
  const isHydrated = useSyncExternalStore(
    subscribe,
    getHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    authSnapshot = readStoredUser();
    hydrationSnapshot = true;
    notifyAuthChange();
  }, []);

  const login = async (credentials: LoginCredentials, rememberMe = true) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: credentials.email.trim(),
          password: credentials.password,
        }),
      });
      const result = await response.json().catch(() => null) as
        | { success?: boolean; data?: unknown; message?: string }
        | null;
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Those credentials did not match.");
      }

      const raw = Array.isArray(result.data) ? result.data[0] : result.data;
      const authenticated = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const nextUser: User = {
        id: String(authenticated.user_id ?? authenticated.id ?? "smartstock-user"),
        name: String(authenticated.full_name ?? authenticated.username ?? credentials.email.split("@")[0]),
        email: String(authenticated.email ?? credentials.email.trim().toLowerCase()),
        role: authenticated.role_name === "admin" ? "admin" : "customer",
        createdAt: String(authenticated.created_at ?? new Date().toISOString()),
      };
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(AUTH_KEY, JSON.stringify(nextUser));
      if (rememberMe) sessionStorage.removeItem(AUTH_KEY);
      authSnapshot = nextUser;
      notifyAuthChange();
      return nextUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    authSnapshot = null;
    notifyAuthChange();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isHydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export { DEMO_PASSWORD };
