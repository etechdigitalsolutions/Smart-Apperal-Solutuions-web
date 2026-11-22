"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/storefront/products/ProductCard";
import { products } from "@/data/products";
import { fetchProducts } from "@/lib/api/catalog";
import type { Product } from "@/types";

function SearchResults() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchProducts(query ? `?q=${encodeURIComponent(query)}` : "").then((next) => {
      if (!active) return;
      setApiProducts(next);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [query]);

  const matches = useMemo(() => {
    const source = apiProducts.length ? apiProducts : products;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return source.filter((product) => `${product.name} ${product.brand} ${product.modelCode} ${product.tags.join(" ")}`.toLowerCase().includes(normalized));
  }, [apiProducts, query]);
  return <main className="page-shell"><div className="container"><div className="page-heading"><p className="eyebrow">Search the catalogue</p><h1>Find your next product</h1><div className="search-page-form"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by model, brand or product" /><button className="btn btn-primary" type="button" onClick={() => setQuery(query)}>Search</button></div></div>{query ? <><div className="catalog-toolbar"><p><strong>{matches.length}</strong> results for &quot;{query}&quot;</p></div>{isLoading ? <div className="empty-state"><p>Searching live catalogue...</p></div> : matches.length ? <div className="product-grid">{matches.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No results yet</h2><p>Try a different product name or model number.</p></div>}</> : <div className="search-suggestions"><h2>Popular searches</h2><div className="suggestion-list">{["engine oil", "brake", "battery", "filter", "grease"].map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)}>{suggestion}</button>)}</div></div>}</div></main>;
}

export default function SearchPage() {
  return <Suspense fallback={<main className="page-shell"><div className="container"><div className="empty-state"><p>Loading search...</p></div></div></main>}><SearchResults /></Suspense>;
}
