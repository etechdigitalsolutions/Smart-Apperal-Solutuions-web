import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function safeFilterValue(value: string) {
  return value.replace(/[,*%()]/g, " ").trim();
}

function mapProduct(row: Record<string, unknown>) {
  const name = String(row.name ?? row.item_name ?? "Unnamed product");
  const price = Number(
    row.retail_price ?? row.live_price ?? row.price ?? row.selling_price ?? 0,
  );
  const stock = Number(
    row.current_stock ??
      row.available_stock ??
      row.stock_quantity ??
      row.stock ??
      row.actual_stock ??
      0,
  );
  const imageUrl = typeof row.image_url === "string" ? row.image_url : "";

  return {
    id: String(row.item_id ?? row.id ?? ""),
    name,
    slug: slugify(name),
    description: String(row.description ?? ""),
    price,
    comparePrice: Number(row.compare_price ?? row.comparePrice ?? price),
    images: imageUrl ? [imageUrl] : [],
    category: String(row.category_name ?? row.category ?? "Equipment"),
    condition: "brand_new" as const,
    tags: [],
    brand: String(row.brand_name ?? row.brand ?? "Smart Apparel"),
    modelCode: String(row.item_code ?? row.barcode ?? ""),
    badges: [],
    specs: {},
    stockStatus: stock > 0 ? ("in_stock" as const) : ("out_of_stock" as const),
    stock,
    sku: String(row.item_code ?? row.barcode ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, data: [], message: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const params = new URLSearchParams({ select: "*", limit: "200" });
  const search = safeFilterValue(
    request.nextUrl.searchParams.get("q") ?? "",
  );
  if (search) params.set("name", `ilike.*${search}*`);

  const categorySlug = request.nextUrl.searchParams.get("category");
  if (categorySlug) {
    const categoriesResponse = await supabaseFetch(
      "/web_categories?select=category_id,category_name",
    );
    if (!categoriesResponse.ok) {
      return NextResponse.json(
        { success: false, data: [], message: "Unable to load categories." },
        { status: categoriesResponse.status },
      );
    }

    const categories =
      (await categoriesResponse.json()) as Record<string, unknown>[];
    const category = categories.find(
      (row) =>
        slugify(String(row.category_name ?? row.name ?? "")) === categorySlug,
    );
    params.set(
      "category_id",
      `eq.${String(category?.category_id ?? category?.id ?? "-1")}`,
    );
  }

  const brand = safeFilterValue(
    request.nextUrl.searchParams.get("brand") ?? "",
  );
  if (brand) params.set("brand_name", `ilike.*${brand}*`);

  const upstream = await supabaseFetch(`/web_catalogue?${params}`);
  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, data: [], message: "Unable to load products." },
      { status: upstream.status },
    );
  }

  const rows = (await upstream.json()) as Record<string, unknown>[];
  const products = rows.map(mapProduct);
  return NextResponse.json({
    success: true,
    data: products,
    total: products.length,
  });
}
