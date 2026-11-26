import { apiFetch } from "@/lib/api/client";

export interface CreateOrderRequest {
  website: "";
  email: string;
  items: Array<{ productId: string; quantity: number }>;
  notes?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  reference: string;
  subtotal: number;
  total: number;
  message?: string;
}

export const orderService = {
  create: (data: CreateOrderRequest) =>
    apiFetch<CreateOrderResponse>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
