import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, categories: [], message: "SUPABASE_ANON_KEY is not configured." }, { status: 503 });
  }
  const upstream = await supabaseFetch("/categories?select=*&status=eq.Active&order=category_name.asc");
  if (!upstream.ok) {
    return NextResponse.json({ success: false, categories: [], message: "Unable to load categories." }, { status: upstream.status });
  }
  const rows = await upstream.json() as Record<string, unknown>[];
  const categories = rows.map((row) => {
    const name = String(row.category_name ?? row.name ?? "Category");
    return {
      id: String(row.category_id ?? row.id ?? ""),
      name,
      slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: String(row.description ?? ""),
      children: [],
    };
  });
  return NextResponse.json({ success: true, categories });
}
