import { Image, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../src/lib/api";
import {
  Screen,
  Card,
  styles,
  Empty,
  Skeleton,
  ErrorState,
} from "../src/components/ui";
export default function Gallery() {
  const q = useQuery({
    queryKey: ["gallery"],
    queryFn: () => api<{ url: string; title: string }[]>("/gallery"),
  });
  return (
    <Screen title="Gallery & media">
      <Text style={styles.muted}>A look at our community in action</Text>
      {q.isPending ? (
        <Skeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : !q.data?.length ? (
        <Empty message="Event photographs will appear here when published by the Chamber." />
      ) : (
        q.data.map((g, i) => (
          <Card key={i}>
            <Image
              source={{ uri: g.url }}
              style={{ width: "100%", height: 230, borderRadius: 15 }}
            />
            <Text style={styles.text}>{g.title}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}
