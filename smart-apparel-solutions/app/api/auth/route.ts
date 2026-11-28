import { NextRequest, NextResponse } from "next/server";
import {
  authError,
  CUSTOMER_PASSWORD_RESET_REDIRECT,
  CUSTOMER_SIGNUP_REDIRECT,
  customerSiteUrl,
  readJsonBody,
} from "@/lib/auth-http";
import {
  createSupabaseServerClient,
  customerAuthPayload,
  customerSessionFromAuth,
  getCustomerSession,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return authError("Supabase is not configured.", 503);
  }

  const customer = await getCustomerSession();
    return NextResponse.json({
      success: true,
      data: customer ? customerAuthPayload(customer) : null,
    });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return authError("Supabase is not configured.", 503);
  }

  const parsed = await readJsonBody(request);
  if ("error" in parsed && typeof parsed.error === "string") {
    return authError(parsed.error, 400);
  }
  const body = parsed.body;
  const action = typeof body.action === "string" ? body.action : "login";
  const supabase = await createSupabaseServerClient();

  if (action === "register") {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : typeof body.name === "string"
          ? body.name.trim()
          : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || name.length < 2 || password.length < 8) {
      return authError(
        "Name, valid email, and a password of at least 8 characters are required.",
      );
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: customerSiteUrl(request, CUSTOMER_SIGNUP_REDIRECT),
        data: { full_name: name, phone },
      },
    });
    if (error) return authError(error.message, 400);

    await supabase.auth.signOut();
    return NextResponse.json({
      success: true,
      message: "Check your email to verify your account.",
    });
  }

  if (action === "login") {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return authError("Email and password are required.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user || !data.session) {
      return authError("Unable to sign in with those credentials.", 401);
    }

    const customer = await customerSessionFromAuth(data.user, data.session);
    if (!customer) {
      await supabase.auth.signOut();
      return authError(
        "This account is not an authorized website customer.",
        403,
      );
    }
    return NextResponse.json({
      success: true,
      data: customerAuthPayload(customer),
    });
  }

  if (action === "reset") {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) return authError("Email is required.");
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

  if (action === "update-password") {
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) {
      return authError("The new password must be at least 8 characters.");
    }
    if (!(await getCustomerSession())) {
      return authError("A valid customer session is required.", 401);
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return authError(error.message, 400);
    return NextResponse.json({ success: true });
  }

  if (action === "change-password") {
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    const customer = await getCustomerSession();
    if (!customer) {
      return authError("A valid customer session is required.", 401);
    }
    if (!currentPassword || newPassword.length < 8) {
      return authError(
        "Current password and a new password of at least 8 characters are required.",
      );
    }

    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: customer.email,
      password: currentPassword,
    });
    if (passwordError) {
      return authError("The current password is incorrect.", 400);
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return authError(error.message, 400);
    return NextResponse.json({ success: true });
  }

  return authError("Unsupported authentication action.", 400);
}

export async function DELETE() {
  if (!isSupabaseConfigured()) {
    return authError("Supabase is not configured.", 503);
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) return authError(error.message, 500);
  return NextResponse.json({ success: true });
}
