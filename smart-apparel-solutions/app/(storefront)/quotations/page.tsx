"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils/helpers";
import { fetchProducts } from "@/lib/api/catalog";
import type { Product } from "@/types";

export default function QuotationPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submissionError, setSubmissionError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => { if (active) setLiveProducts(items); })
      .catch(() => { if (active) setLoadError("Unable to load current products for a quotation."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const sourceProducts = liveProducts;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError(true);
  }

  return (
    <main className="page-shell">
      <div className="container quotation-layout">
        <div className="page-heading">
          <p className="eyebrow">Request pricing</p>
          <h1>Quotation request</h1>
          <p>Select products and quantities. No payment is required to submit a request.</p>
        </div>
        <form className="page-card quotation-form" onSubmit={submit}>
          <div className="form-grid">
            <label>Name<input name="name" required defaultValue={user?.name ?? ""} /></label>
            <label>Phone<input name="phone" required type="tel" /></label>
            <label className="form-span-two">Email<input name="email" required type="email" defaultValue={user?.email ?? ""} /></label>
            <label className="form-span-two">Additional notes<textarea name="notes" rows={4} /></label>
          </div>
          <div className="quotation-products">
            {isLoading ? <p role="status">Loading current products...</p> : null}
            {loadError ? <p className="form-feedback form-error" role="alert">{loadError}</p> : null}
            {!isLoading && !loadError && !sourceProducts.length ? <p>No products are currently available.</p> : null}
            {sourceProducts.slice(0, 8).map((product) => (
              <label key={product.id} className="quotation-product">
                <span><strong>{product.name}</strong><small>{formatCurrency(product.price)}</small></span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={selected[product.id] ?? 0}
                  onChange={(event) => setSelected((current) => ({ ...current, [product.id]: Math.max(0, Number(event.target.value)) }))}
                  aria-label={`Quantity for ${product.name}`}
                />
              </label>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading || Boolean(loadError) || !sourceProducts.length}>Submit quotation request</button>
          {submissionError ? <div className="form-feedback form-error" role="alert">Quotation submission is unavailable because no quotation backend endpoint is implemented. Your request was not saved.</div> : null}
        </form>
        {user ? <Link href="/account/quotations" className="link-arrow">View my quotation history →</Link> : null}
      </div>
    </main>
  );
}
