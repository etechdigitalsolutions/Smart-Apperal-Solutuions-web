import AdminPanel from "@/components/admin/AdminPanel";
interface Props { params: Promise<{ id: string }>; }
export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminPanel title={`Customer ${id}`} description="Review contact details and account activity.">
      <div className="empty-state" role="status">
        <h2>Customer details are unavailable</h2>
        <p>The backend does not provide a verified customer lookup or support-note API.</p>
      </div>
    </AdminPanel>
  );
}
