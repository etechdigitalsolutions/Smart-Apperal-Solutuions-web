export default function ProductForm() {
  return (
    <div className="empty-state" role="status">
      <h2>Product changes are unavailable</h2>
      <p>
        The backend can create item records but does not provide verified
        product update or batch-pricing operations. Creating or editing a
        listing here could leave it without a valid price.
      </p>
    </div>
  );
}
