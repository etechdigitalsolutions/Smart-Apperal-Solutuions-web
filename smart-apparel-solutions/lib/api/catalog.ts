import { apiFetch } from "@/lib/api/client";
import type { ApiResponse, Category, Product } from "@/types";

export async function fetchProducts(query = ""): Promise<Product[]> {
  const result = await apiFetch<ApiResponse<Product[]> & { total: number }>(
    `/products${query}`,
    { cache: "no-store" },
  );
  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(result.message || "Unable to load products.");
  }
  return result.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const result = await apiFetch<{ success: boolean; categories: Category[]; message?: string }>(
    "/categories",
    { cache: "no-store" },
  );
  if (!result.success || !Array.isArray(result.categories)) {
    throw new Error(result.message || "Unable to load categories.");
  }
  return result.categories;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const result = await apiFetch<ApiResponse<Product>>(
    `/products/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (!result.success) {
    throw new Error(result.message || "Unable to load product details.");
  }
  return result.data ?? null;
}
