import "server-only";

export const SMARTSTOCK_REST_URL =
  process.env.SUPABASE_URL || "https://ngibptwcamqxyncdwwqe.supabase.co/rest/v1";

export function getSupabaseKey(): string {
  return process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseKey());
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
