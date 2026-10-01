import { Text, Pressable, View, Image } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { money, date } from "@sme/shared";
import { useSession } from "../lib/session";
import { api, mutate } from "../lib/api";
import {
  Screen,
  Card,
  styles,
  LoginRequired,
  Skeleton,
  Empty,
  ErrorState,
} from "../components/ui";
type Row = {
  id: string;
  status: string;
  planTitle?: string;
  startDate?: string;
  endDate?: string;
  reference?: string;
  attendees?: number;
  event?: { title: string; venue: string; startDate: string };
  totalAmount?: number;
  type?: string;
  invoiceNumber?: string;
  title?: string;
  message?: string;
  readAt?: string;
  deepLink?: string;
  imageUrl?: string;
  createdAt: string;
};
export function HistoryScreen({
  kind,
}: {
  kind: "my-membership" | "my-bookings" | "payment-history" | "notifications";
}) {
  const user = useSession((s) => s.user);
  const path = {
    "my-membership": "memberships",
    "my-bookings": "event-bookings",
    "payment-history": "payments",
    notifications: "notifications",
  }[kind];
  const title = {
    "my-membership": "My Membership",
    "my-bookings": "My Event Bookings",
    "payment-history": "Payment History",
    notifications: "Notifications",
  }[kind];
  const q = useQuery({
    queryKey: [kind, user?.id],
    queryFn: () => api<Row[]>("/" + path),
    enabled: !!user,
  });
  return (
    <Screen
      title={title}
      refreshing={q.isRefetching}
      onRefresh={() => void q.refetch()}
    >
      {!user ? (
        <LoginRequired returnTo={"/" + kind} />
      ) : q.isPending ? (
        <Skeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : !q.data?.length ? (
        <Empty
          message={
            kind === "my-bookings" && !user.emailVerified
              ? "Verify your email from Profile to see guest bookings made with that email."
              : "No records yet. Your confirmed activity will appear here."
          }
        />
      ) : (
        q.data.map((r) => (
          <Card key={r.id}>
            <View style={styles.row}>
              <Text style={[styles.heading, { flex: 1 }]}>
                {r.planTitle ??
                  r.event?.title ??
                  r.title ??
                  r.type?.replace("_", " ")}
              </Text>
              <Text style={styles.badge}>
                {r.status ?? (r.readAt ? "READ" : "NEW")}
              </Text>
            </View>
            {!!r.message && <Text style={styles.text}>{r.message}</Text>}
            {!!r.imageUrl && kind === "notifications" && (
              <Image
                source={{ uri: r.imageUrl }}
                accessibilityLabel="Notification image"
                style={{ width: "100%", height: 150, borderRadius: 12, marginTop: 10 }}
                resizeMode="cover"
              />
            )}
            {!!r.reference && (
              <Text style={styles.text}>Reference: {r.reference}</Text>
            )}
            {!!r.event && (
              <Text style={styles.muted}>
                {date(r.event.startDate)} ? {r.event.venue}
                {"\n"}
                {r.attendees} attendee(s)
              </Text>
            )}
            {!!r.startDate && (
              <Text style={styles.muted}>Starts {date(r.startDate)}</Text>
            )}
            {!!r.endDate && (
              <Text style={styles.text}>Valid until {date(r.endDate)}</Text>
            )}
            {r.totalAmount !== undefined && (
              <Text style={styles.heading}>{money(r.totalAmount)}</Text>
            )}
            {!!r.invoiceNumber && (
              <Text selectable style={styles.muted}>
                Invoice: {r.invoiceNumber}
              </Text>
            )}
            <Text style={styles.muted}>{date(r.createdAt)}</Text>
            {kind === "notifications" && (
              <Pressable
                onPress={() =>
                  void mutate(`/notifications/${r.id}/read`, "PATCH").then(
                    () => {
                      void q.refetch();
                      if (
                        r.deepLink?.startsWith("/") &&
                        !r.deepLink.startsWith("//")
                      )
                        router.push(r.deepLink);
                    },
                  )
                }
              >
                <Text style={{ color: "#175aa5" }}>
                  Mark as read{r.deepLink ? " & open" : ""} →
                </Text>
              </Pressable>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
