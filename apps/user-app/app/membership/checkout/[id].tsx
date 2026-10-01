import { PaymentProgress } from "../../../src/components/PaymentProgress";
import { Text } from "react-native";
import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { Plan, PaymentOrder } from "@sme/types";
import { money, totals } from "@sme/shared";
import {
  Screen,
  Card,
  styles,
  Button,
  LoginRequired,
  ErrorState,
  Skeleton,
} from "../../../src/components/ui";
import { useSession } from "../../../src/lib/session";
import { api, mutate } from "../../../src/lib/api";
import { openCheckout, prepareCheckoutWindow, closeCheckoutWindow } from "../../../src/lib/checkout";
export default function Checkout() {
  const { id, slug } = useLocalSearchParams<{ id: string; slug: string }>();
  const user = useSession((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusUrl, setStatusUrl] = useState("");
  const q = useQuery({
    queryKey: ["membership-plans", slug],
    queryFn: () => api<Plan>(`/membership-plans/${slug}`),
    enabled: !!user,
  });
  return (
    <Screen title="Membership checkout">
      {!user ? (
        <LoginRequired returnTo={`/membership/checkout/${id}?slug=${slug}`} />
      ) : q.isPending ? (
        <Skeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : (
        q.data && (
          <Card>
            <Text style={styles.eyebrow}>YOUR MEMBERSHIP</Text>
            <Text style={styles.title}>{q.data.title}</Text>
            <Text style={styles.text}>{q.data.durationMonths} months</Text>
            <Text style={styles.muted}>
              Member: {user.firstName} {user.lastName}
              {"\n"}
              {user.email}
            </Text>
            <Text style={styles.text}>Plan amount: {money(q.data.price)}</Text>
            <Text style={styles.text}>
              GST ({q.data.gstPercentage}%):{" "}
              {money(totals(q.data.price, q.data.gstPercentage).gstAmount)}
            </Text>
            <Text style={styles.heading}>
              Total:{" "}
              {money(totals(q.data.price, q.data.gstPercentage).totalAmount)}
            </Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
            {statusUrl ? (
              <PaymentProgress statusUrl={statusUrl} kind="membership" />
            ) : (
              <Button
                loading={busy}
                onPress={() => {
                  try {prepareCheckoutWindow();}catch(e){setError((e as Error).message);return;}
                  setBusy(true);
                  setError("");
                  void mutate<PaymentOrder>(
                    "/payments/membership/order",
                    "POST",
                    { planId: id },
                  )
                    .then(async (order) => {
                      setStatusUrl(order.statusUrl);
                      await openCheckout(order.checkoutUrl);
                    })
                    .catch((e) => {closeCheckoutWindow();setError(e.message);})
                    .finally(() => setBusy(false));
                }}
              >
                Pay securely with Razorpay
              </Button>
            )}
            <Text style={styles.muted}>{q.data.termsAndConditions}</Text>
          </Card>
        )
      )}
    </Screen>
  );
}
