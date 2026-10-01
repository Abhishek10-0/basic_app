import { Text, View, Pressable, ScrollView, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import type { ChamberEvent, News } from "@sme/types";
import { theme } from "@sme/config";
import { api } from "../../src/lib/api";
import { backupEvents, backupNews } from "../../src/lib/backupContent";
import {
  Screen,
  styles,
  Section,
  Skeleton,
  IconTile,
} from "../../src/components/ui";
import { EventCard, NewsCard } from "../../src/components/cards";

export default function Home() {
  const insets = useSafeAreaInsets();
  const [statusBarDark, setStatusBarDark] = useState(false);
  const eventsQuery = useQuery({
    queryKey: ["home", "events"],
    queryFn: () => api<ChamberEvent[]>("/events"),
  });
  const newsQuery = useQuery({
    queryKey: ["home", "news"],
    queryFn: () => api<News[]>("/news"),
  });

  return (
    <Screen
      refreshing={eventsQuery.isRefetching || newsQuery.isRefetching}
      onRefresh={() => {
        void eventsQuery.refetch();
        void newsQuery.refetch();
      }}
      onScroll={(event) => setStatusBarDark(event.nativeEvent.contentOffset.y > 285)}
      edges={["left", "right"]}
      safeAreaBackgroundColor={theme.blue}
      contentBackgroundColor={theme.white}
      statusBarBackgroundColor="transparent"
      statusBarStyle={statusBarDark ? "dark-content" : "light-content"}
      statusBarTranslucent
    >
        <>
          <LinearGradient
            colors={["#0d719f", "#008bc1"]}
            style={{
              marginHorizontal: -18,
              marginTop: -18,
              paddingHorizontal: 19,
              paddingTop: insets.top + 12,
              paddingBottom: 43,
              overflow: "hidden",
              gap: 0,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 23 }}>
              <Pressable accessibilityLabel="Open profile" onPress={() => router.push("/profile")} style={{ flexDirection: "row", alignItems: "center", gap: 9, flex: 1 }}>
                <Image source={require("../../assets/logo.png")} style={{ width: 44, height: 44, borderRadius: 9 }} resizeMode="contain" />
                <View style={{ gap: 1, flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: "white", fontSize: 14, fontWeight: "800" }}>SME Chamber of India</Text>
                  <Text numberOfLines={1} style={{ color: "#b9e1f2", fontSize: 10, fontWeight: "600" }}>Empowering SMEs for Global Competitiveness</Text>
                </View>
              </Pressable>
              <Pressable accessibilityLabel="Notifications" onPress={() => router.push("/notifications")} style={{ height: 34, width: 34, borderRadius: 12, borderWidth: 1, borderColor: "#8fc7dd", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff18" }}>
                <Ionicons name="notifications-outline" size={17} color="#fff" />
                <View style={{ width: 5, height: 5, backgroundColor: "#f6c552", borderRadius: 3, position: "absolute", right: 8, top: 6 }} />
              </Pressable>
            </View>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 230,
                height: 230,
                borderRadius: 120,
                backgroundColor: "#ffffff0a",
                right: -100,
                top: -82,
              }}
            />
            <Text
              style={{
                color: "#b4ddef",
                fontSize: 10,
                letterSpacing: 1.6,
                fontWeight: "700",
                marginBottom: 13,
              }}
            >
              THE SME CHAMBER OF INDIA
            </Text>
            <Text
              style={{
                fontSize: 28,
                lineHeight: 33,
                fontWeight: "700",
                color: "white",
                marginBottom: 11,
              }}
            >
              Empowering SMEs.{"\n"}Building Businesses.
            </Text>
            <Text
              style={{
                color: "#c2e4f4",
                fontSize: 14,
                lineHeight: 20,
                maxWidth: 295,
                marginBottom: 20,
              }}
            >
              {/* A trusted platform for ideas, insight and opportunities that help Indian enterprises move forward. */}
            </Text>
            <Pressable
              onPress={() => router.push("/events")}
              style={{
                paddingVertical: 3,
                paddingHorizontal: 0,
                alignSelf: "flex-start",
                borderBottomWidth: 1,
                borderBottomColor: "#fff",
              }}
            >
              <Text
                style={{ color: "white", fontWeight: "700", fontSize: 12 }}
              >
                Explore events →
              </Text>
            </Pressable>
          </LinearGradient>

          {/* <View style={{ marginHorizontal: -18, backgroundColor: "white", paddingHorizontal: 19, paddingTop: 28, paddingBottom: 10, gap: 11 }}>
            <Text style={styles.eyebrow}>OUR PURPOSE</Text>
            <Text style={styles.heading}>
              A stronger ecosystem for every enterprise.
            </Text>
            <Text style={styles.muted}>
              SME Chamber of India brings businesses, knowledge and opportunity together — with a clear focus on practical progress.
            </Text>
            <Pressable onPress={() => router.push("/about")}>
              <Text
                style={{ color: "#008bc1", fontSize: 13, fontWeight: "700" }}
              >
                Discover our story →
              </Text>
            </Pressable>
          </View> */}

          <Section title="Quick access" />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              rowGap: 23,
              marginBottom: 22,
            }}
          >
            {(
              [
                ["Events", "calendar-outline", "/events"],
                ["Membership", "ribbon-outline", "/membership"],
                ["Activities", "layers-outline", "/activities"],
                ["Support", "globe-outline", "/services"],
                ["Join Us", "person-add-outline", "/join-us"],
                ["Contact", "call-outline", "/contact"],
                ["About", "information-circle-outline", "/about"],
                ["Biz Alerts", "newspaper-outline", "/biz-alerts"],
                ["Boards", "people-outline", "/boards"],
              ] as const
            ).map(([title, icon, url]) => (
              <Pressable
                key={title}
                onPress={() => router.push(url)}
                style={{ width: "33.33%", alignItems: "center", gap: 9 }}
              >
                <IconTile name={icon} />
                <Text
                  style={{ fontSize: 11, fontWeight: "600", color: "#17212f" }}
                >
                  {title}
                </Text>
              </Pressable>
            ))}
          </View>

          <Section
            title="Upcoming events"
            action="View all"
            onPress={() => router.push("/events")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 13, paddingRight: 18 }}
            style={{ marginRight: -18, marginTop: -6 }}
          >
            {eventsQuery.isPending ? (
              <Skeleton />
            ) : eventsQuery.isError ? (
              backupEvents.map((event) => (
                <EventCard key={event.id} event={event} compact />
              ))
            ) : (
              eventsQuery.data.map((e) => <EventCard key={e.id} event={e} compact />)
            )}
          </ScrollView>

          <LinearGradient
            colors={["#dff2ff", "#ffffff"]}
            style={{
              borderWidth: 1,
              borderColor: "#d5dce6",
              borderRadius: 22,
              padding: 20,
              gap: 11,
              marginTop: 22,
            }}
          >
            <Text style={styles.eyebrow}>MEMBERSHIP</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
            >
              <View style={{ flex: 1, gap: 8 }}>
                <Text
                  style={{
                    fontSize: 19,
                    fontWeight: "700",
                    lineHeight: 25,
                    color: "#111827",
                  }}
                >
                  Belong to a community that moves business forward.
                </Text>
                <Text style={styles.muted}>
                  Access conversations, learning and meaningful connections for
                  your next stage of growth.
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 23,
                  padding: 14,
                }}
              >
                <Ionicons name="ribbon" color="#008bc1" size={35} />
              </View>
            </View>
            <Pressable
              onPress={() => router.push("/membership")}
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#008bc1",
                padding: 14,
                alignSelf: "flex-start",
                backgroundColor: "white",
              }}
            >
              <Text
                style={{ fontSize: 14, color: "#008bc1", fontWeight: "700" }}
              >
                Explore membership →
              </Text>
            </Pressable>
          </LinearGradient>

          <View style={{ marginTop: 7 }}>
            <Section
              title="Biz alerts"
              action="See all"
              onPress={() => router.push("/biz-alerts")}
            />
          </View>
          {newsQuery.isPending ? (
            <Skeleton />
          ) : newsQuery.isError ? (
            backupNews.map((news) => <NewsCard key={news.id} news={news} />)
          ) : (
            newsQuery.data.slice(0, 2).map((n) => <NewsCard key={n.id} news={n} />)
          )}

          <View style={{ paddingVertical: 42, alignItems: "center", gap: 7 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                fontStyle: "italic",
                color: "#00739f",
              }}
            >
              “When SMEs grow, India grows.”
            </Text>
            <Text style={{ fontSize: 11, color: "#748193" }}>
              — SME Chamber of India
            </Text>
          </View>
        </>
    </Screen>
  );
}
