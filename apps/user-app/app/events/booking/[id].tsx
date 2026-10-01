import { useQuery } from "@tanstack/react-query";
import type { ChamberEvent } from "@sme/types";
import { money, totals } from "@sme/shared";
import { api } from "../../../src/lib/api";
import { PaymentProgress } from "../../../src/components/PaymentProgress";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { bookingSchema } from "@sme/shared";
import type { PaymentOrder } from "@sme/types";
import { Form } from "../../../src/components/Form";
import { Screen, Card, styles } from "../../../src/components/ui";
import { mutate } from "../../../src/lib/api";
import { useSession } from "../../../src/lib/session";
import { openCheckout, prepareCheckoutWindow, closeCheckoutWindow } from "../../../src/lib/checkout";
export default function Booking() {
  const { id, slug } = useLocalSearchParams<{ id: string; slug: string }>();
  const event = useQuery({
    queryKey: ["events", slug],
    queryFn: () => api<ChamberEvent>(`/events/${slug}`),
    enabled: !!slug,
  });
  const user = useSession((s) => s.user);
  const [statusUrl, setStatusUrl] = useState("");
  return (
    <Screen title="Event registration">
      <Text style={styles.title}>Reserve your place.</Text>
      <Text style={styles.muted}>
        Register as a guest. Your confirmation will be sent to the email below.
      </Text>
      {event.data && (
        <Card>
          <Text style={styles.heading}>{event.data.title}</Text>
          <Text style={styles.text}>
            {event.data.paid
              ? `${money(totals(event.data.price, event.data.gstPercentage).totalAmount)} per attendee, including GST`
              : "Free registration"}
          </Text>
        </Card>
      )}
      <Card>
        {statusUrl ? (
          <PaymentProgress statusUrl={statusUrl} kind="event" />
        ) : (
          <Form
            schema={bookingSchema}
            defaults={{
              eventId: id,
              fullName: user ? `${user.firstName} ${user.lastName}` : "",
              email: user?.email ?? "",
              mobile: user?.mobile ?? "",
              companyName: user?.companyName ?? "",
              designation: user?.designation ?? "",
              address: "",
              attendees: 1,
              gstNumber: "",
              note: "",
            }}
            fields={[
              { name: "fullName", label: "Full name" },
              { name: "email", label: "Email", keyboard: "email-address" },
              { name: "mobile", label: "Mobile", keyboard: "phone-pad" },
              { name: "companyName", label: "Company name" },
              { name: "designation", label: "Designation" },
              { name: "address", label: "Address (optional)" },
              {
                name: "attendees",
                label: "Number of attendees (1–20)",
                keyboard: "numeric",
              },
              { name: "gstNumber", label: "GST number (optional)" },
              {
                name: "note",
                label: "Special note (optional)",
                multiline: true,
              },
            ]}
            submit="Continue registration"
            onSubmit={async (data) => {
              if(event.data?.paid)prepareCheckoutWindow();
              try {
              const order = await mutate<PaymentOrder>(
                "/payments/event/order",
                "POST",
                data,
              );
              if (order.status === "CONFIRMED") {
                closeCheckoutWindow();
                router.replace({
                  pathname: "/events/success",
                  params: { reference: order.reference },
                });
              } else {
                setStatusUrl(order.statusUrl);
                await openCheckout(order.checkoutUrl);
              }
              }catch(e){closeCheckoutWindow();throw e;}
            }}
          />
        )}
      </Card>
    </Screen>
  );
}
