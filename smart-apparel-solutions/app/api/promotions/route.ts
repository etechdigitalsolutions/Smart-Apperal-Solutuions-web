import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, data: [], message: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const upstream = await supabaseFetch("/web_public_promotions?select=*");
  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, data: [], message: "Unable to load promotions." },
      { status: upstream.status },
    );
  }

  const rows = (await upstream.json()) as Record<string, unknown>[];
  return NextResponse.json({
    success: true,
    data: rows.map((row) => ({
      id: String(row.promotion_id ?? row.id ?? row.title ?? "promotion"),
      name: String(row.title ?? row.promotion_name ?? row.name ?? "Promotion"),
      desktop:
        row.desktop_image_url ??
        row.banner_image_url ??
        row.image_url ??
        row.image_path ??
        "",
      mobile:
        row.mobile_image_url ??
        row.desktop_image_url ??
        row.banner_image_url ??
        row.image_url ??
        row.image_path ??
        "",
      alt: String(row.alt_text ?? row.title ?? row.promotion_name ?? "Promotion"),
      href: typeof row.link_url === "string" ? row.link_url : "",
    })),
  });
}
