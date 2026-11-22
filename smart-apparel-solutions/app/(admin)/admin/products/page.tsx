"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminPanel from "@/components/admin/AdminPanel";
import { products } from "@/data/products";
import { formatCurrency } from "@/lib/utils/helpers";
import { fetchProducts } from "@/lib/api/catalog";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  useEffect(() => {
    let active = true;
    fetchProducts().then((items) => { if (active) setLiveProducts(items); });
    return () => { active = false; };
  }, []);
  const source = liveProducts.length ? liveProducts : products;
  return <AdminPanel title="Product catalogue" description="Manage machine listings, pricing and availability."><div className="admin-toolbar"><Link href="/admin/products/new" className="btn btn-primary">Add product</Link><Link href="/products" className="btn btn-outline">View storefront</Link></div><div className="page-card admin-table"><div className="admin-table-row admin-table-head"><span>Product</span><span>Brand</span><span>Price</span><span>Action</span></div>{source.map((product) => <div className="admin-table-row" key={product.id}><span>{product.name}</span><span>{product.brand}</span><span>{formatCurrency(product.price)}</span><span><Link href={`/admin/products/${product.id}/edit`} className="link-arrow">Edit</Link></span></div>)}</div></AdminPanel>;
}
