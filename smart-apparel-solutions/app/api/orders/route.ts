import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerSession,
  isSupabaseConfigured,
  supabaseFetch,
} from "@/lib/supabase-server";

const MAX_BODY_SIZE = 16 * 1024;

interface SubmittedItem {
  item_id: number;
  quantity: number;
}

interface SubmittedOrder {
  items: SubmittedItem[];
  idempotencyKey: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
    state?: string;
  };
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: string;
  couponCode: string | null;
  notes: string;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isRejectedResult(value: unknown): boolean {
  if (value === false) return true;
  if (Array.isArray(value)) return value.some(isRejectedResult);
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (
    result.success === false ||
    result.valid === false ||
    result.is_valid === false ||
    result.available === false
  );
}

function recordFrom(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return recordFrom(value[0]);
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export async function GET() {
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

  const upstream = await supabaseFetch(
    "/website_orders?select=*,website_order_items(*)&order=created_at.desc",
    {},
    customer.accessToken,
  );
  const data = await readJson(upstream);
  return NextResponse.json(
    { success: upstream.ok, data },
    { status: upstream.status },
  );
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, message: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const customer = await getCustomerSession();
  if (!customer) {
    return NextResponse.json(
      { success: false, message: "Sign in with a verified customer account to place an order." },
      { status: 401 },
    );
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_SIZE) {
    return NextResponse.json(
      { success: false, message: "Request body is too large." },
      { status: 413 },
    );
  }

  let submitted: SubmittedOrder;
  try {
    const body: unknown = JSON.parse(rawBody);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid request body.");
    }
    const input = body as Record<string, unknown>;
    const rawItems = input.items;
    const address = input.shippingAddress;
    if (!Array.isArray(rawItems) || !rawItems.length) {
      throw new Error("At least one cart item is required.");
    }
    if (!address || typeof address !== "object" || Array.isArray(address)) {
      throw new Error("A shipping address is required.");
    }
    const addressInput = address as Record<string, unknown>;
    const items = rawItems.map((item): SubmittedItem => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error("Invalid cart item.");
      }
      const record = item as Record<string, unknown>;
      const itemId = Number(record.itemId ?? record.item_id ?? record.productId);
      const quantity = Number(record.quantity);
      if (
        !Number.isSafeInteger(itemId) ||
        itemId < 1 ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        throw new Error("Cart item IDs and quantities must be positive integers.");
      }
      return { item_id: itemId, quantity };
    });

    const deliveryMethod =
      input.deliveryMethod === "pickup" ? "pickup" : input.deliveryMethod;
    if (deliveryMethod !== "delivery" && deliveryMethod !== "pickup") {
      throw new Error("A valid delivery method is required.");
    }
    const paymentMethod =
      typeof input.paymentMethod === "string" ? input.paymentMethod.trim() : "";
    const idempotencyKey =
      typeof input.idempotencyKey === "string" ? input.idempotencyKey : "";
    if (!paymentMethod || paymentMethod.length > 50) {
      throw new Error("A valid payment method is required.");
    }
    if (!idempotencyKey || idempotencyKey.length > 128) {
      throw new Error("A valid order idempotency key is required.");
    }
    const fullName =
      typeof addressInput.fullName === "string" ? addressInput.fullName.trim() : "";
    const phone =
      typeof addressInput.phone === "string" ? addressInput.phone.trim() : "";
    if (!fullName || !phone) {
      throw new Error("A name and phone number are required.");
    }

    submitted = {
      items,
      idempotencyKey,
      shippingAddress: {
        fullName,
        phone,
        line1: String(addressInput.line1 ?? ""),
        line2: String(addressInput.line2 ?? ""),
        city: String(addressInput.city ?? ""),
        postalCode: String(addressInput.postalCode ?? ""),
        country: String(addressInput.country ?? ""),
        state: String(addressInput.state ?? ""),
      },
      deliveryMethod,
      paymentMethod,
      couponCode:
        typeof input.couponCode === "string" && input.couponCode.trim()
          ? input.couponCode.trim()
          : null,
      notes: typeof input.notes === "string" ? input.notes.slice(0, 1000) : "",
    };
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Invalid order request.",
      },
      { status: 400 },
    );
  }

  const validation = await supabaseFetch("/rpc/public_validate_cart", {
    method: "POST",
    body: JSON.stringify({ p_items: submitted.items }),
  });
  const validationData = await readJson(validation);
  if (!validation.ok || isRejectedResult(validationData)) {
    const details = recordFrom(validationData);
    return NextResponse.json(
      {
        success: false,
        message:
          (typeof details?.message === "string" && details.message) ||
          "One or more cart items are unavailable or have changed in price.",
        data: validationData,
      },
      { status: 409 },
    );
  }

  const orderResponse = await supabaseFetch(
    "/rpc/fn_create_web_order",
    {
      method: "POST",
      body: JSON.stringify({
        p_idempotency_key: submitted.idempotencyKey,
        p_items: submitted.items,
        p_shipping_address: {
          full_name: submitted.shippingAddress.fullName,
          phone: submitted.shippingAddress.phone,
          line1: submitted.shippingAddress.line1,
          line2: submitted.shippingAddress.line2,
          city: submitted.shippingAddress.city,
          state: submitted.shippingAddress.state,
          postal_code: submitted.shippingAddress.postalCode,
          country: submitted.shippingAddress.country,
        },
        p_delivery_method: submitted.deliveryMethod,
        p_payment_method: submitted.paymentMethod,
        p_coupon_code: submitted.couponCode,
        p_notes: submitted.notes,
      }),
    },
    customer.accessToken,
  );
  const orderData = await readJson(orderResponse);
  if (!orderResponse.ok || isRejectedResult(orderData)) {
    const details = recordFrom(orderData);
    return NextResponse.json(
      {
        success: false,
        message:
          (typeof details?.message === "string" && details.message) ||
          "Unable to place the order.",
        data: orderData,
      },
      { status: orderResponse.ok ? 400 : orderResponse.status },
    );
  }

  const order = recordFrom(orderData);
  const referenceValue =
    order?.order_reference ??
    order?.reference ??
    order?.website_order_id ??
    order?.order_id ??
    order?.id ??
    (typeof orderData === "string" || typeof orderData === "number"
      ? orderData
      : null);
  if (referenceValue === null || referenceValue === undefined) {
    return NextResponse.json(
      {
        success: false,
        message: "The order response did not include an order reference.",
        data: orderData,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { success: true, reference: String(referenceValue), data: orderData },
    { status: 201 },
  );
}
