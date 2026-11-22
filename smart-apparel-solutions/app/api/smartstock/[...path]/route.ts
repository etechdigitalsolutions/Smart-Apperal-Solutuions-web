import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

const ALLOWED_PREFIXES = [
  "/items", "/item_master", "/categories", "/brands", "/sub_brands",
  "/item_types", "/services", "/batches", "/vw_item_stock_summary",
  "/customers", "/invoices", "/invoice_items", "/payments",
  "/notifications", "/shop_settings", "/rpc/",
];

function rejectUnsafePath(path: string) {
  return !ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}?`) || path.startsWith(prefix));
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, message: "Backend API key is not configured." },
      { status: 503 },
    );
  }

  const { path: segments } = await context.params;
  const encodedPath = segments.map((segment) => encodeURIComponent(segment)).join("/");
  const path = `/${encodedPath}${request.nextUrl.search}`;

  if (rejectUnsafePath(path)) {
    return NextResponse.json({ success: false, message: "Unsupported SmartStock API path." }, { status: 403 });
  }

  const body = ["POST", "PUT", "PATCH"].includes(request.method)
    ? await request.text()
    : undefined;

  const upstream = await supabaseFetch(path, {
    method: request.method,
    body,
  });

  const text = await upstream.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : null; } catch {}

  return NextResponse.json(
    { success: upstream.ok, data },
    { status: upstream.status },
  );
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) { return proxy(request, context); }
