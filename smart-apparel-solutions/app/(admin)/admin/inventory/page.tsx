"use client";

import { useEffect, useState } from "react";
import AdminPanel from "@/components/admin/AdminPanel";
import { fetchProducts } from "@/lib/api/catalog";
import type { Product } from "@/types";

export default function InventoryPage() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => { if (active) setLiveProducts(items); })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load inventory.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  return <AdminPanel title="Inventory" description="Monitor stock states and prioritise replenishment.">{isLoading ? <p role="status">Loading inventory…</p> : error ? <p className="form-error-text" role="alert">{error}</p> : liveProducts.length ? <div className="page-card admin-table"><div className="admin-table-row admin-table-head"><span>Product</span><span>SKU</span><span>Stock</span><span>Status</span></div>{liveProducts.map((product) => <div className="admin-table-row" key={product.id}><span>{product.name}</span><span>{product.sku}</span><span>{product.stock}</span><span>{product.stockStatus}</span></div>)}</div> : <div className="empty-state"><p>No active inventory records found.</p></div>}</AdminPanel>;
}
