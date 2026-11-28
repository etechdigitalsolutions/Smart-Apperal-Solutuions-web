import { NextRequest, NextResponse } from "next/server";
import {
  authError,
  CUSTOMER_SIGNUP_REDIRECT,
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
  const fullName =
    typeof body.fullName === "string"
      ? body.fullName.trim()
      : typeof body.name === "string"
        ? body.name.trim()
        : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || fullName.length < 2 || password.length < 8) {
    return authError(
      "Name, valid email, and a password of at least 8 characters are required.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: customerSiteUrl(request, CUSTOMER_SIGNUP_REDIRECT),
      data: { full_name: fullName, phone },
    },
  });
  if (error) return authError(error.message, 400);

  await supabase.auth.signOut();
  return NextResponse.json({
    success: true,
    message: "Check your email to verify your account.",
  });
}
