import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import Constants from "expo-constants";
import { useSession } from "../src/lib/session";
import { Loader } from "../src/components/Loader";
import { theme } from "@sme/config";
import {
  listenForNotificationResponses,
  registerPushToken,
} from "../src/lib/notifications";
export default function Layout() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
      }),
  );
  const ready = useSession((s) => s.ready);
  const restore = useSession((s) => s.restore);
  const user = useSession((s) => s.user);
  useEffect(() => {
    void restore();
  }, [restore]);
  useEffect(() => listenForNotificationResponses(), []);
  useEffect(() => {
    const projectId =
      Constants.easConfig?.projectId ??
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined);
    if (user && projectId) void registerPushToken(projectId);
  }, [user?.id]);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.background}
          translucent={false}
        />
        {ready ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#f4f7fb" },
            }}
          />
        ) : (
          <Loader />
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
