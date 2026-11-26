import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, message: "User listing API is not implemented." },
    { status: 501 },
  );
}
