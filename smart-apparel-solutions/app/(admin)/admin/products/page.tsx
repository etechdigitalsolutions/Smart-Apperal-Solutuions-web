"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminPanel from "@/components/admin/AdminPanel";
import { formatCurrency } from "@/lib/utils/helpers";
import { fetchProducts } from "@/lib/api/catalog";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => { if (active) setLiveProducts(items); })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load products.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  return <AdminPanel title="Product catalogue" description="Review machine listings, pricing and availability."><div className="admin-toolbar"><Link href="/products" className="btn btn-outline">View storefront</Link></div>{isLoading ? <p role="status">Loading products…</p> : error ? <p className="form-error-text" role="alert">{error}</p> : liveProducts.length ? <div className="page-card admin-table"><div className="admin-table-row admin-table-head"><span>Product</span><span>Brand</span><span>Price</span><span>Management</span></div>{liveProducts.map((product) => <div className="admin-table-row" key={product.id}><span>{product.name}</span><span>{product.brand}</span><span>{formatCurrency(product.price)}</span><span>Read-only</span></div>)}</div> : <div className="empty-state"><p>No active products found.</p></div>}</AdminPanel>;
}
