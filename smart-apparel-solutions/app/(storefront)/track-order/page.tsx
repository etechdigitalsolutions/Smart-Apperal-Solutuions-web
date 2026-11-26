"use client";

import { useState } from "react";

export default function TrackOrderPage() {
  const [unavailable, setUnavailable] = useState(false);
  return <main className="page-shell"><div className="container narrow-content"><div className="page-heading"><p className="eyebrow">Delivery updates</p><h1>Track your order</h1><p>Enter the reference number from your quotation or delivery confirmation.</p></div><form className="tracking-form page-card" onSubmit={(event) => { event.preventDefault(); setUnavailable(true); }}><label>Order reference<input required placeholder="SAS-000123" /></label><label>Phone number<input required placeholder="07x xxx xxxx" /></label><button className="btn btn-primary" type="submit">Check status</button></form>{unavailable ? <div className="form-feedback form-error" role="alert"><h2>Order tracking is unavailable</h2><p>The backend does not provide an order-status lookup. Please contact our team for an update.</p></div> : null}</div></main>;
}
