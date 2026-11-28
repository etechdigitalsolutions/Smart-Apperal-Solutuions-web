"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { authService, toAuthUser } from "@/services/authService";

type LoginCredentials = { email: string; password: string };
type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    authService
      .getSession()
      .then((result) => {
        if (active && result.success && result.data) {
          setUser(toAuthUser(result.data));
        }
      })
      .catch((error: unknown) => {
        console.error(
          error instanceof Error ? error.message : "Unable to load session.",
        );
      })
      .finally(() => {
        if (active) setIsHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login({
        ...credentials,
        email: credentials.email.trim(),
      });
      if (!result.success || !result.data) {
        throw new Error(result.message || "Those credentials did not match.");
      }
      const authenticatedUser = toAuthUser(result.data);
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const result = await authService.logout();
    if (!result.success) {
      throw new Error(result.message || "Unable to sign out.");
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isHydrated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
