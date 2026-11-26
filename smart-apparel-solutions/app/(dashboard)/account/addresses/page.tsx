import AccountPanel from "@/components/account/AccountPanel";

export default function AddressesPage() {
  return (
    <AccountPanel
      title="Saved addresses"
      description="Manage the places where your equipment and parts should arrive."
    >
      <div className="empty-state" role="status">
        <h2>Address management is unavailable</h2>
        <p>
          The backend does not currently provide customer address storage. No
          saved addresses are displayed or created locally.
        </p>
      </div>
    </AccountPanel>
  );
}
