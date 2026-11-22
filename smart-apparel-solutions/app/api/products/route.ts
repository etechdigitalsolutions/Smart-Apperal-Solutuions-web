import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, data: [], message: "SUPABASE_ANON_KEY is not configured." }, { status: 503 });
  }

  const q = request.nextUrl.searchParams.get("q");
  const category = request.nextUrl.searchParams.get("category");
  const brand = request.nextUrl.searchParams.get("brand");
  const params = new URLSearchParams({ select: "*", limit: "200", "status": "eq.Active" });
  if (q) params.set("name", `ilike.*${q}*`);

  if (category) {
    const categoriesResponse = await supabaseFetch("/categories?select=*&status=eq.Active");
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json() as Record<string, unknown>[];
      const matched = categories.find((row) => {
        const name = String(row.category_name ?? row.name ?? "");
        const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return slug === category;
      });
      if (matched) params.set("category_id", `eq.${String(matched.category_id ?? matched.id ?? "")}`);
    }
  }

  if (brand) {
    const brandsResponse = await supabaseFetch("/brands?select=*&status=eq.Active");
    if (brandsResponse.ok) {
      const brands = await brandsResponse.json() as Record<string, unknown>[];
      const matched = brands.find((row) =>
        String(row.brand_name ?? "").toLowerCase() === brand.toLowerCase()
      );
      if (matched) params.set("brand_id", `eq.${String(matched.brand_id ?? matched.id ?? "")}`);
    }
  }

  const upstream = await supabaseFetch(`/items?${params}`);
  if (!upstream.ok) return NextResponse.json({ success: false, data: [], message: "Unable to load products." }, { status: upstream.status });
  const rows = await upstream.json() as Record<string, unknown>[];
  const itemIds = rows.map((row) => String(row.item_id ?? row.id ?? "")).filter(Boolean);

  const [categoriesResponse, brandsResponse, subBrandsResponse, batchesResponse, stockResponse] =
    await Promise.all([
      supabaseFetch("/categories?select=category_id,category_name,description"),
      supabaseFetch("/brands?select=brand_id,brand_name"),
      supabaseFetch("/sub_brands?select=sub_brand_id,sub_brand_name,brand_id"),
      supabaseFetch(`/batches?select=item_id,retail_price,wholesale_price,current_qty,status&item_id=in.(${itemIds.join(",")})&limit=1000`),
      supabaseFetch("/vw_item_stock_summary?select=*"),
    ]);

  const categories = categoriesResponse.ok ? await categoriesResponse.json() as Record<string, unknown>[] : [];
  const brands = brandsResponse.ok ? await brandsResponse.json() as Record<string, unknown>[] : [];
  const subBrands = subBrandsResponse.ok ? await subBrandsResponse.json() as Record<string, unknown>[] : [];
  const batches = batchesResponse.ok ? await batchesResponse.json() as Record<string, unknown>[] : [];
  const stockRows = stockResponse.ok ? await stockResponse.json() as Record<string, unknown>[] : [];

  const categoryMap = new Map(categories.map((row) => [String(row.category_id), row]));
  const brandMap = new Map(brands.map((row) => [String(row.brand_id), row]));
  const subBrandMap = new Map(subBrands.map((row) => [String(row.sub_brand_id), row]));
  const batchMap = new Map<string, Record<string, unknown>>();
  batches.forEach((batch) => {
    const id = String(batch.item_id);
    const current = batchMap.get(id);
    if (!current || Number(batch.retail_price) < Number(current.retail_price)) batchMap.set(id, batch);
  });
  const stockMap = new Map(stockRows.map((row) => [String(row.item_id), row]));

  const products = rows
    .map((row) => {
      const name = String(row.name ?? row.item_name ?? "Unnamed product");
      const id = String(row.item_id ?? row.id ?? "");
      const category = categoryMap.get(String(row.category_id));
      const subBrand = subBrandMap.get(String(row.sub_brand_id));
      const brand = brandMap.get(String(subBrand?.brand_id ?? row.brand_id));
      const batch = batchMap.get(id);
      const stock = stockMap.get(id);
      const price = Number(batch?.retail_price ?? row.retail_price ?? row.selling_price ?? row.price ?? stock?.min_retail_price ?? 0);
      const stockQuantity = Number(row.current_stock ?? stock?.actual_stock ?? batch?.current_qty ?? 0);
      const imageUrl = typeof row.image_url === "string" ? row.image_url : "";
      return {
        id,
        name,
        slug: slugify(name),
        description: String(row.description ?? ""),
        price,
        comparePrice: price,
        images: imageUrl ? [imageUrl] : [],
        category: String(category?.category_name ?? row.category_name ?? "Equipment"),
        condition: "brand_new",
        tags: [],
        brand: String(brand?.brand_name ?? subBrand?.sub_brand_name ?? row.brand_name ?? "Smart Apparel"),
        modelCode: String(row.item_code ?? ""),
        badges: [],
        specs: {
          ...(row.unit ? { Unit: String(row.unit) } : {}),
          ...(row.warranty_period != null ? { Warranty: `${String(row.warranty_period)} months` } : {}),
        },
        stockStatus: stockQuantity > 0 ? "in_stock" : "out_of_stock",
        stock: stockQuantity,
        sku: String(row.item_code ?? row.barcode ?? ""),
        createdAt: String(row.created_at ?? ""),
      };
    });

  return NextResponse.json({ success: true, data: products, total: products.length });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, message: "SUPABASE_ANON_KEY is not configured." }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 }); }
  const upstream = await supabaseFetch("/items", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const data = await upstream.json().catch(() => null);
  return NextResponse.json({ success: upstream.ok, data }, { status: upstream.status });
}
