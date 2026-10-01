import { Text, TextInput } from "react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ChamberEvent, Plan, News } from "@sme/types";
import { api } from "../lib/api";
import { Screen, styles, Skeleton, ErrorState, Empty } from "../components/ui";
import { EventCard, PlanCard, NewsCard } from "../components/cards";
export function ListScreen({
  kind,
}: {
  kind: "events" | "membership" | "news";
}) {
  const [search, setSearch] = useState("");
  const path = kind === "membership" ? "membership-plans" : kind;
  const q = useQuery({
    queryKey: [path],
    queryFn: () => api<(ChamberEvent | Plan | News)[]>("/" + path),
  });
  const rows = q.data?.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Screen
      title={kind === "news" ? "News & Updates" : undefined}
      refreshing={q.isRefetching}
      onRefresh={() => void q.refetch()}
    >
      <Text style={styles.eyebrow}>SME CHAMBER OF INDIA</Text>
      <Text style={styles.title}>
        {kind === "events"
          ? "Connect at our events"
          : kind === "membership"
            ? "Grow with the Chamber"
            : "Chamber news & insights"}
      </Text>
      <Text style={styles.muted}>
        {kind === "events"
          ? "Conferences, knowledge sessions and opportunities to build your network. Guest registrations welcome."
          : kind === "membership"
            ? "Choose the membership that supports your business ambitions."
            : "The latest from our business community."}
      </Text>
      <TextInput
        accessibilityLabel="Search"
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Search..."
      />
      {q.isPending ? (
        <Skeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : !rows?.length ? (
        <Empty message="No published items found." />
      ) : (
        rows.map((row) =>
          kind === "events" ? (
            <EventCard key={row.id} event={row as ChamberEvent} />
          ) : kind === "membership" ? (
            <PlanCard key={row.id} plan={row as Plan} />
          ) : (
            <NewsCard key={row.id} news={row as News} />
          ),
        )
      )}
    </Screen>
  );
}
