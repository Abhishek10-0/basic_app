import { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { ChamberEvent } from "@sme/types";
import { api } from "../../src/lib/api";
import {
  Screen,
  PageHeader,
  styles,
  Skeleton,
  Empty,
} from "../../src/components/ui";
import { EventCard } from "../../src/components/cards";
import { backupEvents, backupPastEvents } from "../../src/lib/backupContent";
export default function Events() {
  const [past, setPast] = useState(false);
  const [type, setType] = useState("All");
  const [filter, setFilter] = useState(false);
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["events", past],
    queryFn: () =>
      api<ChamberEvent[]>(`/events?period=${past ? "past" : "forthcoming"}`),
  });
  const eventData = q.isError ? (past ? backupPastEvents : backupEvents) : q.data;
  const rows = eventData?.filter(
    (e) =>
      (type === "All" || e.eventType === type) &&
      e.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <PageHeader
        title="Events"
        subtitle="Ideas worth showing up for"
        right={
          <Pressable
            accessibilityLabel="Search events"
            onPress={() => setFilter(!filter)}
            style={{
              padding: 14,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#d2dae5",
            }}
          >
            <Ionicons name="options-outline" size={24} color="#111827" />
          </Pressable>
        }
      />
      <View
        style={{
          backgroundColor: "#e2e8f0",
          padding: 5,
          borderRadius: 18,
          flexDirection: "row",
          marginTop: -9,
        }}
      >
        {["Forthcoming", "Past events"].map((label, i) => (
          <Pressable
            key={label}
            onPress={() => setPast(i === 1)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 14,
              borderRadius: 15,
              backgroundColor: past === (i === 1) ? "white" : "transparent",
            }}
          >
            <Text
              style={{
                fontWeight: "700",
                color: past === (i === 1) ? "#008bc1" : "#748193",
                fontSize: 15,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 9 }}
      >
        {["All", "Conference", "Workshop", "Online", "Networking"].map(
          (item) => (
            <Pressable
              key={item}
              onPress={() => setType(item)}
              style={{
                borderWidth: 1,
                borderColor: type === item ? "#008bc1" : "#cfd7e2",
                borderRadius: 24,
                paddingVertical: 11,
                paddingHorizontal: 16,
                backgroundColor: type === item ? "#e0f4ff" : "transparent",
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 14,
                  color: type === item ? "#087aa6" : "#67768b",
                }}
              >
                {item}
              </Text>
            </Pressable>
          ),
        )}
      </ScrollView>
      {filter && (
        <TextInput
          accessibilityLabel="Search events by name"
          value={search}
          onChangeText={setSearch}
          placeholder="Search events"
          style={styles.input}
        />  
      )}
      <View style={{ gap: 14, marginTop: 0 }}>
        {q.isPending ? (
          <Skeleton />
        ) : !rows?.length ? (
          <Empty
            message={
              past
                ? "Past programmes will appear here."
                : "No events match your filters."
            }
          />
        ) : (
          rows.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </View>
    </Screen>
  );
}
