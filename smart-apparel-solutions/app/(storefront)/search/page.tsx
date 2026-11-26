"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/storefront/products/ProductCard";
import { fetchProducts } from "@/lib/api/catalog";
import type { Product } from "@/types";

function SearchResults({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<{
    query: string;
    products: Product[];
    error: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const normalizedQuery = query.trim();
    fetchProducts(normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : "")
      .then((products) => {
        if (active) setResult({ query: normalizedQuery, products, error: "" });
      })
      .catch((requestError: unknown) => {
        if (active) {
          setResult({
            query: normalizedQuery,
            products: [],
            error: requestError instanceof Error ? requestError.message : "Unable to search the catalogue.",
          });
        }
      });
    return () => { active = false; };
  }, [query]);

  const normalizedQuery = query.trim();
  const isLoading = result?.query !== normalizedQuery;
  const error = result?.query === normalizedQuery ? result.error : "";
  const matches = useMemo(() => {
    const normalized = normalizedQuery.toLowerCase();
    if (!normalized) return [];
    const apiProducts = result?.query === normalizedQuery ? result.products : [];
    return apiProducts.filter((product) => `${product.name} ${product.brand} ${product.modelCode}`.toLowerCase().includes(normalized));
  }, [normalizedQuery, result]);
  return <main className="page-shell"><div className="container"><div className="page-heading"><p className="eyebrow">Search the catalogue</p><h1>Find your next product</h1><form className="search-page-form" onSubmit={(event) => { event.preventDefault(); setQuery((value) => value.trim()); }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by model, brand or product" /><button className="btn btn-primary" type="submit">Search</button></form></div>{query ? <>{isLoading ? <div className="empty-state"><p>Searching live catalogue...</p></div> : error ? <div className="empty-state" role="alert"><h2>Search unavailable</h2><p>{error}</p></div> : <><div className="catalog-toolbar"><p><strong>{matches.length}</strong> results for &quot;{query}&quot;</p></div>{matches.length ? <div className="product-grid">{matches.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No results yet</h2><p>Try a different product name or model number.</p></div>}</>}</> : <div className="search-suggestions"><h2>Popular searches</h2><div className="suggestion-list">{["engine oil", "brake", "battery", "filter", "grease"].map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)}>{suggestion}</button>)}</div></div>}</div></main>;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  return <SearchResults key={initialQuery} initialQuery={initialQuery} />;
}

export default function SearchPage() {
  return <Suspense fallback={<main className="page-shell"><div className="container"><div className="empty-state"><p>Loading search...</p></div></div></main>}><SearchPageContent /></Suspense>;
}
