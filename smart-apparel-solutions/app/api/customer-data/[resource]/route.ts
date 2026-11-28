import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerSession,
  isSupabaseConfigured,
  supabaseFetch,
} from "@/lib/supabase-server";

const CUSTOMER_TABLES = new Set([
  "carts",
  "cart_items",
  "customer_wishlist_items",
  "customer_addresses",
  "website_customers",
  "customer_preferences",
]);
const MAX_BODY_SIZE = 16 * 1024;
type CustomerMethod = "GET" | "POST" | "PATCH" | "DELETE";

async function handleCustomerRequest(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
  method: CustomerMethod,
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, message: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { resource } = await context.params;
  if (!CUSTOMER_TABLES.has(resource)) {
    return NextResponse.json(
      { success: false, message: "Unsupported customer resource." },
      { status: 404 },
    );
  }

  const customer = await getCustomerSession();
  if (!customer) {
    return NextResponse.json(
      { success: false, message: "A verified customer session is required." },
      { status: 401 },
    );
  }

  if (
    method !== "GET" &&
    request.headers.get("origin") &&
    request.headers.get("origin") !== request.nextUrl.origin
  ) {
    return NextResponse.json(
      { success: false, message: "Cross-origin customer requests are not allowed." },
      { status: 403 },
    );
  }

  const params = new URLSearchParams(request.nextUrl.searchParams);
  const ownsCustomerId = resource !== "cart_items";
  if (ownsCustomerId) {
    params.set("website_customer_id", `eq.${customer.customerId}`);
  }

  let body: string | undefined;
  if (method === "POST" || method === "PATCH") {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { success: false, message: "Request body is too large." },
        { status: 413 },
      );
    }
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json(
          { success: false, message: "Invalid request body." },
          { status: 400 },
        );
      }
      const record = parsed as Record<string, unknown>;
      if (
        ownsCustomerId &&
        record.website_customer_id !== undefined &&
        String(record.website_customer_id) !== customer.customerId
      ) {
        return NextResponse.json(
          { success: false, message: "Customer ID does not match the signed-in account." },
          { status: 403 },
        );
      }
      if (ownsCustomerId) record.website_customer_id = customer.customerId;
      body = JSON.stringify(record);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 },
      );
    }
  }

  const headers = new Headers();
  if (method === "POST") {
    headers.set(
      "Prefer",
      params.has("on_conflict")
        ? "resolution=merge-duplicates,return=representation"
        : "return=representation",
    );
  }
  const upstream = await supabaseFetch(
    `/${resource}${params.toString() ? `?${params}` : ""}`,
    {
      method,
      body,
      headers,
    },
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  return handleCustomerRequest(request, context, "GET");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  return handleCustomerRequest(request, context, "POST");
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  return handleCustomerRequest(request, context, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  return handleCustomerRequest(request, context, "DELETE");
}
