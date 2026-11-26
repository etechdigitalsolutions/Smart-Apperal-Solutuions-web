import AccountPanel from "@/components/account/AccountPanel";
export default function OrdersPage() {
  return (
    <AccountPanel title="My orders" description="Track quotations, deliveries and your complete order history.">
      <div className="empty-state" role="status">
        <h2>Order history is unavailable</h2>
        <p>The backend supports order creation but does not provide customer order listing or status APIs.</p>
      </div>
    </AccountPanel>
  );
}
