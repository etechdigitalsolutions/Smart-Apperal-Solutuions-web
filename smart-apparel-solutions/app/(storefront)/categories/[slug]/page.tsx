"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/storefront/products/ProductCard";
import { useEffect, useState } from "react";
import { fetchCategories, fetchProducts } from "@/lib/api/catalog";
import type { Category, Product } from "@/types";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [category, setCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetchCategories(), fetchProducts(`?category=${encodeURIComponent(slug)}`)]).then(([liveCategories, liveProducts]) => {
      if (!active) return;
      const found = liveCategories.find((item) => item.slug === slug) ?? null;
      setCategory(found);
      setCategoryProducts(liveProducts);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load this category.");
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (!isLoading && !error && !category) notFound();
  if (!category) return <main className="page-shell"><div className="container"><div className="empty-state" role={error ? "alert" : undefined}><p>{error || "Loading category..."}</p></div></div></main>;
  return (
    <main className="page-shell">
      <div className="container">
        <section className="category-banner">
          <span className="category-banner-overlay" />
          <div>
            <p className="eyebrow">Category collection</p>
            <h1>{category.name}</h1>
            <p>{category.description}</p>
          </div>
        </section>
        <div className="category-detail-layout"><aside className="page-card category-aside"><strong>Explore this family</strong>{category.children?.map((child) => <Link key={child.slug} href={`/products?tag=${child.slug}`}>{child.name}</Link>)}<Link href="/contact" className="link-arrow">Need a recommendation?</Link></aside><section><div className="catalog-toolbar"><p><strong>{categoryProducts.length}</strong> products</p><Link href="/products" className="link-arrow">View all equipment</Link></div>{categoryProducts.length ? <div className="product-grid">{categoryProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No products in this category</h2><p>There are no active products to display.</p></div>}</section></div>
      </div>
    </main>
  );
}
