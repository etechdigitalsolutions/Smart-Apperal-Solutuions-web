"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Heart, Package, Settings, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import AccountPanel from "@/components/account/AccountPanel";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { fetchProducts } from "@/lib/api/catalog";
import { formatCurrency } from "@/lib/utils/helpers";
import type { Product } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [productError, setProductError] = useState("");
  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setProductError("Unable to load current product details."); });
    return () => { active = false; };
  }, []);
  const savedProducts = products.filter((product) => wishlist.includes(product.id));
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <AccountPanel
      title={`Good morning, ${firstName}`}
      description="Here is what is happening with your workshop account today."
    >
      <div className="account-welcome">
        <div>
          <span className="welcome-kicker">Your workshop, at a glance</span>
          <h2>Ready for your next upgrade?</h2>
          <p>Keep your shortlist close and stay on top of every quotation.</p>
        </div>
        <Link href="/products" className="btn btn-white">
          Browse catalogue <ArrowUpRight size={17} aria-hidden />
        </Link>
      </div>

      <div className="account-stat-grid">
        <div className="account-stat-card">
          <span className="stat-icon blue" aria-hidden>
            <Package size={19} />
          </span>
          <strong>—</strong>
          <span>Active orders</span>
          <small>Order history is unavailable</small>
        </div>
        <div className="account-stat-card">
          <span className="stat-icon pink" aria-hidden>
            <Heart size={19} />
          </span>
          <strong>{wishlist.length}</strong>
          <span>Wishlist items</span>
          <small>Saved on this device only</small>
        </div>
        <div className="account-stat-card">
          <span className="stat-icon green" aria-hidden>
            <UserRound size={19} />
          </span>
          <strong>—</strong>
          <span>Profile complete</span>
          <small>Profile data is unavailable</small>
        </div>
      </div>

      <div className="account-section-grid">
        <section className="account-card">
          <div className="account-section-heading">
            <div>
              <p className="eyebrow">Latest activity</p>
              <h2>Recent orders</h2>
            </div>
            <Link href="/account/orders">
              View all <ArrowUpRight size={15} aria-hidden />
            </Link>
          </div>
          <div className="compact-empty" role="status">
            <Package size={22} aria-hidden />
            <p>The backend does not provide customer order history or delivery status.</p>
          </div>
        </section>

        <section className="account-card">
          <div className="account-section-heading">
            <div>
              <p className="eyebrow">Your shortlist</p>
              <h2>Recently saved</h2>
            </div>
            <Link href="/account/wishlist">
              View all <ArrowUpRight size={15} aria-hidden />
            </Link>
          </div>
          {productError ? <div className="compact-empty" role="alert"><p>{productError}</p></div> : savedProducts.length ? (
            <div className="mini-product-list">
              {savedProducts.slice(0, 3).map((product) => (
                <Link href={`/products/${product.slug}`} key={product.id}>
                  <Image src={product.images[0]} alt="" width={54} height={54} />
                  <span>
                    <strong>{product.name}</strong>
                    <small>{formatCurrency(product.price)}</small>
                  </span>
                  <ArrowUpRight size={15} aria-hidden />
                </Link>
              ))}
            </div>
          ) : (
            <div className="compact-empty">
              <Heart size={22} aria-hidden />
              <p>Your wishlist is ready for its first machine.</p>
              <Link href="/products">Explore products</Link>
            </div>
          )}
        </section>
      </div>

      <section className="quick-actions" aria-label="Quick actions">
        <Link href="/account/profile">
          <UserRound size={21} aria-hidden />
          <span>
            <strong>Update profile</strong>
            <small>Keep your contact details current</small>
          </span>
          <ArrowUpRight size={16} aria-hidden />
        </Link>
        <Link href="/account/wishlist">
          <Heart size={21} aria-hidden />
          <span>
            <strong>Review wishlist</strong>
            <small>
              {wishlist.length ? `${wishlist.length} saved products` : "Save products to compare"}
            </small>
          </span>
          <ArrowUpRight size={16} aria-hidden />
        </Link>
        <Link href="/account/settings">
          <Settings size={21} aria-hidden />
          <span>
            <strong>Account settings</strong>
            <small>Manage preferences and security</small>
          </span>
          <ArrowUpRight size={16} aria-hidden />
        </Link>
      </section>
    </AccountPanel>
  );
}
