"use client";

import AccountPanel from "@/components/account/AccountPanel";

export default function InquiriesPage() {
  return (
    <AccountPanel title="My inquiries" description="Review service and repair requests submitted to our team.">
      <div className="empty-state" role="status">
        <h2>Inquiry history is unavailable</h2>
        <p>The backend does not provide an inquiry submission or listing API.</p>
      </div>
    </AccountPanel>
  );
}
