import type { Category, Product } from "@/types";

export async function fetchProducts(query = ""): Promise<Product[]> {
  const response = await fetch(`/api/products${query}`, { cache: "no-store" });
  if (!response.ok) return [];
  const result = await response.json() as { success?: boolean; data?: Product[] };
  return result.success ? result.data ?? [] : [];
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/categories", { cache: "no-store" });
  if (!response.ok) return [];
  const result = await response.json() as { success?: boolean; categories?: Category[] };
  return result.success ? result.categories ?? [] : [];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const response = await fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!response.ok) return null;
  const result = await response.json() as { success?: boolean; data?: Product };
  return result.success ? result.data ?? null : null;
}
