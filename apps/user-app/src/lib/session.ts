import { create } from "zustand";
import type { User, Session } from "@sme/types";
import {
  api,
  saveSession,
  clearSession,
  restoreSession,
  storage,
  mutate,
} from "./api";
type State = {
  user: User | null;
  ready: boolean;
  offline: boolean;
  restore: () => Promise<void>;
  login: (s: Session) => Promise<void>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
};
export const useSession = create<State>((set) => ({
  user: null,
  ready: false,
  offline: false,
  restore: async () => {
    try {
      if (await restoreSession()) {
        const user = await api<User>("/users/me");
        set({ user });
      }
      set({ offline: false });
    } catch {
      set({ offline: true });
    } finally {
      set({ ready: true });
    }
  },
  login: async (s) => {
    await saveSession(s);
    set({ user: s.user ?? (await api<User>("/users/me")) });
  },
  logout: async () => {
    const refreshToken = await storage.get();
    try {
      if (refreshToken) await mutate("/auth/logout", "POST", { refreshToken });
    } finally {
      await clearSession();
      set({ user: null });
    }
  },
  reload: async () => set({ user: await api<User>("/users/me") }),
}));
