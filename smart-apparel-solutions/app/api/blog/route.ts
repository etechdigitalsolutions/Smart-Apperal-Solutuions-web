import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Blog content API is not implemented." },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Blog content API is not implemented." },
    { status: 501 },
  );
}
