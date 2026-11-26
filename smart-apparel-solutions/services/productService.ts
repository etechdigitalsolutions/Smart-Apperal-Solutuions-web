import { apiFetch } from "@/lib/api/client";
import type { Product, ApiResponse } from "@/types";

export const productService = {
  getAll: (params?: Record<string, string>) =>
    apiFetch<ApiResponse<Product[]> & { total: number }>(
      `/products${params ? `?${new URLSearchParams(params)}` : ""}`,
    ),

  getBySlug: (slug: string) =>
    apiFetch<ApiResponse<Product>>(`/products/${encodeURIComponent(slug)}`),

  create: (data: Record<string, unknown>) =>
    apiFetch<ApiResponse<unknown>>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
