"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccountPanel from "@/components/account/AccountPanel";
import { customerService } from "@/services/customerService";

type CustomerOrder = Record<string, unknown>;

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    customerService
      .getOrders()
      .then((result) => {
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Unable to load your orders.");
        }
        if (active) setOrders(result.data);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your orders.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AccountPanel
      title="My orders"
      description="Track quotations, deliveries and your complete order history."
    >
      {isLoading ? <p role="status">Loading your orders...</p> : null}
      {error ? (
        <p className="form-feedback form-error" role="alert">
          {error}
        </p>
      ) : null}
      {!isLoading && !error && !orders.length ? (
        <div className="empty-state" role="status">
          <h2>No orders yet</h2>
          <p>Orders placed from your customer account will appear here.</p>
          <Link href="/products" className="btn btn-primary">
            Browse equipment
          </Link>
        </div>
      ) : null}
      {!isLoading && !error && orders.length ? (
        <div className="account-card">
          {orders.map((order) => {
            const id = String(
              order.website_order_id ?? order.order_id ?? order.id ?? "",
            );
            const reference = String(
              order.order_reference ?? order.reference ?? id,
            );
            const createdAt = String(order.created_at ?? "");
            return (
              <article key={id} className="account-form-grid">
                <div>
                  <h2>{reference}</h2>
                  <p>Status: {String(order.status ?? "Processing")}</p>
                  <p>
                    {createdAt
                      ? new Date(createdAt).toLocaleDateString()
                      : "Date unavailable"}
                  </p>
                </div>
                <Link
                  href={`/account/orders/${encodeURIComponent(id)}`}
                  className="btn btn-outline"
                >
                  View order
                </Link>
              </article>
            );
          })}
        </div>
      ) : null}
    </AccountPanel>
  );
}
