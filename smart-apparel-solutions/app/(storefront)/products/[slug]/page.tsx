"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductDetailPanel from "@/components/storefront/products/ProductDetailPanel";
import { fetchProductBySlug } from "@/lib/api/catalog";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [result, setResult] = useState<{
    slug: string;
    product: Product | null;
    error: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetchProductBySlug(slug)
      .then((liveProduct) => {
        if (active) setResult({ slug, product: liveProduct, error: "" });
      })
      .catch((requestError: unknown) => {
        if (active) {
          setResult({
            slug,
            product: null,
            error: requestError instanceof Error ? requestError.message : "Unable to load this product.",
          });
        }
      });
    return () => { active = false; };
  }, [slug]);

  const isLoading = result?.slug !== slug;
  const product = result?.slug === slug ? result.product : null;
  const error = result?.slug === slug ? result.error : "";
  if (isLoading) return <main className="page-shell"><div className="container"><div className="empty-state"><p>Loading live product details...</p></div></div></main>;
  if (error) return <main className="page-shell"><div className="container"><div className="empty-state" role="alert"><h2>Product unavailable</h2><p>{error}</p></div></div></main>;
  if (!product) notFound();
  return <ProductDetailPanel product={product} />;
}
