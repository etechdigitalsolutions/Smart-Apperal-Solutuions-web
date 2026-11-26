"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCategories } from "@/lib/api/catalog";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((items) => { if (active) setLiveCategories(items); })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load categories.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  return <main className="page-shell"><div className="container"><div className="page-heading"><p className="eyebrow">Browse by category</p><h1>Find the products you need</h1><p>Explore the live catalogue categories and their available products.</p></div>{isLoading ? <div className="empty-state"><p>Loading live categories...</p></div> : error ? <div className="empty-state" role="alert"><h2>Categories unavailable</h2><p>{error}</p></div> : liveCategories.length ? <div className="category-directory">{liveCategories.map((category) => <article key={category.id} className="page-card category-directory-card"><p className="eyebrow">{category.children?.length ? "Product family" : "Shop category"}</p><h2>{category.name}</h2><p>{category.description}</p><Link href={`/categories/${category.slug}`} className="link-arrow">Explore category</Link></article>)}</div> : <div className="empty-state"><h2>No categories available</h2><p>There are no active categories to display.</p></div>}</div></main>;
}
