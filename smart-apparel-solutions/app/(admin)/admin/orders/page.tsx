import AdminPanel from "@/components/admin/AdminPanel";
export default function AdminOrdersPage() {
  return (
    <AdminPanel title="Quotation orders" description="Follow up on open customer requests and delivery commitments.">
      <div className="empty-state" role="status">
        <h2>Order management is unavailable</h2>
        <p>The backend does not provide order listing, customer ownership, or status-update APIs.</p>
      </div>
    </AdminPanel>
  );
}
