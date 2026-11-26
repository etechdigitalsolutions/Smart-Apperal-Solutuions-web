import AdminPanel from "@/components/admin/AdminPanel";
export default function AnalyticsPage() {
  return (
    <AdminPanel title="Analytics" description="Understand what customers are comparing and where support is needed.">
      <div className="empty-state" role="status">
        <h2>Analytics are unavailable</h2>
        <p>The backend does not provide verified analytics or reporting data for this page.</p>
      </div>
    </AdminPanel>
  );
}
