"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categories } from "@/data/categories";
import { fetchCategories } from "@/lib/api/catalog";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCategories().then((items) => {
      if (!active) return;
      setLiveCategories(items);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, []);

  const sourceCategories = liveCategories.length ? liveCategories : categories;
  return <main className="page-shell"><div className="container"><div className="page-heading"><p className="eyebrow">Browse by category</p><h1>Find the products you need</h1><p>Explore the live catalogue categories and their available products.</p></div>{isLoading ? <div className="empty-state"><p>Loading live categories...</p></div> : <div className="category-directory">{sourceCategories.map((category) => <article key={category.id} className="page-card category-directory-card"><p className="eyebrow">{category.children?.length ? "Product family" : "Shop category"}</p><h2>{category.name}</h2><p>{category.description}</p><Link href={`/categories/${category.slug}`} className="link-arrow">Explore category</Link></article>)}</div>}</div></main>;
}
