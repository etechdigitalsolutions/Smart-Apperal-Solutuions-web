"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductDetailPanel from "@/components/storefront/products/ProductDetailPanel";
import { fetchProductBySlug } from "@/lib/api/catalog";
import { products as staticProducts } from "@/data/products";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [product, setProduct] = useState<Product | null>(
    () => staticProducts.find((item) => item.slug === slug) ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchProductBySlug(slug).then((liveProduct) => {
      if (!active) return;
      setProduct(liveProduct ?? staticProducts.find((item) => item.slug === slug) ?? null);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [slug]);

  if (isLoading && !product) {
    return <main className="page-shell"><div className="container"><div className="empty-state"><p>Loading live product details...</p></div></div></main>;
  }
  if (!product) notFound();
  return <ProductDetailPanel product={product} />;
}
