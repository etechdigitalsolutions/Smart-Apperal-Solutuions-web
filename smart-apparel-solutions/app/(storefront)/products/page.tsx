"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/storefront/products/ProductCard";
import Link from "next/link";
import { fetchCategories, fetchProducts } from "@/lib/api/catalog";
import type { Category, Product } from "@/types";

const menuTagAliases: Record<string, string[]> = {
  "budget-machine-series": ["budget", "budget-series"],
  "automated-machines": ["automated"],
  "single-needle-machines": ["single-needle"],
  "overlock-machines": ["overlock"],
  "double-needle-machines": ["double-needle"],
  "interlock-machines": ["interlock"],
};

function ProductsCatalogueContent({
  initialSearch,
  initialCategory,
  initialTag,
  initialBrand,
}: {
  initialSearch: string;
  initialCategory: string;
  initialTag: string;
  initialBrand: string;
}) {
  const [query, setQuery] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("featured");
  const [condition, setCondition] = useState("all");

  const tag = initialTag;
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([nextProducts, nextCategories]) => {
        if (!active) return;
        setApiProducts(nextProducts);
        setApiCategories(nextCategories);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Unable to load the catalogue.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

const filteredProducts = useMemo(() => {
  const result = apiProducts.filter((product) => {
    const haystack =
      `${product.name} ${product.brand} ${product.modelCode} ${product.tags.join(" ")}`.toLowerCase();

    const matchesQuery =
      !query || haystack.includes(query.toLowerCase());

    // Match parent categories and their product categories.
    const matchesCategory =
      !category ||
      product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === category;

    const allowedTags = menuTagAliases[tag] ?? [tag];
    const matchesTag = !tag || allowedTags.some((value) => product.tags.includes(value));

    const matchesBrand =
      !brand || product.brand === brand;

    const matchesAvailability =
      availability === "all" ||
      product.stockStatus === availability;

    const matchesCondition =
      condition === "all" ||
      product.condition === condition;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesTag &&
      matchesBrand &&
      matchesAvailability &&
      matchesCondition
    );
  });

  return [...result].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "newest") {
      return new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime();
    }
    return a.id.localeCompare(b.id);
  });
}, [
  availability,
  brand,
  category,
  condition,
  tag,
  query,
  sort,
  apiProducts,
]);

  const brands = [...new Set(apiProducts.map((product) => product.brand).filter(Boolean))].sort();
  const categories = apiCategories;

  return (
    <main className="page-shell">
      <div className="container">
        <Link href="/" className="link-arrow account-back-home">
          ← Back to Home
        </Link>

        <div className="page-heading">
          <p className="eyebrow">Industrial equipment catalogue</p>
          <h1>Machines, parts & workshop essentials</h1>
          <p>Compare production-ready equipment, filter by application, and request help choosing the right setup.</p>
        </div>
        <div className="catalog-layout">
          <aside className="filter-panel">
            <div className="filter-heading"><strong>Filter catalogue</strong><button type="button" onClick={() => { setQuery(""); setCategory(""); setBrand(""); setAvailability("all"); }}>Reset</button></div>
            <label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Model, brand or use" /></label>
            <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
            <label>Brand<select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="">All brands</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Condition<select value={condition} onChange={(event) => setCondition(event.target.value)}><option value="all">All conditions</option><option value="brand_new">Brand New</option><option value="used">Used</option></select></label>
            <label>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">All stock states</option><option value="in_stock">In stock</option><option value="pre_order">Pre-order</option><option value="out_of_stock">Out of stock</option></select></label>
            <div className="filter-note"><strong>Need a recommendation?</strong><p>Send us your fabric, operation and daily output. We will suggest a practical machine setup.</p><a href="/contact" className="link-arrow">Talk to a specialist</a></div>
          </aside>
          <section className="catalog-results">
            <div className="catalog-toolbar"><p><strong>{filteredProducts.length}</strong> products</p><label className="sort-control">Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
            {isLoading ? <div className="empty-state"><p>Loading live products...</p></div> : loadError ? <div className="empty-state" role="alert"><h2>Catalogue unavailable</h2><p>{loadError}</p></div> : filteredProducts.length ? <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No matching products</h2><p>Try a different model, category or stock filter.</p></div>}
          </section>
        </div>
      </div>
    </main>
  );
}

function ProductsCatalogue() {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  return (
    <ProductsCatalogueContent
      key={queryKey}
      initialSearch={searchParams.get("q") ?? ""}
      initialCategory={searchParams.get("category") ?? ""}
      initialTag={searchParams.get("tag") ?? ""}
      initialBrand={searchParams.get("brand") ?? ""}
    />
  );
}

export default function ProductsPage() {
  return <Suspense fallback={<main className="page-shell"><div className="container"><div className="empty-state"><p>Loading catalogue...</p></div></div></main>}><ProductsCatalogue /></Suspense>;
}
