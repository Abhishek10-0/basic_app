import { Text, Linking } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Screen,
  Card,
  styles,
  Button,
  ErrorState,
  Skeleton,
} from "../components/ui";
export function ContentScreen({
  kind,
}: {
  kind: "about" | "services" | "activities" | "contact";
}) {
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<Record<string, string>>("/settings"),
  });
  const title = {
    about: "About the Chamber",
    services: "Business support services",
    activities: "Chamber activities",
    contact: "Contact us",
  }[kind];
  return (
    <Screen title={title}>
      {q.isPending ? (
        <Skeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : (
        q.data && (
          <>
            <Text style={styles.eyebrow}>SME CHAMBER OF INDIA</Text>
            <Text style={styles.title}>{title}</Text>
            {kind === "contact" ? (
              <Card>
                <Text style={styles.heading}>{q.data.organizationName}</Text>
                <Text style={styles.text}>{q.data.address}</Text>
                {!!q.data.phone && (
                  <Button
                    secondary
                    onPress={() => void Linking.openURL("tel:" + q.data.phone)}
                  >
                    {q.data.phone}
                  </Button>
                )}
                {!!q.data.email && (
                  <Button
                    secondary
                    onPress={() =>
                      void Linking.openURL("mailto:" + q.data.email)
                    }
                  >
                    {q.data.email}
                  </Button>
                )}
                {!!q.data.whatsapp && (
                  <Button
                    secondary
                    onPress={() =>
                      void Linking.openURL(
                        "https://wa.me/" + q.data.whatsapp.replace(/\D/g, ""),
                      )
                    }
                  >
                    Connect on WhatsApp
                  </Button>
                )}
              </Card>
            ) : (
              <Card>
                <Text style={styles.text}>{q.data[kind + "Content"]}</Text>
              </Card>
            )}
          </>
        )
      )}
    </Screen>
  );
}
