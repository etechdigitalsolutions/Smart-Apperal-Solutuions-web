"use client";

import { FormEvent, useState } from "react";

export default function ProductForm() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          description: String(data.get("description") ?? ""),
          unit: "piece",
          current_stock: Number(data.get("stock") ?? 0),
          reorder_level: 0,
          status: "Active",
          item_code: String(data.get("name") ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
          created_by: "admin",
          updated_by: "admin",
        }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean; message?: string } | null;
      if (!response.ok || !result?.success) throw new Error(result?.message || "Unable to save the product.");
      setSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save the product.");
    }
  }

  if (saved) {
    return <div className="success-panel"><h2>Product saved</h2><p>The SmartStock catalogue has been updated.</p></div>;
  }

  return (
    <form className="page-card form-grid admin-form" onSubmit={submit}>
      <label>Product name<input name="name" required placeholder="Industrial machine name" /></label>
      <label>Brand<input name="brand" required placeholder="Brand" /></label>
      <label>Price<input name="price" required type="number" min="0" placeholder="0" /></label>
      <label>Stock<input name="stock" required type="number" min="0" placeholder="0" /></label>
      <label className="form-span-two">Description<textarea name="description" required placeholder="Describe the operation and ideal use case" /></label>
      <label>Category<select name="category"><option>Sewing Machines</option><option>Cutting</option><option>Ironing &amp; Finishing</option><option>Spare Parts</option></select></label>
      <label>Stock status<select name="stockStatus"><option>In stock</option><option>Pre-order</option><option>Out of stock</option></select></label>
      {error ? <p className="form-error form-span-two" role="alert">{error}</p> : null}
      <button className="btn btn-primary" type="submit">Save product</button>
    </form>
  );
}
