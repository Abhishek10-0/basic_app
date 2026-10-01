import * as Device from "expo-device";
import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";
import { router } from "expo-router";
import { mutate } from "./api";

type NotificationsModule = typeof import("expo-notifications");

export const ANDROID_NOTIFICATION_CHANNEL_ID = "default";

const pushUnavailable =
  Platform.OS === "web" || (Platform.OS === "android" && isRunningInExpoGo());
let notificationsPromise: Promise<NotificationsModule> | null = null;
let handlerConfigured = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (pushUnavailable) return null;
  notificationsPromise ??= import("expo-notifications");
  const notifications = await notificationsPromise;
  if (!handlerConfigured) {
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }
  return notifications;
}

function openDeepLink(data: Record<string, unknown>) {
  const deepLink = data.deepLink;
  if (
    typeof deepLink === "string" &&
    deepLink.startsWith("/") &&
    !deepLink.startsWith("//")
  )
    router.push(deepLink);
}

export function listenForNotificationResponses() {
  let disposed = false;
  let removeListener: (() => void) | undefined;

  void loadNotifications().then(async (notifications) => {
    if (!notifications || disposed) return;
    const response = await notifications.getLastNotificationResponseAsync();
    if (response && !disposed)
      openDeepLink(response.notification.request.content.data ?? {});
    if (disposed) return;
    const subscription = notifications.addNotificationResponseReceivedListener(
      (nextResponse) =>
        openDeepLink(nextResponse.notification.request.content.data ?? {}),
    );
    removeListener = () => subscription.remove();
  });

  return () => {
    disposed = true;
    removeListener?.();
  };
}

export async function registerPushToken(projectId: string) {
  if (!Device.isDevice || !projectId) return;
  const notifications = await loadNotifications();
  if (!notifications) return;
  if (Platform.OS === "android")
    await notifications.setNotificationChannelAsync(
      ANDROID_NOTIFICATION_CHANNEL_ID,
      {
        name: "General",
        description: "General SME Chamber updates and announcements",
        importance: notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#087ea4",
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility:
          notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      },
    );
  const current = await notifications.getPermissionsAsync();
  const permission =
    current.status === "granted"
      ? current
      : await notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return;
  try {
    const token = await notifications.getExpoPushTokenAsync({ projectId });
    await mutate("/notifications/push-token", "POST", { token: token.data });
    if (__DEV__)
      console.info(
        `[Push] Registered ${token.data.slice(0, 18)}...${token.data.slice(-5)}`,
      );
  } catch (error) {
    if (__DEV__) console.warn("[Push] Registration failed", error);
    // Registration is retried next time the authenticated app opens.
  }
}
