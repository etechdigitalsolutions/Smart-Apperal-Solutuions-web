"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AccountPanel from "@/components/account/AccountPanel";
import { customerService } from "@/services/customerService";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      customerService.getOrderDetail(id),
      customerService.getOrderHistory(id),
    ])
      .then(([orderResult, historyResult]) => {
        if (!orderResult.success || !Array.isArray(orderResult.data)) {
          throw new Error(orderResult.message || "Unable to load this order.");
        }
        if (!historyResult.success || !Array.isArray(historyResult.data)) {
          throw new Error(
            historyResult.message || "Unable to load order tracking history.",
          );
        }
        if (active) {
          setOrder(orderResult.data[0] ?? null);
          setHistory(historyResult.data);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load this order.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const reference = order
    ? String(order.order_reference ?? order.reference ?? id)
    : id;

  return (
    <AccountPanel
      title={`Order ${reference}`}
      description="Your order and delivery status."
    >
      {isLoading ? <p role="status">Loading order details...</p> : null}
      {error ? (
        <p className="form-feedback form-error" role="alert">
          {error}
        </p>
      ) : null}
      {!isLoading && !error && !order ? (
        <div className="empty-state" role="status">
          <h2>Order not found</h2>
          <Link href="/account/orders">Back to order history</Link>
        </div>
      ) : null}
      {order ? (
        <section className="account-card">
          <h2>Status: {String(order.status ?? "Processing")}</h2>
          <p>Reference: {reference}</p>
          <h3>Tracking history</h3>
          {history.length ? (
            <ol>
              {history.map((entry, index) => (
                <li key={String(entry.history_id ?? `${entry.created_at}-${index}`)}>
                  <strong>{String(entry.status ?? "Update")}</strong>
                  {entry.message ? <p>{String(entry.message)}</p> : null}
                  {entry.created_at ? (
                    <time>{new Date(String(entry.created_at)).toLocaleString()}</time>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p>No tracking updates have been added to this order.</p>
          )}
        </section>
      ) : null}
    </AccountPanel>
  );
}
