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
import { authService } from "@/services/authService";

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
const authListeners = new Set<() => void>();
let authSnapshot: User | null = null;
let hydrationSnapshot = false;
const handleStorageChange = (event: StorageEvent) => {
  if (event.key === AUTH_KEY || event.key === null) {
    authSnapshot = readStoredUser();
    hydrationSnapshot = true;
    notifyAuthChange();
  }
};
const subscribe = (listener: () => void) => {
  const firstSubscriber = authListeners.size === 0;
  authListeners.add(listener);
  if (firstSubscriber) window.addEventListener("storage", handleStorageChange);
  return () => {
    authListeners.delete(listener);
    if (authListeners.size === 0) window.removeEventListener("storage", handleStorageChange);
  };
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
      const result = await authService.login({
        ...credentials,
        email: credentials.email.trim(),
      });
      if (!result.success) {
        throw new Error(result.message || "Those credentials did not match.");
      }
      const responseData = result.data;
      const raw = Array.isArray(responseData) ? responseData[0] : responseData;
      const responseRecord =
        raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const authenticated =
        responseRecord.user && typeof responseRecord.user === "object"
          ? responseRecord.user as Record<string, unknown>
          : responseRecord;
      const id = authenticated.user_id ?? authenticated.id;
      if (typeof id !== "string" && typeof id !== "number") {
        throw new Error("The authentication response did not include a user ID.");
      }
      const nextUser: User = {
        id: String(id),
        name: String(authenticated.full_name ?? authenticated.username ?? credentials.email.split("@")[0]),
        email: String(authenticated.email ?? credentials.email.trim().toLowerCase()),
        role: String(authenticated.role_name ?? "").toLowerCase() === "admin" ? "admin" : "customer",
        createdAt: String(authenticated.created_at ?? ""),
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
