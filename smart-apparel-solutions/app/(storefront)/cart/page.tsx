
"use client";

import Link from "next/link";

import CartItem from "@/components/storefront/cart/CartItem";
import CartSummary from "@/components/storefront/cart/CartSummary";
import { useCart } from "@/hooks/useCart";

export default function CartPage() {
  const { items, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <main className="cart-page cart-empty container">
        <Link href="/" className="link-arrow account-back-home">
          ← Back to Home
        </Link>

        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link href="/products" className="btn btn-primary">
          Continue shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="cart-page container">
      <Link href="/" className="link-arrow account-back-home">
        ← Back to Home
      </Link>

      <h1>Your cart</h1>
      <p className="cart-summary-hint">Your cart is saved in this browser. After you sign in, it is synchronized to your customer account and validated by the server before the order is placed.</p>

      <div className="cart-layout">
        <section className="cart-list" aria-label="Cart items">
          {items.map((item) => (
            <CartItem
              key={`${item.productId}-${item.size ?? ""}-${item.color ?? ""}`}
              item={item}
            />
          ))}

          <button type="button" className="cart-clear" onClick={clearCart}>
            Clear cart
          </button>
        </section>

        <CartSummary />
      </div>
    </main>
  );
}
