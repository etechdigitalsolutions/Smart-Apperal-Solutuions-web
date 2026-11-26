import { apiFetch } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

export const authService = {
  login: (credentials: { email: string; password: string }) =>
    apiFetch<ApiResponse<unknown>>("/auth", {
      method: "POST",
      body: JSON.stringify({ action: "login", ...credentials }),
    }),

  register: (data: { name: string; email: string; password: string }) =>
    apiFetch<ApiResponse<unknown>>("/auth", {
      method: "POST",
      body: JSON.stringify({ action: "register", ...data }),
    }),
  verifyToken: (token: string) =>
    apiFetch<ApiResponse<unknown>>("/auth", {
      method: "POST",
      body: JSON.stringify({ action: "verify", token }),
    }),
  changePassword: (data: { userId: number; oldPassword: string; newPassword: string }) =>
    apiFetch<ApiResponse<unknown>>("/auth", {
      method: "POST",
      body: JSON.stringify({
        action: "change-password",
        userId: data.userId,
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      }),
    }),
};
