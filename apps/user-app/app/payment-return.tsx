import { useLocalSearchParams } from "expo-router";
import { Screen, Empty } from "../src/components/ui";
import { PaymentProgress } from "../src/components/PaymentProgress";
export default function PaymentReturn() {
  const { ticket, kind } = useLocalSearchParams<{
    ticket: string;
    kind: string;
  }>();
  return (
    <Screen title="Payment confirmation">
      {ticket ? (
        <PaymentProgress
          statusUrl={"/payments/status?ticket=" + encodeURIComponent(ticket)}
          kind={kind === "event" ? "event" : "membership"}
        />
      ) : (
        <Empty message="Return to your checkout to check the payment status." />
      )}
    </Screen>
  );
}
