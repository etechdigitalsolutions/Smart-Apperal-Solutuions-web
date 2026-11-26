"use client";

import AccountPanel from "@/components/account/AccountPanel";

export default function QuotationHistoryPage() {
  return (
    <AccountPanel title="My quotations" description="View quotation requests and their current status.">
      <div className="empty-state" role="status">
        <h2>Quotation history is unavailable</h2>
        <p>The backend does not provide quotation creation or listing APIs.</p>
      </div>
    </AccountPanel>
  );
}
