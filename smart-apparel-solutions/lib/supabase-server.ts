import "server-only";

function getSupabaseRestUrl(): string {
  const configuredUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const baseUrl = configuredUrl.trim().replace(/\/+$/, "");

  if (!baseUrl) return "";
  return baseUrl.endsWith("/rest/v1") ? baseUrl : `${baseUrl}/rest/v1`;
}

export const SMARTSTOCK_REST_URL = getSupabaseRestUrl();

export function getSupabaseKey(): string {
  return (
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SMARTSTOCK_REST_URL && getSupabaseKey());
}

export async function supabaseFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const key = getSupabaseKey();
  if (!key) {
    throw new Error("SUPABASE_ANON_KEY is not configured");
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  return fetch(`${SMARTSTOCK_REST_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
