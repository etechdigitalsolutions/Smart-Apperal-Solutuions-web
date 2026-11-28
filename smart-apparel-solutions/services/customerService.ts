import { apiFetch } from "@/lib/api/client";
import type { ApiResponse, CartItem } from "@/types";

type CustomerResource =
  | "carts"
  | "cart_items"
  | "customer_wishlist_items"
  | "customer_addresses"
  | "website_customers"
  | "customer_preferences";

function request<T>(
  resource: CustomerResource,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  query?: Record<string, string>,
  body?: Record<string, unknown>,
) {
  const params = new URLSearchParams(query);
  return apiFetch<ApiResponse<T>>(
    `/customer-data/${resource}${params.toString() ? `?${params}` : ""}`,
    {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    },
  );
}

export const customerService = {
  getProfile: () =>
    request<Record<string, unknown>[]>("website_customers", "GET", {
      select: "*",
    }),

  updateProfile: (data: { full_name: string; phone: string }) =>
    request<Record<string, unknown>[]>(
      "website_customers",
      "PATCH",
      { select: "*" },
      data,
    ),

  getPreferences: () =>
    request<Record<string, unknown>[]>("customer_preferences", "GET", {
      select: "*",
    }),

  savePreferences: (data: {
    email_updates: boolean;
    whatsapp_updates: boolean;
    consent_version: string;
  }) =>
    request<Record<string, unknown>[]>(
      "customer_preferences",
      "POST",
      { on_conflict: "website_customer_id" },
      data,
    ),

  getAddresses: () =>
    request<Record<string, unknown>[]>("customer_addresses", "GET", {
      select: "*",
      order: "is_default.desc,created_at.desc",
    }),

  createAddress: (data: Record<string, unknown>) =>
    request<Record<string, unknown>[]>("customer_addresses", "POST", {}, data),

  deleteAddress: (addressId: string) =>
    request<unknown>(
      "customer_addresses",
      "DELETE",
      { address_id: `eq.${addressId}` },
    ),

  getWishlist: () =>
    request<Record<string, unknown>[]>("customer_wishlist_items", "GET", {
      select: "*",
      order: "created_at.desc",
    }),

  addWishlistItem: (itemId: number) =>
    request<Record<string, unknown>[]>(
      "customer_wishlist_items",
      "POST",
      {},
      { item_id: itemId },
    ),

  removeWishlistItem: (itemId: number) =>
    request<unknown>(
      "customer_wishlist_items",
      "DELETE",
      { item_id: `eq.${itemId}` },
    ),

  getCart: () =>
    request<Record<string, unknown>[]>("carts", "GET", {
      select: "*,cart_items(*)",
      limit: "1",
    }),

  createCart: () =>
    request<Record<string, unknown>[]>("carts", "POST", {}, {}),

  async saveCart(items: CartItem[]) {
    const cartResult = await this.getCart();
    if (!cartResult.success || !Array.isArray(cartResult.data)) {
      throw new Error(cartResult.message || "Unable to load your saved cart.");
    }

    let cart = cartResult.data[0];
    if (!cart) {
      const created = await this.createCart();
      if (!created.success || !Array.isArray(created.data)) {
        throw new Error(created.message || "Unable to create your saved cart.");
      }
      cart = created.data[0];
    }
    const cartId = cart?.cart_id;
    if (typeof cartId !== "string" && typeof cartId !== "number") {
      throw new Error("The saved cart response did not include a cart ID.");
    }

    const existing = Array.isArray(cart.cart_items)
      ? (cart.cart_items as Record<string, unknown>[])
      : [];
    const remaining = new Set(existing);

    for (const item of items) {
      const itemId = Number(item.productId);
      if (!Number.isSafeInteger(itemId) || itemId < 1) {
        throw new Error("A cart item has an invalid product ID.");
      }
      const match = existing.find(
        (row) =>
          Number(row.item_id) === itemId &&
          String(row.size ?? "") === String(item.size ?? "") &&
          String(row.color ?? "") === String(item.color ?? ""),
      );
      if (match) {
        remaining.delete(match);
        const cartItemId = match.cart_item_id;
        if (typeof cartItemId !== "string" && typeof cartItemId !== "number") {
          throw new Error("A saved cart item did not include its ID.");
        }
        const updated = await this.updateCartItem(cartItemId, item.quantity);
        if (!updated.success) {
          throw new Error(updated.message || "Unable to update a cart item.");
        }
      } else {
        const added = await this.addCartItem({
          cart_id: cartId,
          item_id: itemId,
          quantity: item.quantity,
          size: item.size ?? "",
          color: item.color ?? "",
        });
        if (!added.success) {
          throw new Error(added.message || "Unable to save a cart item.");
        }
      }
    }

    for (const row of remaining) {
      const cartItemId = row.cart_item_id;
      if (typeof cartItemId !== "string" && typeof cartItemId !== "number") {
        throw new Error("A saved cart item did not include its ID.");
      }
      const removed = await this.removeCartItem(cartItemId);
      if (!removed.success) {
        throw new Error(removed.message || "Unable to remove a cart item.");
      }
    }
  },

  addCartItem: (data: {
    cart_id: string | number;
    item_id: number;
    quantity: number;
    size?: string;
    color?: string;
  }) => request<Record<string, unknown>[]>("cart_items", "POST", {}, data),

  updateCartItem: (cartItemId: string | number, quantity: number) =>
    request<Record<string, unknown>[]>(
      "cart_items",
      "PATCH",
      { cart_item_id: `eq.${cartItemId}` },
      { quantity },
    ),

  removeCartItem: (cartItemId: string | number) =>
    request<unknown>("cart_items", "DELETE", {
      cart_item_id: `eq.${cartItemId}`,
    }),

  getOrders: () =>
    apiFetch<ApiResponse<Record<string, unknown>[]>>(
      "/orders",
      { cache: "no-store" },
    ),

  getOrderHistory: (orderId: string) =>
    apiFetch<ApiResponse<Record<string, unknown>[]>>(
      `/orders/${encodeURIComponent(orderId)}/history`,
      { cache: "no-store" },
    ),

  getOrderDetail: (orderId: string) =>
    apiFetch<ApiResponse<Record<string, unknown>[]>>(
      `/orders/${encodeURIComponent(orderId)}`,
      { cache: "no-store" },
    ),
};
