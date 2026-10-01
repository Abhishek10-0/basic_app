import { Image, Linking, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { money, date } from "@sme/shared";
import type { ChamberEvent, Plan, News } from "@sme/types";
import { Button, styles, IconTile } from "./ui";
const blue = "#008bc1";
const eventTime = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
};
export function EventCard({
  event,
  compact = false,
}: {
  event: ChamberEvent;
  compact?: boolean;
}) {
  const eventDate = new Date(event.startDate);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${event.title} website`}
      onPress={() => {
        if (event.eventUrl) void Linking.openURL(event.eventUrl);
      }}
      style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#d3dae5",
        overflow: "hidden",
        backgroundColor: "white",
        width: compact ? 280 : "100%",
        minHeight: compact ? 300 : 320,
      }}
    >
      {event.bannerImage ? (
        <Image
          source={{ uri: event.bannerImage }}
          accessibilityLabel={`${event.title} event image`}
          resizeMode="contain"
          style={{
            width: "100%",
            height: compact ? 158 : 210,
            backgroundColor: "#eef3f7",
          }}
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: compact ? 158 : 210,
            backgroundColor: "#e6f4fa",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="image-outline" color={blue} size={38} />
        </View>
      )}
      <View style={{ padding: compact ? 16 : 18, gap: 9, flex: 1 }}>
        <Text
          style={{
            color: blue,
            fontSize: 8,
            fontWeight: "800",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {event.eventType}
        </Text>
        <Text
          style={{
            fontSize: compact ? 15 : 17,
            lineHeight: 22,
            fontWeight: "700",
            color: "#111827",
          }}
          numberOfLines={3}
        >
          {event.title}
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            marginTop: "auto",
          }}
        >
          <View
            style={{
              width: 52,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#d7dee8",
              backgroundColor: "#f8fafc",
              alignItems: "center",
              paddingVertical: 6,
            }}
          >
           <Text
  style={{
    color: "#111111",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "400",
    // fontFamily: "serif",
  }}
>
  {eventDate.getDate()}
</Text>
           <Text
  style={{
    color: "#555555",
    fontSize: 8,
    fontWeight: "400",
    letterSpacing: 0.5,
  }}
>
  {eventDate
    .toLocaleDateString("en-IN", { month: "short" })
    .toUpperCase()}
</Text>
          </View>
          <View style={{ gap: 7, flex: 1 }}>
            <View
              style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
            >
              <Ionicons name="time-outline" size={14} color="#748193" />
              <Text style={{ fontSize: 12, color: "#748193" }}>
                {eventTime(event.startTime)} – {eventTime(event.endTime)}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
            >
              <Ionicons
                name={
                  event.eventType === "Online"
                    ? "videocam-outline"
                    : "location-outline"
                }
                size={14}
                color="#748193"
              />
              <Text
                numberOfLines={1}
                style={{ fontSize: 12, color: "#748193", flex: 1 }}
              >
                {[event.venue, event.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: plan.featured ? blue : "#d3dae5",
          borderWidth: plan.featured ? 1.5 : 1,
          padding: 18,
          paddingTop: plan.featured ? 31 : 22,
          overflow: "hidden",
        },
      ]}
    >
      {plan.featured && (
        <Text
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            backgroundColor: blue,
            color: "white",
            fontSize: 9,
            fontWeight: "700",
            padding: 9,
            borderBottomLeftRadius: 12,
            letterSpacing: 1,
          }}
        >
          MOST POPULAR
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          justifyContent: "space-between",
        }}
      >
        <Text style={[styles.heading, { flex: 1 }]}>{plan.title}</Text>
        <Text style={{ color: "#086b9b", fontWeight: "700", fontSize: 15 }}>
          {money(plan.price)}
        </Text>
      </View>
      <Text style={styles.muted}>{plan.shortDescription}</Text>
      <Text style={styles.eyebrow}>VALID FOR {plan.durationMonths} MONTHS</Text>
      {plan.benefits.map((b) => (
        <View style={{ flexDirection: "row", gap: 6 }} key={b}>
          <Ionicons name="checkmark-circle" size={16} color="#1b9e53" />
          <Text style={{ color: "#263342", fontSize: 13, flex: 1 }}>{b}</Text>
        </View>
      ))}
      <Button onPress={() => router.push(`/membership/${plan.slug}`)}>
        Apply for membership
      </Button>
    </View>
  );
}
export function NewsCard({ news }: { news: News }) {
  return (
    <Pressable onPress={() => router.push(`/news/${news.slug}`)}>
      <View
        style={[styles.card, { flexDirection: "row", padding: 14, gap: 11 }]}
      >
        <IconTile name="newspaper-outline" size={19} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.row}>
            <Text
              style={{
                fontSize: 9,
                color: blue,
                fontWeight: "700",
                textTransform: "uppercase",
                flex: 1,
              }}
            >
              {news.category}
            </Text>
            <Text style={{ fontSize: 9, color: "#748193" }}>
              {date(news.publishedAt)}
            </Text>
          </View>
          <Text
            style={{
              color: "#111827",
              fontWeight: "700",
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {news.title}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color="#748193" />
      </View>
    </Pressable>
  );
}
