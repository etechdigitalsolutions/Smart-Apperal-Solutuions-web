import AccountPanel from "@/components/account/AccountPanel";
interface Props { params: Promise<{ id: string }>; }
export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <AccountPanel title={`Order ${id}`} description="Your quotation and delivery status.">
      <div className="empty-state" role="status">
        <h2>Order details are unavailable</h2>
        <p>The backend does not provide order lookup or status APIs.</p>
      </div>
    </AccountPanel>
  );
}
