import { apiFetch } from "@/lib/api/client";
import type { ApiResponse, User } from "@/types";

interface AuthUser {
  id?: string;
  user_id?: string | number;
  website_customer_id?: string | number;
  name?: string;
  full_name?: string;
  email?: string;
  user?: AuthUser;
}

export const authService = {
  getSession: () =>
    apiFetch<ApiResponse<AuthUser | null>>("/auth", { cache: "no-store" }),

  login: (credentials: { email: string; password: string }) =>
    apiFetch<ApiResponse<AuthUser>>("/auth", {
      method: "POST",
      body: JSON.stringify({ action: "login", ...credentials }),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) =>
    apiFetch<ApiResponse<unknown>>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone ?? "",
      }),
    }),

  resetPasswordForEmail: (email: string) =>
    apiFetch<ApiResponse<unknown>>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  updatePassword: (password: string) =>
    apiFetch<ApiResponse<unknown>>("/auth", {
      method: "POST",
      body: JSON.stringify({ action: "update-password", password }),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch<ApiResponse<unknown>>("/auth", {
      method: "POST",
      body: JSON.stringify({ action: "change-password", ...data }),
    }),

  logout: () =>
    apiFetch<ApiResponse<unknown>>("/auth", { method: "DELETE" }),
};

function unwrapAuthRecord(value: AuthUser | AuthUser[]): AuthUser {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw?.user && typeof raw.user === "object") return raw.user;
  return raw ?? {};
}

export function toAuthUser(value: AuthUser): User {
  const record = unwrapAuthRecord(value);
  const id = record.user_id ?? record.id ?? record.website_customer_id;
  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("The authentication response did not include a user ID.");
  }
  return {
    id: String(id),
    name: String(record.full_name ?? record.name ?? record.email ?? ""),
    email: String(record.email ?? ""),
    role: "customer",
    createdAt: "",
  };
}
