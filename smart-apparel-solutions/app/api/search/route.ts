import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, results: [], message: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "")
    .replace(/[,*%()]/g, " ")
    .trim();
  if (!query) return NextResponse.json({ success: true, results: [] });

  const params = new URLSearchParams({
    select: "*",
    limit: "50",
    name: `ilike.*${query}*`,
  });
  const upstream = await supabaseFetch(`/web_catalogue?${params}`);
  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, results: [], message: "Search unavailable." },
      { status: upstream.status },
    );
  }

  const rows = (await upstream.json()) as Record<string, unknown>[];
  return NextResponse.json({
    success: true,
    results: rows.map((row) => ({
      id: String(row.item_id ?? row.id ?? ""),
      name: String(row.name ?? row.item_name ?? ""),
      itemCode: String(row.item_code ?? row.barcode ?? ""),
      price: Number(
        row.retail_price ?? row.live_price ?? row.price ?? row.selling_price ?? 0,
      ),
    })),
  });
}
