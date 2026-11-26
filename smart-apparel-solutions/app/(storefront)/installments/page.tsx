"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import config from "@/config";
import { fetchProducts } from "@/lib/api/catalog";
import { formatCurrency } from "@/lib/utils/helpers";
import type { Product } from "@/types";

export default function InstallmentsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setError("Unable to load current installment-eligible products."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const eligibleProducts = products.filter((product) => product.installment);

  return (
    <main className="page-shell">
      <div className="container">
        <div className="page-heading">
          <p className="eyebrow">Flexible payments</p>
          <h1>Spread your machine investment with Koko</h1>
          <p>
            Selected equipment can be paid in three installments. We will
            confirm eligibility and the exact schedule before your order is
            processed.
          </p>
        </div>
        <div className="installment-grid">
          <div className="page-card"><strong>3 equal installments</strong><p>Make your production upgrade easier to plan with transparent monthly pricing.</p></div>
          <div className="page-card"><strong>No complicated quoting</strong><p>Add equipment to your quotation cart and ask our team to confirm the Koko option.</p></div>
          <div className="page-card"><strong>Local support</strong><p>Our Colombo team can help with product selection, delivery and after-sales questions.</p></div>
        </div>
        <section className="page-card installment-table">
          <h2>Example eligible products</h2>
          {isLoading ? <p role="status">Loading current product data...</p> : null}
          {error ? <p className="form-feedback form-error" role="alert">{error}</p> : null}
          {!isLoading && !error && !eligibleProducts.length ? <p>No installment eligibility is available in the live product data.</p> : null}
          {!isLoading && !error ? eligibleProducts.slice(0, 6).map((product) => (
            <div key={product.id}>
              <span>{product.name}</span>
              <strong>{formatCurrency(product.installment?.perMonth ?? 0)} / month</strong>
            </div>
          )) : null}
        </section>
        <p>Questions? Call {config.phone} or <a className="link-arrow whatsapp-text-link" href={config.whatsappUrl}><Image src="/images/social/whatsapp.png" alt="" width={16} height={16} /> message us on WhatsApp</a>.</p>
      </div>
    </main>
  );
}
