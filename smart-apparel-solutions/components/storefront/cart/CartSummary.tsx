"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils/helpers";

export default function CartSummary() {
  const { subtotal } = useCart();

  return (
    <aside className="cart-summary">
      <h2>Order summary</h2>

      <div className="cart-summary-section">
        <p className="cart-summary-hint">You can add order notes during checkout.</p>
      </div>

      <p className="cart-summary-hint">Shipping and final pricing will be confirmed by our sales team.</p>

      <div className="cart-summary-subtotal">
        <strong>Subtotal:</strong>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      <Link href="/checkout" className="btn btn-primary cart-checkout-btn">
        <ShoppingBag size={20} aria-hidden="true" />
        Checkout
      </Link>
    </aside>
  );
}