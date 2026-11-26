import AdminPanel from "@/components/admin/AdminPanel";
export default function AdminSettingsPage() {
  return (
    <AdminPanel title="Store settings" description="Control the details customers see across the storefront.">
      <div className="empty-state" role="status">
        <h2>Store settings are unavailable</h2>
        <p>The backend does not provide a store-settings read or update API.</p>
      </div>
    </AdminPanel>
  );
}
