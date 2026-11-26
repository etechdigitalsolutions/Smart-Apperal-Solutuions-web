import AdminPanel from "@/components/admin/AdminPanel";
interface Props { params: Promise<{ id: string }>; }
export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminPanel title={`Order ${id}`} description="Review order details and update the customer.">
      <div className="empty-state" role="status">
        <h2>Order details are unavailable</h2>
        <p>The backend does not provide order lookup or status-update APIs.</p>
      </div>
    </AdminPanel>
  );
}
