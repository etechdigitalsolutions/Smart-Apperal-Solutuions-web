import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseFetch } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, message: "SUPABASE_ANON_KEY is not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 }); }

  const action = typeof body.action === "string" ? body.action : "login";

  if (action === "register") {
    const payload = {
      p_email: String(body.email ?? ""),
      p_full_name: String(body.name ?? ""),
      p_password: String(body.password ?? ""),
      p_role_id: Number(body.roleId ?? 2),
      p_username: String(body.username ?? body.email ?? ""),
    };
    const upstream = await supabaseFetch("/rpc/register_user", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) return NextResponse.json({ success: false, message: "Registration failed.", data }, { status: upstream.status });
    return NextResponse.json({ success: true, data });
  }

  if (action === "verify") {
    const upstream = await supabaseFetch("/rpc/verify_token", {
      method: "POST",
      body: JSON.stringify({ p_token: String(body.token ?? "") }),
    });
    const data = await upstream.json().catch(() => null);
    return NextResponse.json({ success: upstream.ok, data }, { status: upstream.status });
  }

  if (action === "reset") {
    const upstream = await supabaseFetch("/rpc/reset_password", {
      method: "POST",
      body: JSON.stringify({
        p_admin_user_id: Number(body.adminUserId ?? 1),
        p_new_password: String(body.password ?? ""),
        p_user_id: Number(body.userId ?? 1),
      }),
    });
    const data = await upstream.json().catch(() => null);
    return NextResponse.json({ success: upstream.ok, data }, { status: upstream.status });
  }

  if (action === "change-password") {
    const upstream = await supabaseFetch("/rpc/change_password", {
      method: "POST",
      body: JSON.stringify({
        p_new_password: String(body.newPassword ?? ""),
        p_old_password: String(body.oldPassword ?? ""),
        p_user_id: Number(body.userId ?? 1),
      }),
    });
    const data = await upstream.json().catch(() => null);
    return NextResponse.json({ success: upstream.ok, data }, { status: upstream.status });
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
  if (!upstream.ok) return NextResponse.json({ success: false, message: "Authentication failed.", data }, { status: upstream.status });
  return NextResponse.json({ success: true, data });
}
