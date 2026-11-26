"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import AccountPanel from "@/components/account/AccountPanel";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { fetchProducts } from "@/lib/api/catalog";
import { formatCurrency } from "@/lib/utils/helpers";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { wishlist, remove } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setError("Unable to load current product details."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const savedProducts = products.filter((product) => wishlist.includes(product.id));
  return <AccountPanel title="My wishlist" description="Your carefully selected shortlist for the next workshop upgrade.">
    <p className="form-feedback" role="note">Wishlist items are stored on this device only; the backend does not provide wishlist persistence.</p>
    {isLoading ? <div className="empty-state" role="status">Loading current product details...</div> : null}
    {error ? <div className="empty-state" role="alert">{error}</div> : null}
    {!isLoading && !error && !savedProducts.length ? <div className="account-empty"><span className="empty-icon"><Heart size={28} /></span><h2>{wishlist.length ? "Saved products are unavailable" : "Your wishlist is waiting"}</h2><p>{wishlist.length ? "Some saved product IDs are no longer in the live catalogue." : "Save machines, accessories and parts while you compare the right fit for your workshop."}</p><Link href="/products" className="btn btn-primary">Browse equipment</Link></div> : null}
    {!isLoading && !error && savedProducts.length ? <div className="wishlist-products">{savedProducts.map((product) => <article className="wishlist-product" key={product.id}><Link href={`/products/${product.slug}`} className="wishlist-product-image"><Image src={product.images[0] || "/images/logo/smart-apperal-logo.png"} alt={product.name} fill sizes="160px" /></Link><div className="wishlist-product-info"><span className="product-brand">{product.brand}</span><h2><Link href={`/products/${product.slug}`}>{product.name}</Link></h2><strong>{formatCurrency(product.price)}</strong><span className={`availability ${product.stockStatus === "in_stock" ? "available" : ""}`}>{product.stockStatus === "in_stock" ? "In stock" : product.stockStatus === "pre_order" ? "Available for pre-order" : "Currently unavailable"}</span><div className="wishlist-product-actions"><Link href={`/products/${product.slug}`} className="btn btn-small-outline">View product</Link><button type="button" className="btn btn-primary btn-small" disabled={product.stockStatus === "out_of_stock"} onClick={() => addItem({ productId: product.id, product, quantity: 1 })}><ShoppingBag size={15} /> Add to cart</button></div></div><button type="button" className="wishlist-remove" onClick={() => remove(product.id)} aria-label={`Remove ${product.name}`}><Trash2 size={18} /></button></article>)}</div> : null}
  </AccountPanel>;
}
