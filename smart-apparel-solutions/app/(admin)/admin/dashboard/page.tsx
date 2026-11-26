import AdminPanel from "@/components/admin/AdminPanel";
export default function AdminDashboardPage() {
  return (
    <AdminPanel title="Operations dashboard" description="A quick view of catalogue health, quotation activity and service workload.">
      <div className="empty-state" role="status">
        <h2>Operational statistics are unavailable</h2>
        <p>The backend does not provide verified dashboard metrics, quotation counts, or service workload data.</p>
      </div>
    </AdminPanel>
  );
}
