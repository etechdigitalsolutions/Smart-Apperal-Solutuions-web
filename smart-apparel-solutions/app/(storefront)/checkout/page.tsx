"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import CheckoutForm, {
  type CheckoutFormData,
} from "@/components/storefront/checkout/CheckoutForm";
import CheckoutSummary from "@/components/storefront/checkout/CheckoutSummary";
import { useCart } from "@/hooks/useCart";

import { orderService } from "@/services/orderService";

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const shellRef = useRef<HTMLElement>(null);
  const hasItems = items.length > 0;


  // Keeps the fixed summary just below the header: it starts under the
  // header block, then follows the sticky header while the page scrolls.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const header = document.querySelector<HTMLElement>(".site-header");

    const updateTop = () => {
      const shellTop = shell.getBoundingClientRect().top;
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      shell.style.setProperty(
        "--checkout-top",
        `${Math.max(shellTop, headerBottom, 0)}px`
      );
    };

    updateTop();
    window.addEventListener("scroll", updateTop, { passive: true });
    window.addEventListener("resize", updateTop);

    return () => {
      window.removeEventListener("scroll", updateTop);
      window.removeEventListener("resize", updateTop);
    };
  }, [hasItems]);


async function handleCheckout(data: CheckoutFormData) {
  if (items.length === 0 || isSubmitting) return;

  setIsSubmitting(true);

  try {
    const apiResult = await orderService.create({
      website: "",
      email: data.email,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      notes: data.notes,
    });

    if (!apiResult.success) {
      throw new Error(apiResult?.message || "Unable to create your order.");
    }

    if (!apiResult.reference) {
      throw new Error("The order service did not return an order reference.");
    }

    sessionStorage.setItem("checkoutDetails", JSON.stringify(data));
    sessionStorage.setItem("orderReference", apiResult.reference);

    router.push("/checkout/confirmation");
  } catch (error) {
    setCheckoutError(error instanceof Error ? error.message : "Unable to submit your checkout.");
    setIsSubmitting(false);
  }
}



  if (items.length === 0) {
    return (
      <main className="page-shell">
        <div className="container narrow-content">
          <div className="page-heading">
            <p className="eyebrow">Quotation cart</p>
            <h1>Tell us where to send your setup</h1>
            <p>Your cart is empty. Add products before requesting a quotation.</p>
          </div>
          <Link href="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-shell" ref={shellRef}>
      <div className="checkout-main">
        <div className="checkout-main-inner">
          <header className="checkout-intro">
            <div className="checkout-home-link">
              <Link href="/">
                <span aria-hidden="true">←</span>
                Back to Home
              </Link>
            </div>
            <p className="eyebrow">Quotation cart</p>
            <h1>Tell us where to send your setup</h1>
            <p>
              There is no payment obligation. We will confirm availability
              and delivery before you commit.
            </p>
          </header>

          {checkoutError ? (
            <div className="form-feedback form-error" role="alert">
              {checkoutError}
            </div>
          ) : null}

          <CheckoutForm
            onSubmit={handleCheckout}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <aside className="checkout-aside">
        <div className="checkout-aside-inner">
          <CheckoutSummary
          />
          <p className="co-aside-note">
            Delivery and final pricing will be confirmed by the sales team.
          </p>
        </div>
      </aside>
    </main>
  );
}