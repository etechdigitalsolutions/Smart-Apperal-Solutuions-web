import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

function rpcReportedFailure(data: unknown) {
  return data === false ||
    (typeof data === "object" &&
      data !== null &&
      !Array.isArray(data) &&
      "success" in data &&
      data.success === false);
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, message: "SUPABASE_ANON_KEY is not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 }); }

  const action = typeof body.action === "string" ? body.action : "login";

  if (action === "register") {
    const email = String(body.email ?? "").trim();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    if (!email || !name || password.length < 8) {
      return NextResponse.json({ success: false, message: "Name, email, and a password of at least 8 characters are required." }, { status: 400 });
    }
    const payload = {
      p_email: email,
      p_full_name: name,
      p_password: password,
      p_role_id: 2,
      p_username: email,
    };
    const upstream = await supabaseFetch("/rpc/register_user", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok || rpcReportedFailure(data)) {
      return NextResponse.json({ success: false, message: "Registration failed." }, { status: upstream.ok ? 400 : upstream.status });
    }
    return NextResponse.json({ success: true, data });
  }

  if (action === "verify") {
    const upstream = await supabaseFetch("/rpc/verify_token", {
      method: "POST",
      body: JSON.stringify({ p_token: String(body.token ?? "") }),
    });
    const data = await upstream.json().catch(() => null);
    const success = upstream.ok && !rpcReportedFailure(data);
    return NextResponse.json({ success, data }, { status: success ? upstream.status : upstream.ok ? 400 : upstream.status });
  }

  if (action === "reset") {
    return NextResponse.json({ success: false, message: "A verified password-reset flow is not available." }, { status: 501 });
  }

  if (action === "change-password") {
    const userId = Number(body.userId);
    const oldPassword = String(body.oldPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    if (!Number.isSafeInteger(userId) || userId < 1 || !oldPassword || newPassword.length < 8) {
      return NextResponse.json({ success: false, message: "A valid user ID, current password, and new password of at least 8 characters are required." }, { status: 400 });
    }
    const upstream = await supabaseFetch("/rpc/change_password", {
      method: "POST",
      body: JSON.stringify({
        p_new_password: newPassword,
        p_old_password: oldPassword,
        p_user_id: userId,
      }),
    });
    const data = await upstream.json().catch(() => null);
    const success = upstream.ok && !rpcReportedFailure(data);
    return NextResponse.json({ success, data }, { status: success ? upstream.status : upstream.ok ? 400 : upstream.status });
  }

  if (action !== "login") {
    return NextResponse.json({ success: false, message: "Unsupported authentication action." }, { status: 400 });
  }

  const payload = {
    p_username: String(body.email ?? body.username ?? ""),
    p_password: String(body.password ?? ""),
  };
  const upstream = await supabaseFetch("/rpc/authenticate_user", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await upstream.json().catch(() => null);
  if (!upstream.ok || rpcReportedFailure(data)) {
    return NextResponse.json({ success: false, message: "Authentication failed." }, { status: upstream.ok ? 401 : upstream.status });
  }
  return NextResponse.json({ success: true, data });
}
