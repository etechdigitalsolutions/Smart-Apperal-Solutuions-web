import AdminPanel from "@/components/admin/AdminPanel";
export default function AdminUsersPage() {
  return (
    <AdminPanel title="Customers" description="Review customer accounts and support conversations.">
      <div className="empty-state" role="status">
        <h2>Customer management is unavailable</h2>
        <p>The backend does not provide a verified customer listing or role-management API.</p>
      </div>
    </AdminPanel>
  );
}
