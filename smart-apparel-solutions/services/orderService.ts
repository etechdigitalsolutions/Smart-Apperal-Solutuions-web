import { apiFetch } from "@/lib/api/client";

export interface CreateOrderRequest {
  idempotencyKey: string;
  items: Array<{ itemId: number; quantity: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  deliveryMethod: "delivery" | "pickup";
  paymentMethod: string;
  couponCode: string | null;
  notes?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  reference: string;
  message?: string;
  data?: unknown;
}

export const orderService = {
  create: (data: CreateOrderRequest) =>
    apiFetch<CreateOrderResponse>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
