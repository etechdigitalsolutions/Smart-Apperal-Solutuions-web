import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerSession,
  isSupabaseConfigured,
  supabaseFetch,
} from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, message: "Supabase is not configured." },
      { status: 503 },
    );
  }
  const customer = await getCustomerSession();
  if (!customer) {
    return NextResponse.json(
      { success: false, message: "A verified customer session is required." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid order ID." },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    website_order_id: `eq.${id}`,
    order: "created_at.desc",
  });
  const upstream = await supabaseFetch(
    `/order_status_history?${params}`,
    {},
    customer.accessToken,
  );
  const text = await upstream.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return NextResponse.json(
    { success: upstream.ok, data },
    { status: upstream.status },
  );
}
