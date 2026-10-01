import type { ApiResponse } from "@sme/types";
export const base =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
let token = "";
let refreshPromise: Promise<void> | null = null;
export function setToken(value: string) {
  token = value;
}
async function refresh() {
  if (!refreshPromise)
    refreshPromise = (async () => {
      const r = await fetch(`${base}/admin/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok) throw new Error("Please log in");
      token = j.data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  if (!token && retry && !path.includes("/auth/")) {
    try {
      await refresh();
    } catch {
      if (typeof window !== "undefined") window.location.assign("/login");
      throw new Error("Session expired");
    }
  }
  const response = await fetch(`${base}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401 && retry && !path.includes("/auth/")) {
    try {
      await refresh();
      return api<T>(path, options, false);
    } catch {
      if (typeof window !== "undefined") window.location.assign("/login");
      throw new Error("Session expired");
    }
  }
  const json = (await response.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.message);
  return json.data;
}
export const mutate = <T>(path: string, method: string, data?: unknown) =>
  api<T>(path, {
    method,
    body: data === undefined ? undefined : JSON.stringify(data),
  });
export async function downloadBookings() {
  const r = await fetch(`${base}/admin/event-bookings/export/csv`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Export failed. Refresh the page and try again.");
  const url = URL.createObjectURL(await r.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "event-bookings.csv";
  link.click();
  URL.revokeObjectURL(url);
}
