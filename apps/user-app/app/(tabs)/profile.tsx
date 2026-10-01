import { useState } from "react";
import { Text, View, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { date } from "@sme/shared";
import {
  Screen,
  Card,
  styles,
  Button,
  LoginRequired,
} from "../../src/components/ui";
import { useSession } from "../../src/lib/session";
import { api, mutate } from "../../src/lib/api";
export default function Profile() {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const q = useQuery({
    queryKey: ["my-membership", user?.id],
    queryFn: () =>
      api<{ status: string; planTitle: string; endDate: string }[]>(
        "/memberships",
      ),
    enabled: !!user,
  });
  const active = q.data?.find((m) => m.status === "ACTIVE");
  return (
    <Screen>
      <Text style={styles.eyebrow}>YOUR CHAMBER ACCOUNT</Text>
      <Text style={styles.title}>Profile</Text>
      {!user ? (
        <LoginRequired />
      ) : (
        <>
          <Card>
            <View style={[styles.row, { justifyContent: "flex-start" }]}>
              {user.photo ? (
                <Image
                  source={{ uri: user.photo }}
                  style={{ width: 65, height: 65, borderRadius: 35 }}
                />
              ) : (
                <View
                  style={{
                    width: 65,
                    height: 65,
                    borderRadius: 35,
                    backgroundColor: "#e7eff8",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={styles.heading}>
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.heading}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.muted}>{user.designation}</Text>
                <Text style={styles.muted}>{user.companyName}</Text>
              </View>
            </View>
            <Text style={styles.text}>{user.email}</Text>
            <Text style={styles.muted}>{user.mobile}</Text>
            {!!user.address && <Text style={styles.muted}>{user.address}</Text>}
            <Text style={styles.badge}>
              {active
                ? `${active.planTitle} ? Valid to ${date(active.endDate)}`
                : "No active membership"}
            </Text>
            <Button secondary onPress={() => router.push("/edit-profile")}>
              Edit profile
            </Button>
          </Card>
          <Card>
            {(
              [
                ["My membership", "ribbon-outline", "/my-membership"],
                ["My event bookings", "ticket-outline", "/my-bookings"],
                ["Payment history", "card-outline", "/payment-history"],
                ["Notifications", "notifications-outline", "/notifications"],
                ["Change password", "lock-closed-outline", "/change-password"],
              ] as const
            ).map(([title, icon, url]) => (
              <Pressable
                key={url}
                onPress={() => router.push(url)}
                style={[styles.row, { paddingVertical: 13 }]}
              >
                <Ionicons name={icon} size={22} color="#175aa5" />
                <Text style={[styles.text, { flex: 1 }]}>{title}</Text>
                <Ionicons name="chevron-forward" size={17} color="#8996a5" />
              </Pressable>
            ))}
          </Card>
          {!user.emailVerified && (
            <Button
              secondary
              onPress={() =>
                void mutate("/auth/send-verification", "POST")
                  .then(() =>
                    setMessage(
                      "Verification email queued. Follow the link to access guest bookings securely.",
                    ),
                  )
                  .catch((e) => setMessage(e.message))
              }
            >
              Verify email address
            </Button>
          )}
          {!!message && <Text style={styles.muted}>{message}</Text>}
          <Button
            secondary
            onPress={() =>
              void logout()
                .catch(() => {})
                .finally(() => {
                  client.clear();
                  router.replace("/");
                })
            }
          >
            Log out
          </Button>
        </>
      )}
    </Screen>
  );
}
