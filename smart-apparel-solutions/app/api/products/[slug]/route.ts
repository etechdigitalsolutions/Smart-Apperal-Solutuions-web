import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const productsUrl = new URL("/api/products", request.nextUrl.origin);
  productsUrl.searchParams.set("limit", "200");
  const upstream = await fetch(productsUrl, { cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json({ success: false, message: "Unable to load product." }, { status: upstream.status });
  }
  const result = await upstream.json() as { success?: boolean; data?: Array<{ slug: string }> };
  const product = result.data?.find((item) => item.slug === slug);
  if (!product) {
    return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: product });
}
