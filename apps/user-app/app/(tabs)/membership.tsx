import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { Plan } from "@sme/types";
import { api } from "../../src/lib/api";
import {
  Screen,
  PageHeader,
  styles,
  Card,
  Section,
  Skeleton,
  Empty,
} from "../../src/components/ui";
import { PlanCard } from "../../src/components/cards";
import { backupPlans } from "../../src/lib/backupContent";
export default function Membership() {
  const q = useQuery({
    queryKey: ["membership-plans"],
    queryFn: () => api<Plan[]>("/membership-plans"),
  });
  const plans = q.isError ? backupPlans : q.data;
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <PageHeader
        title="Membership"
        subtitle="Grow with a community that understands business"
        back
      />
      <LinearGradient
        colors={["#086c98", "#008bc1"]}
        style={{ padding: 23, borderRadius: 25, gap: 15, marginTop: -9 }}
      >
        <Text
          style={{
            color: "#acd9ed",
            fontSize: 10,
            letterSpacing: 1.7,
            fontWeight: "700",
          }}
        >
          WHY JOIN US
        </Text>
        <Text
          style={{
            color: "white",
            fontWeight: "700",
            fontSize: 25,
            lineHeight: 32,
          }}
        >
          Your next opportunity can start with the right room.
        </Text>
        <Text style={{ color: "#c0e2f2", fontSize: 15, lineHeight: 22 }}>
          Be part of a trusted ecosystem built around learning, visibility and
          progress.
        </Text>
      </LinearGradient>
      <View style={{ marginTop: 12 }}>
        <Section title="Member benefits" />
      </View>
      <Card>
        {[
          "Networking opportunities",
          "Business events & programmes",
          "Knowledge and training",
          "SME support and guidance",
          "Industry interaction",
          "Business development opportunities",
        ].map((b) => (
          <View
            key={b}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <Ionicons name="checkmark-circle" size={24} color="#008bc1" />
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                color: "#263342",
                fontWeight: "600",
              }}
            >
              {b}
            </Text>
          </View>
        ))}
      </Card>
      <View style={{ marginTop: 12, gap: 8 }}>
        <Section title="Membership categories" />
        <Text style={styles.muted}>
          Choose a membership for your next stage of growth. Prices are
          exclusive of GST.
        </Text>
      </View>
      {q.isPending ? (
        <Skeleton />
      ) : !plans?.length ? (
        <Empty />
      ) : (
        plans.map((p) => <PlanCard plan={p} key={p.id} />)
      )}
    </Screen>
  );
}
