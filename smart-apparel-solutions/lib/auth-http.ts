import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_SIZE = 16 * 1024;

export function authError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function readJsonBody(request: NextRequest) {
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_SIZE) {
    return { error: "Request body is too large." } as const;
  }
  try {
    const body: unknown = JSON.parse(rawBody);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { error: "Invalid request body." } as const;
    }
    return { body: body as Record<string, unknown> } as const;
  } catch {
    return { error: "Invalid JSON body." } as const;
  }
}

function customerSiteOrigin(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(
    /\/+$/,
    "",
  );
}

/** Absolute customer-site URL. Required by Supabase; never omit emailRedirectTo / redirectTo. */
export function customerSiteUrl(request: NextRequest, pathAndQuery: string) {
  return new URL(pathAndQuery, `${customerSiteOrigin(request)}/`).toString();
}

export const CUSTOMER_SIGNUP_REDIRECT = "/auth/callback?next=/login";
export const CUSTOMER_PASSWORD_RESET_REDIRECT = "/reset-password";
