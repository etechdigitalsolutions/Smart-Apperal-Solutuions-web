# Smart Apparel Solutions - Remaining Backend Requirements

## Scope and evidence status

This document compares the frontend, Next.js API route implementation, local/static data, Postman collection, and available backend configuration. No separate backend application, Supabase migration directory, SQL migration files, or ORM schema files are present in this workspace.

Status labels used below:

- **Confirmed missing**: frontend behavior or API route is clearly not backed by persistent implementation.
- **Confirmed incomplete**: a backend proxy or route exists, but it is partial or unsafe.
- **Backend unverified**: frontend bindings or the Postman collection indicate a Supabase resource exists, but its exact SQL schema, RLS policies, RPC implementation, and production behavior are not available in the workspace.
- **Assumption**: a database/API change may be required, but the current frontend scope does not prove the exact schema.

The existing Supabase URL and key values must not be added to this document or to source files.

## 1. Existing backend summary

The implemented integration is a Next.js server-side proxy into Supabase/PostgREST:

- `app/api/products/route.ts` reads and creates `items`, with category, brand, sub-brand, batch, and stock-summary aggregation.
- `app/api/categories/route.ts` reads active `categories`.
- `app/api/search/route.ts` searches active `items` by name.
- `app/api/auth/route.ts` connects register, login, verify-token, password-reset, and change-password actions to Supabase RPC functions.
- `app/api/orders/route.ts` performs server-side item lookup and retail-price verification, creates `invoices`, and creates `invoice_items`.
- `app/api/smartstock/[...path]/route.ts` provides an allowlisted pass-through to selected PostgREST tables and RPC endpoints.
- The Postman collection documents many SmartStock resources, including users, items, batches, categories, customers, invoices, invoice items, payments, reports, notifications, and stock RPC functions.
- Supabase access is centralized in `lib/supabase-server.ts` using server-only imports.

The following are not evidence of an existing backend implementation:

- `app/api/cart/route.ts`: placeholder responses only.
- `app/api/upload/route.ts`: always returns an empty URL.
- `app/api/users/route.ts`: always returns an empty list.
- `app/api/analytics/route.ts`: always returns an empty analytics object.
- `app/api/blog/route.ts`: placeholder create/list responses only.
- Several admin pages contain hardcoded dashboard, order, user, and analytics data.
- Account profile, addresses, settings, wishlist, inquiries, quotations, and order history persist locally or use hardcoded values.

## 2. Remaining backend features

### 2.1 Persistent cart and cart synchronization

- **Status:** Confirmed missing
- **What exists:** Browser-local cart reducer and `localStorage`; placeholder `/api/cart` methods.
- **Missing:** Server-side or authenticated database cart, merge guest cart on login, quantity update, removal, stock validation, and cross-device synchronization.
- **Why needed:** Cart items can be lost across devices or stale prices/stock can change before checkout.
- **Frontend:** `hooks/useCart.tsx`, `store/slices/cartSlice.ts`, cart page, checkout page.
- **Existing API:** `/api/cart` exists only as placeholders.

### 2.2 Wishlist persistence

- **Status:** Confirmed missing
- **What exists:** `WishlistContext` stores product IDs in `localStorage`.
- **Missing:** User-owned wishlist CRUD, login merge, ownership checks, and live product availability.
- **Why needed:** Wishlist is account-specific but currently exists only in one browser.
- **Frontend:** `context/WishlistContext.tsx`, account wishlist, account overview, product cards/detail.
- **Existing API:** No implemented endpoint.

### 2.3 Saved addresses

- **Status:** Confirmed missing
- **What exists:** Hardcoded initial address; React state add/delete/set-default behavior.
- **Missing:** Address persistence, update, delete, default-address constraints, and user ownership validation.
- **Why needed:** Checkout and future shipping calculations require the saved address set.
- **Frontend:** `app/(dashboard)/account/addresses/page.tsx`.
- **Existing API:** No implemented endpoint.

### 2.4 Customer profile and avatars

- **Status:** Confirmed missing
- **What exists:** Profile UI with `localStorage` name, phone, and data-URL avatar.
- **Missing:** Persistent profile fields, avatar Storage upload, profile update, account deletion, and server-side authorization.
- **Why needed:** Account data cannot survive browser changes or be used for order/contact records.
- **Frontend:** account profile and account settings.
- **Existing API:** No implemented endpoint.

### 2.5 Account notification preferences

- **Status:** Confirmed missing
- **What exists:** Email/WhatsApp preference checkboxes stored in `localStorage`.
- **Missing:** User preference persistence and notification preference enforcement.
- **Why needed:** Preferences should govern future order, quotation, and service notifications.
- **Frontend:** account settings.
- **Existing API:** No implemented endpoint.

### 2.6 User authentication hardening

- **Status:** Confirmed incomplete
- **What exists:** Custom RPC login/register/password actions and browser-side user storage.
- **Missing:** Verified session/token lifecycle, secure token storage/verification, server authorization middleware, logout revocation, forgot-password email flow, and account ownership checks.
- **Why needed:** Storing a normalized user object in browser storage does not prove identity to protected backend endpoints.
- **Frontend:** login, register, forgot-password, reset-password, account routes.
- **Existing API:** `POST /api/auth`.

### 2.7 Account order history and order detail

- **Status:** Confirmed missing
- **What exists:** Hardcoded account order list/details and browser-local saved checkout orders.
- **Missing:** Customer order query, order detail, ownership filtering, cancellation rules, status history, and tracking lookup.
- **Why needed:** `GET /api/orders` is explicitly unimplemented and account pages cannot retrieve the customer's actual invoices.
- **Frontend:** account orders, order detail, checkout confirmation.
- **Existing API:** `POST /api/orders` partial implementation; `GET /api/orders` returns 501.

### 2.8 Atomic order creation and stock deduction

- **Status:** Confirmed incomplete
- **What exists:** Item price verification, invoice creation, and invoice-item creation.
- **Missing:** Database transaction, FIFO/batch allocation, stock reservation/deduction, customer/address/payment persistence, duplicate-submission protection, and rollback when a line item fails.
- **Why needed:** The current implementation can leave an invoice with no complete invoice items and does not synchronize batch stock.
- **Frontend:** checkout.
- **Existing API:** `POST /api/orders`.

### 2.9 Server-authoritative promo and discount validation

- **Status:** Confirmed incomplete
- **What exists:** Frontend-only `SAS10` and `SAS500` rules.
- **Missing:** Database coupon records, active-date/usage rules, customer eligibility, server recalculation, and one-time usage validation.
- **Why needed:** Browser-calculated totals can be tampered with; `POST /api/orders` currently ignores the submitted promo as a backend source of truth.
- **Frontend:** checkout, promo summary.
- **Existing API:** `POST /api/orders`.

### 2.10 Checkout and account creation linkage

- **Status:** Confirmed incomplete
- **What exists:** Checkout gathers full name, address, billing, delivery, payment, and account creation fields.
- **Missing:** Backend persistence of shipping/billing, delivery/pickup, payment choice, guest/customer distinction, optional account creation, and customer table linkage.
- **Why needed:** Checkout sends only a subset of form data and the invoice omits most checkout details.
- **Frontend:** checkout form and confirmation.
- **Existing API:** `POST /api/orders`.

### 2.11 Payment processing and verification

- **Status:** Confirmed missing
- **What exists:** Payment method labels including cards, bank transfer, cheque, cash, and Koko.
- **Missing:** Provider sessions, redirect/callback handling, signed webhook verification, payment status, refund handling, and provider-specific reconciliation.
- **Why needed:** Selecting a payment method is not payment processing.
- **Frontend:** checkout.
- **Existing API:** No payment endpoints. Supabase `payments` is indicated by the Postman collection, but endpoint behavior is unverified.

### 2.12 Order tracking

- **Status:** Confirmed missing
- **What exists:** Tracking form UI and a frontend success message.
- **Missing:** Reference lookup, phone verification, current status, tracking number, status history, and privacy-safe rate limiting.
- **Why needed:** The form does not call an API.
- **Frontend:** track-order.
- **Existing API:** No implemented endpoint.

### 2.13 Quotation requests

- **Status:** Confirmed missing
- **What exists:** Product selection and live/fallback product prices; browser-local quotation records and account history.
- **Missing:** Persisted quotation/customer data, line items, server-side price snapshot, status workflow, admin response/pricing, and duplicate prevention.
- **Why needed:** A submitted quotation is not sent to Supabase.
- **Frontend:** quotation page and account quotation history.
- **Existing API:** No implemented endpoint.

### 2.14 Service/repair inquiries

- **Status:** Confirmed missing
- **What exists:** Browser-local inquiry records, client-side image previews, and account inquiry history.
- **Missing:** Inquiry persistence, server upload, image Storage, status updates, admin assignment, and guest/customer ownership.
- **Why needed:** Inquiry submissions disappear with browser data and upload URLs are not server-provided.
- **Frontend:** services/repair and account inquiries.
- **Existing API:** No implemented endpoint.

### 2.15 Contact and Mahamu inquiries

- **Status:** Confirmed missing
- **What exists:** Frontend-only demo submissions with artificial delay.
- **Missing:** Server endpoint, persisted inquiry type, spam controls, validation, and notifications.
- **Why needed:** Contact and production-planning requests produce no server record.
- **Frontend:** contact page, Mahamu page.
- **Existing API:** No implemented endpoint.

### 2.16 Image uploads

- **Status:** Confirmed incomplete
- **What exists:** Placeholder `/api/upload`, client-side image type/size validation and data-URL previews.
- **Missing:** Supabase Storage integration, server MIME/size validation, private/public bucket policy, cleanup, and ownership metadata.
- **Why needed:** Profile and inquiry uploads require durable, validated storage.
- **Frontend:** profile, inquiry, and account UI.
- **Existing API:** `POST /api/upload` only.

### 2.17 Product administration

- **Status:** Confirmed incomplete
- **What exists:** Product create UI and `/api/products` POST pass-through.
- **Missing:** Admin authorization, update/delete endpoints, category/brand/sub-brand/batch mapping, price updates, images, variants, and stock integrity.
- **Why needed:** Edit links and category/brand/price/stock fields exist in the UI but are not represented in a validated server mutation contract.
- **Frontend:** admin product list, add product, edit route.
- **Existing API:** Product POST exists; PUT/DELETE routes are not present.

### 2.18 Product variants and model options

- **Status:** Backend unverified
- **What exists:** Cart supports optional `size` and `color`, but product types have no variant model and UI checkout does not expose variants.
- **Missing:** Confirm whether Supabase items/batches support variants/SKU combinations or whether variant tables are required.
- **Why needed:** Current stock and cart keys do not consistently prove which variant was purchased.
- **Frontend:** cart types/reducer, product cards/detail.
- **Existing API:** Items/batches are read, but variant behavior is unverified.

### 2.19 Admin order, customer, inventory, and analytics operations

- **Status:** Confirmed missing
- **What exists:** Admin dashboard, orders, users, inventory, and analytics UI; inventory uses live products with static fallback.
- **Missing:** Live order/customer/stock/analytics queries, status updates, user management, and role authorization.
- **Why needed:** Admin pages currently show hardcoded values or live-only subset data.
- **Frontend:** all `app/(admin)/admin/**` pages.
- **Existing API:** `GET /api/orders` 501; users/analytics placeholders; generic smartstock proxy may expose some resources but admin authorization is unverified.

### 2.20 Blog and website content administration

- **Status:** Confirmed incomplete
- **What exists:** Static blog data and placeholder `/api/blog`.
- **Missing:** Blog content persistence and admin CRUD only if a CMS is intended.
- **Why needed:** Blog posts cannot be managed through the live backend.
- **Frontend:** blog listing/detail and placeholder API.
- **Existing API:** `/api/blog` placeholders.

### 2.21 Newsletter and notification capture

- **Status:** Confirmed missing
- **What exists:** Footer subscription UI may render a field.
- **Missing:** Subscription endpoint, consent, duplicate prevention, unsubscribe management, and email/WhatsApp opt-in storage.
- **Why needed:** The footer action has no confirmed server binding.
- **Frontend:** footer.
- **Existing API:** No implemented endpoint.

### 2.22 Rate limits, abuse prevention, and error observability

- **Status:** Confirmed missing
- **What exists:** Honeypot and 16 KB body limit in order submission.
- **Missing:** General rate limiting, login throttling, CAPTCHA or equivalent, audit logs, structured backend logging, and retry-safe error responses.
- **Why needed:** Public auth, checkout, and inquiry endpoints are exposed to automated abuse.
- **Frontend:** checkout and auth/inquiry forms.
- **Existing API:** `/api/auth`, `/api/orders`, future public inquiry endpoints.

## 3. Remaining API requirements

### POST /api/cart/sync

- **Purpose:** Persist or merge guest cart items for an authenticated customer.
- **Request:**
  ```json
  {
    "items": [
      { "productId": "123", "quantity": 2, "size": null, "color": null }
    ]
  }
  ```
- **Response:** `{ "success": true, "items": [], "merged": true }`
- **Authentication:** Optional for guest merge; authenticated for server cart.
- **Validation:** Positive integers, unique variant key, known product, quantity limit, stock availability.
- **Backend logic:** Revalidate prices/stock, merge guest and account cart, remove stale items, return authoritative cart.
- **Database:** Add persistent cart/cart_items or document that `/api/cart` is guest-only.

### GET /api/orders and GET /api/orders/{id}

- **Purpose:** List customer-owned orders and retrieve one order.
- **Request:** Query `status`, `page`, `limit`; path order ID/reference.
- **Response:** `{ "success": true, "data": [], "total": 0 }`
- **Authentication:** Required for customer and admin views.
- **Validation:** Pagination bounds, valid status, valid reference/ID.
- **Backend logic:** Resolve authenticated user to customer; filter ownership; admin role bypass with authorization.
- **Database:** Confirm `invoices`, `invoice_items`, customer linkage, and status columns; add order status history if required.

### PATCH /api/orders/{id}/status

- **Purpose:** Update order/quotation status.
- **Request:** `{ "status": "processing", "trackingNumber": "", "message": "" }`
- **Response:** `{ "success": true, "data": { "id": "...", "status": "processing" } }`
- **Authentication:** Admin only.
- **Validation:** Allowed transition, required tracking fields, status reason.
- **Backend logic:** Validate role and transition, add audit record, trigger customer notification.
- **Database:** Invoice/order status enum/check constraint and status-history table.

### POST /api/orders (modification)

- **Purpose:** Complete existing checkout implementation.
- **Request:** Add shipping/billing/customer/address/delivery/payment fields and stop trusting a browser-supplied discount total.
- **Response:** Include invoice ID, authoritative subtotal/discount/total, payment status, and reference.
- **Authentication:** Optional guest; required if account creation or existing customer linkage is selected.
- **Validation:** Email/phone/address, allowed delivery/payment, coupon, stock, line-item existence, positive quantities, idempotency key.
- **Backend logic:** Server transaction for price/coupon/stock, invoice and line-item creation, optional account/customer creation, stock deduction/reservation, duplicate prevention.
- **Database:** Customer/address/order, coupon, payment, and status fields; RPC transaction.

### GET /api/orders/track

- **Purpose:** Public/private order tracking.
- **Request:** `{ "reference": "SAS-...", "phone": "..." }`
- **Response:** `{ "success": true, "data": { "reference": "", "status": "", "trackingNumber": "", "message": "" } }`
- **Authentication:** No account session; verify reference plus normalized phone or a signed tracking token.
- **Validation:** Reference format, phone, rate limit.
- **Backend logic:** Constant-time ownership check, do not return unrelated order details.
- **Database:** Tracking/status fields and status history.

### POST /api/payments/{provider}/session

- **Purpose:** Start a provider-hosted or card checkout.
- **Request:** `{ "orderId": "...", "amount": 1000, "currency": "LKR" }`
- **Response:** `{ "success": true, "checkoutUrl": "...", "providerReference": "..." }`
- **Authentication:** Customer or guest session tied to order.
- **Validation:** Order belongs to caller, order is unpaid, provider/currency allowlist.
- **Backend logic:** Create server-calculated provider session and store pending provider reference.
- **Database:** `payments` provider fields and unique provider reference.

### POST /api/payments/{provider}/webhook

- **Purpose:** Reconcile provider callbacks.
- **Request:** Provider-specific signed payload.
- **Response:** Provider-expected success response.
- **Authentication:** Cryptographic signature and replay protection.
- **Validation:** Signature, timestamp, event, provider reference, amount/currency.
- **Backend logic:** Verify, deduplicate event, atomically update payment and order status.
- **Database:** Payment events table or unique webhook event key.

### POST /api/coupons/validate

- **Purpose:** Preview a promo code.
- **Request:** `{ "code": "SAS10", "items": [{ "productId": "123", "quantity": 2 }] }`
- **Response:** `{ "success": true, "code": "SAS10", "discount": 500, "subtotal": 5000, "total": 4500 }`
- **Authentication:** Optional guest; required for customer-restricted coupons.
- **Validation:** Code format, item IDs/quantities, validity dates, usage, minimum subtotal.
- **Backend logic:** Recalculate server-side from live prices and coupon rules.
- **Database:** Add coupon, coupon_usage, and eligibility data.

### GET/POST/PATCH/DELETE /api/wishlist

- **Purpose:** Persist wishlist and synchronize one user's shortlist.
- **Request:** POST/PATCH product ID and variant key; DELETE product ID.
- **Response:** `{ "success": true, "items": ["..."] }`
- **Authentication:** Required.
- **Validation:** Known product/variant, duplicate prevention.
- **Backend logic:** Ownership check and guest-cart merge after login.
- **Database:** `wishlist_items` with unique customer/product/variant.

### GET/POST/PATCH/DELETE /api/addresses

- **Purpose:** Manage customer saved addresses.
- **Request:** label, full name, line 1/2, city, postal code, country, phone, default flag.
- **Response:** `{ "success": true, "data": {} }`
- **Authentication:** Required.
- **Validation:** Country/city allowlist, max lengths, phone/email format.
- **Backend logic:** Enforce one default address and owner-only access.
- **Database:** `customer_addresses` and default-address constraint/index.

### GET/PATCH/DELETE /api/account/profile

- **Purpose:** Read/update customer profile and delete account data.
- **Request:** name, phone, avatar object.
- **Response:** `{ "success": true, "data": { "name": "", "email": "", "phone": "" } }`
- **Authentication:** Required.
- **Validation:** Name/phone/email constraints, avatar ownership.
- **Backend logic:** Update only the authenticated user's profile; account deletion must define retained order/legal records.
- **Database:** Profile fields linked to the custom users/customer model or Supabase Auth.

### GET/PATCH /api/account/preferences

- **Purpose:** Store email and WhatsApp notification preferences.
- **Request:** `{ "emailUpdates": true, "whatsappUpdates": true }`
- **Response:** `{ "success": true, "data": {} }`
- **Authentication:** Required.
- **Validation:** Boolean fields and consent version.
- **Backend logic:** Persist preferences and prevent unauthorized updates.
- **Database:** `customer_preferences` or columns on the customer record.

### POST /api/quotations

- **Purpose:** Create a persisted quotation.
- **Request:**
  ```json
  {
    "name": "Customer",
    "email": "customer@example.com",
    "phone": "",
    "items": [{ "productId": "123", "quantity": 2 }],
    "notes": ""
  }
  ```
- **Response:** `{ "success": true, "reference": "QT-...", "status": "Pending" }`
- **Authentication:** Optional guest; associated if authenticated.
- **Validation:** Name, email, phone, positive quantities, known products, max items.
- **Backend logic:** Generate reference, snapshot server-calculated prices/availability, insert parent and line items, prevent rapid duplicates.
- **Database:** `quotations` and `quotation_items`.

### GET /api/quotations and GET/PATCH /api/quotations/{id}

- **Purpose:** Customer history/detail and admin status/pricing updates.
- **Request:** Filter/page query or `{ "status": "", "unitPrice": 0, "message": "" }`.
- **Response:** Paginated quotation list or quotation detail.
- **Authentication:** Customer for own data; admin for update/all data.
- **Validation:** Ownership, allowed status transitions, valid pricing.
- **Backend logic:** Authorization and notification/status audit.
- **Database:** Quotation tables and status history.

### POST /api/inquiries

- **Purpose:** Persist contact, Mahamu, and service/repair inquiries.
- **Request:**
  ```json
  {
    "type": "Service & Repair",
    "name": "Customer",
    "email": "customer@example.com",
    "phone": "",
    "message": "",
    "model": ""
  }
  ```
- **Response:** `{ "success": true, "reference": "INQ-...", "status": "Pending" }`
- **Authentication:** Optional guest.
- **Validation:** Type allowlist, required fields, length limits, email/phone, honeypot, rate limit.
- **Backend logic:** Create reference, persist guest/customer identity, optional image metadata, prevent duplicates.
- **Database:** `inquiries`, `inquiry_items/images`, and status table as needed.

### GET /api/inquiries and PATCH /api/inquiries/{id}

- **Purpose:** Customer history and admin status/assignment updates.
- **Request:** Pagination/filter query or `{ "status": "In Progress", "assignedTo": "" }`.
- **Response:** Inquiry list/detail.
- **Authentication:** Customer for owned records; admin for updates and assignment.
- **Validation:** Ownership and allowed status.
- **Backend logic:** No cross-user reads, audit status changes, notify customer.
- **Database:** Inquiry status/assignment/audit fields.

### POST /api/upload

- **Purpose:** Upload inquiry/profile/product images to Supabase Storage.
- **Request:** `multipart/form-data` with file and `purpose`/`entityId`.
- **Response:** `{ "success": true, "url": "", "path": "" }`
- **Authentication:** Required for private profile/inquiry data; anonymous upload requires a server-owned signed request or is denied.
- **Validation:** MIME allowlist, 5 MB limit, dimensions, filename, purpose/entity ownership.
- **Backend logic:** Server upload or signed upload, metadata record, orphan cleanup.
- **Database/Storage:** Buckets `inquiry-images`, `profile-images`, optional category/product buckets.

### PUT/DELETE /api/products/{id}

- **Purpose:** Update and remove products.
- **Request:** Item/category/brand/sub-brand/stock/price/image fields.
- **Response:** `{ "success": true, "data": {} }`
- **Authentication:** Admin only.
- **Validation:** Category/brand references, positive price/stock, status allowlist.
- **Backend logic:** Transactionally update item/batch/catalog fields and invalidate caches.
- **Database:** Existing items/batches constraints plus missing variant and image fields where needed.

### POST /api/auth/forgot-password and POST /api/auth/reset-password

- **Purpose:** Implement secure password reset.
- **Request:** email or reset token/new password.
- **Response:** Generic success for forgot-password to prevent account enumeration.
- **Authentication:** Public reset initiation; signed reset token for completion.
- **Validation:** Email format, password policy, token expiry/use.
- **Backend logic:** Supabase Auth email/reset flow or securely generated custom tokens.
- **Database:** Reset-token data only if custom auth is retained.

### GET /api/admin/dashboard, GET /api/admin/analytics, GET /api/users

- **Purpose:** Replace hardcoded admin dashboard, analytics, customer, and user lists.
- **Request:** Date range/page/filter query.
- **Response:** Aggregated dashboard/user/analytics data.
- **Authentication:** Admin only.
- **Validation:** Range bounds, date/timezone, page limits.
- **Backend logic:** Query actual orders, quotations, stock, inquiries, and users.
- **Database:** Existing reports/RPC functions may be reused after confirming authorization and RLS.

## 4. Remaining database and Supabase updates

### 4.1 Confirmed or strongly indicated existing resources

The Postman collection indicates, and API code accesses or mentions, the following existing resources:

- `items`, `categories`, `brands`, `sub_brands`, `batches`, `vw_item_stock_summary`
- `customers`
- `invoices`, `invoice_items`
- `payments`
- `notifications`
- `shop_settings`
- Authentication, stock, invoice, report, and notification RPC functions

The exact column names, constraints, RLS policies, and function behavior remain unverified because no SQL migrations or live schema export are available.

### 4.2 Tables required for frontend features

Add the following only if they do not already exist:

- `customer_addresses`
- `wishlist_items`
- `carts` and `cart_items`
- `quotations` and `quotation_items`
- `inquiries` and `inquiry_images`
- `customer_preferences`
- `coupon_codes`, `coupon_usage`
- `payments` and `payment_events` or provider reconciliation fields
- `order_status_history` / invoice status history
- `notification_preferences` or account-level preference fields
- `newsletter_subscribers`
- `product_variants` and `variant_stock` only if item/batch does not already model variants

For guest and customer records, preserve a stable foreign key to the existing custom user/customer model and avoid storing personal data in browser-only tables.

### 4.3 Missing columns or relationships

Based on checkout and account UI, determine and add where absent:

- Invoice/customer relationship for authenticated and guest orders.
- Invoice shipping and billing address references or immutable address snapshots.
- Delivery method, pickup location, contact preference, checkout notes, and payment method.
- Invoice status and status-history details.
- Invoice item batch/stock allocation and server-calculated unit price.
- Customer/full name/phone/profile fields.
- Customer/avatar path.
- Quotation and inquiry customer references with guest support.
- Wishlist customer, product, and variant relation.
- Cart customer/session and variant relation.
- User role/authorization fields and consistent role names.

### 4.4 Constraints and indexes

- Unique active cart row per customer/session and variant.
- Unique wishlist customer/product/variant row.
- One default address per customer.
- Unique invoice reference and provider payment reference.
- Unique coupon code.
- Unique notification/webhook event ID.
- Foreign keys for order/invoice, invoice items, quotations, quotation items, inquiries, addresses, and wishlist.
- Check constraints for quantity > 0, prices >= 0, valid status values, and positive stock.
- Indexes for customer ID, status, reference, created date, product ID, and phone normalized lookup.

### 4.5 Suggested migrations

Create migrations in the existing Supabase project rather than recreating existing tables:

1. Add customer/profile and address relationships.
2. Add cart/wishlist tables.
3. Add quotation and quotation-item tables.
4. Add inquiry/inquiry-image tables.
5. Add coupon and coupon-usage tables.
6. Add payment event/reconciliation fields.
7. Add order status history and invoice shipping/payment/delivery fields.
8. Add profile/inquiry Storage buckets and policies.
9. Add role-aware RLS policies.

The SQL migration itself must be based on the live `information_schema` and existing table definitions. No migration can be accurately written from the current workspace alone.

### 4.6 Required database functions/triggers

The existing backend requirements should use one atomic order RPC that:

- validates the idempotency key;
- verifies the customer/guest context;
- rechecks all item and batch stock;
- retrieves active server-side coupon rules;
- calculates line totals, subtotal, discount, tax, and total;
- creates or finds the customer/address snapshot;
- creates the invoice and invoice items;
- reserves or deducts stock according to existing business rules;
- creates an initial status-history entry;
- returns an invoice ID/reference.

Additional RPC functions or triggers may be required for:

- stock deduction/reservation and rollback;
- batch/FIFO allocation;
- one default address enforcement;
- coupon usage increment;
- status transition validation;
- notification creation;
- stock reorder notification;
- atomic payment reconciliation.

### 4.7 RLS policies

Policies must prevent anonymous or authenticated users from acting outside their role and ownership:

- Customers may read/update/delete only their own profile, addresses, wishlist, cart, inquiries, quotations, and orders.
- Guest checkout may create an order/inquiry but may not list or update existing records.
- Admin and authorized staff may manage catalogue, stock, orders, quotations, inquiries, customers, and reports.
- RPC functions that perform privileged writes must enforce caller role/ownership rather than relying on the Next.js proxy alone.
- Public catalogue reads may remain allowed for active products/categories.
- The anon/publishable key must never be used for service-role operations.

### 4.8 Supabase Storage

Configure private/public access based on each bucket:

- `profile-images`: authenticated owner read/write; public only if intentionally used for avatars.
- `inquiry-images`: authenticated owner/admin read; guest upload only through server validation or an expiring signed policy.
- `product-images`/`category-banners`: public read, admin write.
- Enforce object size and MIME policy server-side and through Storage policy/bucket settings.
- Store immutable object paths and delete orphaned objects.

## 5. Missing e-commerce functionality

| Area | Status | Remaining backend work |
|---|---|---|
| Wishlist | Missing | Persistent table/API, login merge, ownership/RLS |
| Persistent cart | Missing | Database or server session cart, merge and sync |
| Cart stock sync | Missing | Revalidate quantity/stock/prices at cart and checkout |
| Product variants | Unverified | Confirm existing SKU/batch model or add variant tables |
| Checkout | Incomplete | Persist full checkout, atomic order RPC, customer/address/payment |
| Order creation | Incomplete | Transaction, stock/FIFO, duplicate protection |
| Order history | Missing | Customer-owned list/detail/status history |
| Order tracking | Missing | Public lookup or signed tracking endpoint |
| Payments | Missing | Provider session/webhook/reconciliation |
| Discounts/coupons | Missing | Server coupon rules and usage |
| Customer addresses | Missing | CRUD/default address persistence |
| Inquiries | Missing | Contact/Mahamu/service persistence |
| Inquiry history | Missing | Customer/guest history and status |
| Service/repair | Missing | Server submissions, Storage images, assignment/status |
| Guest requests | Missing | Guest-safe create-only API and anti-abuse controls |
| Image uploads | Missing/incomplete | Storage buckets and server validation |
| Account management | Missing | Profile, preferences, password, deletion |

## 6. Backend business logic

The remaining implementation must include:

- Live product and batch price selection with a documented precedence rule.
- Server-calculated subtotal, discount, tax, delivery fee, and total.
- Stock availability, quantity, and variant validation.
- Reservation/deduction and rollback behavior.
- Coupon active-date, usage-limit, minimum subtotal, and customer eligibility validation.
- Allowed order and quotation status transitions.
- Order/invoice reference generation and uniqueness.
- Payment status verification and signed webhook handling.
- Customer ownership resolution from the existing authentication model.
- Idempotency for checkout and payment callbacks.
- Guest checkout duplicate prevention.
- Inquiry and quotation duplicate prevention without blocking legitimate repeated requests.
- Browser-to-account wishlist/cart merge.
- Profile and address ownership protection.
- Image lifecycle and orphan cleanup.
- Notification and status audit records.
- Existing stock RPC functions should be invoked or replaced by one atomic transaction only after verifying their function signatures.

## 7. Security and validation gaps

- Replace browser-only auth state as the security boundary with verified server session/token/role checks.
- Add authorization to every `/api/admin/**` and mutation route.
- Restrict the allowlisted `/api/smartstock/[...path]` proxy to operations appropriate for the caller.
- Validate RPC payloads, especially registration role selection. Customer registration must not accept arbitrary admin role IDs.
- Add validation for all route bodies: JSON type, required fields, lengths, enums, IDs, and numeric ranges.
- Prevent mass assignment in product and order mutations.
- Add ownership checks for orders, quotations, inquiries, addresses, wishlist, profile, and files.
- Add RLS policies at Supabase level rather than relying only on Next.js route checks.
- Add login throttling and public inquiry/order rate limits.
- Verify password reset and token behavior. The existing custom reset RPC calls currently expose reset/change logic through the frontend API and need backend review.
- Sanitize or reject unexpected JSON fields.
- Do not return upstream SQL/PostgREST details or credentials to clients.
- Add structured error codes and avoid account/product existence enumeration.
- Remove or restrict debug response fields that may expose data.
- Protect webhook endpoints through signatures, replay checks, and provider allowlists.
- Validate uploaded MIME type, size, extension, and ownership on the server.
- Define account deletion behavior and retention of legally required invoice data.

## 8. Implementation priority

### Critical

1. Authentication and authorization baseline.
2. Server-authoritative checkout, price and stock validation.
3. Atomic invoice/invoice-item transaction and stock/FIFO allocation.
4. Supabase RLS verification and policy implementation.
5. Customer/profile/address ownership.
6. Secure upload endpoint and storage policies.
7. Payment integration only after checkout/order foundations are complete.

Dependencies: live schema and RPC signatures must be confirmed before checkout RPC and RLS work.

### High

1. Order history/detail/status/tracking.
2. Persistent cart and cart login merge.
3. Wishlist persistence.
4. Quotation persistence and history.
5. Service/repair/contact/Mahamu inquiry persistence.
6. Coupon validation and usage.
7. Product update/delete/admin authorization.

Dependencies: authentication/role model, customer tables, and RLS must exist first.

### Medium

1. Account preferences and notification storage.
2. Invoice/payment status history.
3. Admin users/analytics/dashboard live data.
4. Inquiry and quotation assignment/status workflows.
5. Newsletter subscription management.
6. Blog CMS if this feature is intended.

Dependencies: order/inquiry/quotation tables and admin authorization.

### Low

1. Static category/banner/marketing content administration.
2. Additional report dashboards.
3. Advanced notification preferences.
4. Product variants if confirmed to be required by the Supabase inventory model.

## 9. Final backend completion checklist

- [ ] Confirm the live Supabase schema and export the migration baseline.
- [ ] Confirm custom users/customer/role relationships and authentication RPC response shapes.
- [ ] Decide whether Supabase Auth or the existing custom RPC auth model is retained.
- [ ] Implement verified session/token authentication and logout revocation.
- [ ] Implement secure forgot/reset/change-password flows.
- [ ] Enforce server-side admin/customer role authorization.
- [ ] Implement and test RLS for catalogue, customer, order, address, wishlist, cart, quotation, inquiry, and upload resources.
- [ ] Implement atomic order checkout RPC.
- [ ] Add server-authoritative price, stock, quantity, and coupon validation.
- [ ] Implement stock reservation/deduction/FIFO according to existing inventory business rules.
- [ ] Add idempotency and duplicate-order prevention.
- [ ] Persist shipping/billing/delivery/payment details.
- [ ] Implement customer and guest order history/detail APIs.
- [ ] Implement order status history and status transition authorization.
- [ ] Implement public or signed order tracking.
- [ ] Integrate payment provider session creation and signed webhooks.
- [ ] Implement coupon tables and server-side coupon usage.
- [ ] Implement persistent cart and login merge.
- [ ] Implement wishlist persistence and login merge.
- [ ] Implement address CRUD and default-address constraints.
- [ ] Implement profile CRUD and account deletion policy.
- [ ] Implement account notification preference storage.
- [ ] Implement quotation creation/history/admin update APIs.
- [ ] Implement inquiry creation/history/admin update APIs for contact, Mahamu, and service/repair.
- [ ] Implement server-validated inquiry/profile Storage uploads.
- [ ] Implement orphan file cleanup.
- [ ] Implement product update/delete APIs and admin authorization.
- [ ] Add product variants only if the live inventory model requires them.
- [ ] Replace admin static dashboard/order/user/analytics data with live queries.
- [ ] Implement or remove placeholder `/api/cart`, `/api/upload`, `/api/users`, `/api/analytics`, and `/api/blog` routes according to intended product scope.
- [ ] Implement newsletter subscription and unsubscribe if that UI remains in scope.
- [ ] Add login, checkout, and public form rate limits.
- [ ] Add structured logging and audit trails.
- [ ] Add route-level integration tests for ownership, role, validation, checkout rollback, payment callbacks, and stock behavior.
