import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { ApiResponse, Session } from "@sme/types";
export const base =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
let accessToken = "";
let webRefresh = "";
let refreshPromise: Promise<void> | null = null;
export const storage = {
  get: async () =>
    Platform.OS === "web"
      ? webRefresh
      : await SecureStore.getItemAsync("sme-refresh"),
  set: async (value: string) => {
    if (Platform.OS === "web") webRefresh = value;
    else await SecureStore.setItemAsync("sme-refresh", value);
  },
  clear: async () => {
    if (Platform.OS === "web") webRefresh = "";
    else await SecureStore.deleteItemAsync("sme-refresh");
  },
};
export async function saveSession(session: Session) {
  accessToken = session.accessToken;
  if (session.refreshToken) await storage.set(session.refreshToken);
}
export async function clearSession() {
  accessToken = "";
  await storage.clear();
}
export async function restoreSession() {
  const refreshToken = await storage.get();
  if (!refreshToken) return false;
  const r = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) {
    await clearSession();
    return false;
  }
  const result = (await r.json()) as { data: Session };
  await saveSession(result.data);
  return true;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(20000),
  });
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    if (!refreshPromise)
      refreshPromise = restoreSession()
        .then((ok) => {
          if (!ok) throw new Error("Please log in to continue");
        })
        .finally(() => {
          refreshPromise = null;
        });
    await refreshPromise;
    return api<T>(path, options, false);
  }
  const json = (await response.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.message);
  return json.data;
}
export const mutate = <T>(path: string, method: string, data?: unknown) =>
  api<T>(path, { method, body: JSON.stringify(data) });
