const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getRequestUrl(endpoint: string): string {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const normalizedPath =
    BASE_URL.endsWith("/api") && path.startsWith("/api/")
      ? path.slice(4)
      : path;
  return `${BASE_URL}${normalizedPath}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers);
  const isFormData =
    typeof FormData !== "undefined" && options?.body instanceof FormData;
  if (options?.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(getRequestUrl(endpoint), {
    ...options,
    headers,
  });
  const responseText = await res.text();
  let responseBody: unknown;

  if (responseText) {
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }
  }

  if (!res.ok) {
    const body =
      responseBody && typeof responseBody === "object"
        ? (responseBody as Record<string, unknown>)
        : null;
    const message =
      typeof body?.message === "string"
        ? body.message
        : typeof body?.error === "string"
          ? body.error
          : `Request failed (${res.status}).`;
    throw new ApiError(message, res.status);
  }

  return responseBody as T;
}
