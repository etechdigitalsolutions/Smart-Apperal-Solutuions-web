"use client";

import { useEffect, useState } from "react";
import AdminPanel from "@/components/admin/AdminPanel";
import { products } from "@/data/products";
import { fetchProducts } from "@/lib/api/catalog";
import type { Product } from "@/types";

export default function InventoryPage() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  useEffect(() => {
    let active = true;
    fetchProducts().then((items) => { if (active) setLiveProducts(items); });
    return () => { active = false; };
  }, []);
  const source = liveProducts.length ? liveProducts : products;
  return <AdminPanel title="Inventory" description="Monitor stock states and prioritise replenishment."><div className="page-card admin-table"><div className="admin-table-row admin-table-head"><span>Product</span><span>SKU</span><span>Stock</span><span>Status</span></div>{source.map((product) => <div className="admin-table-row" key={product.id}><span>{product.name}</span><span>{product.sku}</span><span>{product.stock}</span><span>{product.stockStatus}</span></div>)}</div></AdminPanel>;
}
