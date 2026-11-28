import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type AuthUserLike = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type AuthSessionLike = {
  access_token: string;
};

function getSupabaseUrl(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

export function getSupabaseKey(): string {
  return (
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

export async function createSupabaseServerClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) {
    throw new Error("Supabase URL and anon key are required.");
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  return createServerClient(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...options, ...cookieOptions });
          });
        } catch {
          // Cookie writes can throw when this client is created outside a request mutation.
        }
      },
    },
  });
}

export interface CustomerSession {
  accessToken: string;
  customerId: string;
  email: string;
  id: string;
  name: string;
}

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const encodedClaims = accessToken.split(".")[1];
  if (!encodedClaims) return null;
  try {
    return JSON.parse(
      Buffer.from(encodedClaims, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function firstId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

async function lookupWebsiteCustomerId(accessToken: string): Promise<{
  customerId: string | null;
  name: string | null;
}> {
  const response = await supabaseFetch(
    "/website_customers?select=website_customer_id,full_name,email,status&limit=1",
    { method: "GET" },
    accessToken,
  );
  if (!response.ok) return { customerId: null, name: null };

  const payload: unknown = await response.json().catch(() => null);
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row !== "object") return { customerId: null, name: null };

  const record = row as Record<string, unknown>;
  return {
    customerId: firstId(record.website_customer_id),
    name: typeof record.full_name === "string" ? record.full_name : null,
  };
}

export async function customerSessionFromAuth(
  user: AuthUserLike,
  session: AuthSessionLike,
): Promise<CustomerSession | null> {
  const claims = decodeJwtPayload(session.access_token) ?? {};
  const appMetadata = user.app_metadata ?? {};
  const accountKind = claims.account_kind ?? appMetadata.account_kind;
  if (accountKind === "staff") return null;

  const profile = await lookupWebsiteCustomerId(session.access_token);
  const customerId =
    firstId(claims.website_customer_id) ??
    firstId(appMetadata.website_customer_id) ??
    profile.customerId ??
    (accountKind === "customer" || !accountKind ? user.id : null);

  if (!customerId) return null;

  const userMetadata = user.user_metadata ?? {};
  return {
    accessToken: session.access_token,
    customerId,
    email: user.email ?? "",
    id: user.id,
    name:
      (typeof userMetadata.full_name === "string" && userMetadata.full_name) ||
      profile.name ||
      user.email ||
      "",
  };
}

export function customerAuthPayload(customer: CustomerSession) {
  return {
    id: customer.id,
    user_id: customer.id,
    website_customer_id: customer.customerId,
    full_name: customer.name,
    name: customer.name,
    email: customer.email,
  };
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError || !sessionData.session) return null;
  return customerSessionFromAuth(userData.user, sessionData.session);
}

export async function supabaseFetch(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<Response> {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) {
    throw new Error("Supabase URL and anon key are required.");
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${accessToken || key}`);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  return fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
