import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Persistent cart API is not implemented." },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Persistent cart API is not implemented." },
    { status: 501 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: "Persistent cart API is not implemented." },
    { status: 501 },
  );
}
