import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, categories: [], message: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const upstream = await supabaseFetch(
    "/web_categories?select=*&order=category_name.asc",
  );
  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, categories: [], message: "Unable to load categories." },
      { status: upstream.status },
    );
  }

  const rows = (await upstream.json()) as Record<string, unknown>[];
  const categories = rows.map((row) => {
    const name = String(row.category_name ?? row.name ?? "Category");
    const image =
      typeof row.image_url === "string"
        ? row.image_url
        : typeof row.banner_url === "string"
          ? row.banner_url
          : undefined;
    return {
      id: String(row.category_id ?? row.id ?? ""),
      name,
      slug: slugify(name),
      description: String(row.description ?? ""),
      ...(image ? { image } : {}),
      children: [],
    };
  });
  return NextResponse.json({ success: true, categories });
}
