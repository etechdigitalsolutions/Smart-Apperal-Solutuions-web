"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCart } from "@/hooks/useCart";
import type { CheckoutFormData } from "@/components/storefront/checkout/CheckoutForm";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { clearCart } = useCart();

  const [customer, setCustomer] = useState<CheckoutFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderReference, setOrderReference] = useState("");
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    let frame: number | undefined;
    try {
      const savedDetails = sessionStorage.getItem("checkoutDetails");
      const savedReference = sessionStorage.getItem("orderReference");

      if (!savedDetails || !savedReference) {
        router.replace("/checkout");
        return;
      }

      const parsed = JSON.parse(savedDetails) as CheckoutFormData;

      const isPickup = parsed.delivery === "pickup";

      if (
        !parsed.fullName?.trim() ||
        !parsed.email?.trim() ||
        !parsed.phone?.trim() ||
        (!isPickup &&
          (!parsed.line1?.trim() ||
            !parsed.city?.trim() ||
            !parsed.postalCode?.trim() ||
            !parsed.country?.trim()))
      ) {
        sessionStorage.removeItem("checkoutDetails");
        router.replace("/checkout");
        return;
      }

      frame = window.requestAnimationFrame(() => {
        processed.current = true;
        setOrderReference(savedReference);
        setCustomer(parsed);
        clearCart();
        sessionStorage.removeItem("checkoutDetails");
        setIsLoading(false);
      });
    } catch {
      router.replace("/checkout");
    }
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [clearCart, router]);

  if (isLoading) {
    return (
      <main className="page-shell">
        <div className="container narrow-content">
          <p>Loading confirmation...</p>
        </div>
      </main>
    );
  }

  if (!customer) return null;

  const isPickup = customer.delivery === "pickup";

  return (
    <main className="page-shell">
      <div className="container narrow-content">
        <div className="success-panel co-confirm">
          <div className="co-confirm-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="eyebrow">Thank you</p>
          <h1>Your request is with our team.</h1>
          <p>
            Your order has been recorded. Our team will contact you to confirm
            availability, delivery timing and payment arrangements.
          </p>
          <div className="co-order-reference">
            <span>Order reference</span>
            <strong>{orderReference}</strong>
          </div>

          <div className="co-confirm-details">
            <section>
              <h2>Contact</h2>
              <p>{customer.fullName}</p>
              <p>{customer.email}</p>
              <p>{customer.phone}</p>
            </section>

            <section>
              <h2>{isPickup ? "Pickup" : "Shipping address"}</h2>
              {isPickup ? (
                <p>We will confirm the pickup location, date and time.</p>
              ) : (
                <>
                  <p>{customer.line1}</p>
                  {customer.line2 && <p>{customer.line2}</p>}
                  <p>
                    {customer.city}
                    {customer.state ? `, ${customer.state}` : ""}{" "}
                    {customer.postalCode}
                  </p>
                  <p>{customer.country}</p>
                </>
              )}
            </section>

            <section className="co-confirm-wide">
              <h2>Preferences</h2>
              <p>Delivery: {isPickup ? "Pickup" : "Ship"}</p>
              <p>Contact via {customer.contact}</p>
              <p>Payment: {customer.payment}</p>
              {customer.notes && <p>Notes: {customer.notes}</p>}
            </section>
          </div>

          <p className="co-confirm-note">
            The current order service records the items, quantities, email and
            notes. Shipping and payment preferences are shown for this
            confirmation only and are not yet stored with the order.
          </p>

          <Link href="/products" className="btn btn-primary">
            Browse more equipment
          </Link>
        </div>
      </div>
    </main>
  );
}