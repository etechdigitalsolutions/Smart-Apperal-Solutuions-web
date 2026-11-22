import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, results: [], message: "SUPABASE_ANON_KEY is not configured." }, { status: 503 });
  }
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ success: true, results: [] });
  const params = new URLSearchParams({
    select: "*",
    limit: "50",
    "name": `ilike.*${q}*`,
  });
  const upstream = await supabaseFetch(`/items?${params}`);
  if (!upstream.ok) return NextResponse.json({ success: false, results: [], message: "Search unavailable." }, { status: upstream.status });
  const rows = await upstream.json() as Record<string, unknown>[];
  return NextResponse.json({
    success: true,
    results: rows.map((row) => ({
      id: String(row.item_id ?? row.id ?? ""),
      name: String(row.name ?? row.item_name ?? ""),
      itemCode: String(row.item_code ?? row.barcode ?? ""),
      price: Number(row.retail_price ?? row.selling_price ?? row.price ?? 0),
    })),
  });
}
