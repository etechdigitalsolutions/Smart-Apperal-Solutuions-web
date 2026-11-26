import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Analytics API is not implemented." },
    { status: 501 },
  );
}
