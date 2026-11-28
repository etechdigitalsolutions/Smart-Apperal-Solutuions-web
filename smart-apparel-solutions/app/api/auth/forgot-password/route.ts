import { NextRequest, NextResponse } from "next/server";
import {
  authError,
  CUSTOMER_PASSWORD_RESET_REDIRECT,
  customerSiteUrl,
  readJsonBody,
} from "@/lib/auth-http";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return authError("Supabase is not configured.", 503);
  }

  const parsed = await readJsonBody(request);
  if ("error" in parsed && typeof parsed.error === "string") {
    return authError(parsed.error, 400);
  }
  const body = parsed.body;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) return authError("Email is required.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: customerSiteUrl(request, CUSTOMER_PASSWORD_RESET_REDIRECT),
  });
  if (error) return authError(error.message, 400);

  return NextResponse.json({
    success: true,
    message:
      "If an account exists for that email, a recovery link has been sent.",
  });
}
