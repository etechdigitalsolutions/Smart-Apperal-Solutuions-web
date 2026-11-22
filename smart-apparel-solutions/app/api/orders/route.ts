
import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_SIZE = 16 * 1024; // 16 KB

export async function GET() {
  return NextResponse.json(
    { message: "Order listing is not implemented yet." },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { message: "Content-Type must be application/json." },
      { status: 415 }
    );
  }

  const contentLength = Number(request.headers.get("content-length"));

  if (
    request.headers.has("content-length") &&
    (!Number.isSafeInteger(contentLength) || contentLength < 0)
  ) {
    return NextResponse.json(
      { message: "Invalid Content-Length." },
      { status: 400 }
    );
  }

  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json(
      { message: "Request body is too large." },
      { status: 413 }
    );
  }

  let body: unknown;

  try {
    const rawBody = await request.text();

    // Check the actual body size too; Content-Length can be absent.
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { message: "Request body is too large." },
        { status: 413 }
      );
    }

    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const data = body as Record<string, unknown>;

  // Honeypot: legitimate submissions should leave this field empty.
  if (
    typeof data.website !== "string" ||
    data.website.trim() !== ""
  ) {
    return NextResponse.json(
      { message: "Invalid submission." },
      { status: 400 }
    );
  }

  try {
    const { isSupabaseConfigured, supabaseFetch } = await import("@/lib/supabase-server");
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, message: "SUPABASE_ANON_KEY is not configured." }, { status: 503 });
    }

    const items = Array.isArray((body as Record<string, unknown>).items)
      ? (body as Record<string, unknown>).items as Array<Record<string, unknown>>
      : [];
    if (!items.length) {
      return NextResponse.json({ success: false, message: "At least one item is required." }, { status: 400 });
    }

    const itemIds = items.map((item) => String(item.productId ?? item.item_id ?? "")).filter(Boolean);
    const itemParams = new URLSearchParams({
      select: "*",
      item_id: `in.(${itemIds.join(",")})`,
    });
    const productsResponse = await supabaseFetch(`/items?${itemParams}`);
    if (!productsResponse.ok) {
      return NextResponse.json({ success: false, message: "Unable to verify product prices." }, { status: 502 });
    }
    const products = await productsResponse.json() as Record<string, unknown>[];
    const productMap = new Map(products.map((product) => [String(product.item_id ?? product.id), product]));

    let subtotal = 0;
    const verifiedItems = items.map((item) => {
      const productId = String(item.productId ?? item.item_id ?? "");
      const quantity = Number(item.quantity ?? 0);
      const product = productMap.get(productId);
      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error("INVALID_ITEM");
      }
      const unitPrice = Number(product.retail_price ?? product.selling_price ?? product.price ?? 0);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error("INVALID_PRICE");
      }
      subtotal += unitPrice * quantity;
      return { productId, quantity, unitPrice, total: unitPrice * quantity };
    });

    const invoiceNumber = `SAS-${Date.now()}`;
    const total = Math.max(0, subtotal);
    const invoicePayload = {
      invoice_number: invoiceNumber,
      subtotal,
      discount: 0,
      tax: 0,
      total,
      paid_amount: 0,
      balance: total,
      payment_status: "Pending",
      invoice_date: new Date().toISOString(),
      notes: typeof (body as Record<string, unknown>).notes === "string"
        ? String((body as Record<string, unknown>).notes)
        : "",
      status: "Active",
      created_by: typeof (body as Record<string, unknown>).email === "string"
        ? String((body as Record<string, unknown>).email)
        : "guest",
      is_manual: false,
    };

    const invoiceResponse = await supabaseFetch("/invoices", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(invoicePayload),
    });
    if (!invoiceResponse.ok) {
      const detail = await invoiceResponse.text();
      return NextResponse.json({ success: false, message: "Unable to create invoice.", detail }, { status: invoiceResponse.status });
    }
    const invoices = await invoiceResponse.json() as Record<string, unknown>[];
    const invoice = invoices[0];
    if (!invoice) {
      return NextResponse.json({ success: false, message: "Invoice response did not include a record." }, { status: 502 });
    }
    const invoiceId = Number(invoice.invoice_id ?? invoice.id);

    for (const item of verifiedItems) {
      const itemResponse = await supabaseFetch("/invoice_items", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          invoice_id: invoiceId,
          item_id: Number(item.productId),
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount: 0,
          tax: 0,
          total: item.total,
        }),
      });
      if (!itemResponse.ok) {
        return NextResponse.json({ success: false, message: "Invoice created but an invoice item failed.", reference: invoiceNumber }, { status: 502 });
      }
    }

    return NextResponse.json({
      success: true,
      reference: invoiceNumber,
      subtotal,
      total,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ITEM") {
      return NextResponse.json({ success: false, message: "One or more cart items are invalid." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "INVALID_PRICE") {
      return NextResponse.json({ success: false, message: "One or more product prices are invalid." }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Unable to process the order." }, { status: 500 });
  }
}
