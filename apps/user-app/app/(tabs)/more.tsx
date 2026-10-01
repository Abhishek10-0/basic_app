import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, PageHeader, IconTile, styles } from "../../src/components/ui";
const groups = [
  {
    title: "EXPLORE",
    items: [
      [
        "About us",
        "Our people, purpose and journey",
        "information-circle-outline",
        "/about",
      ],
      ["Objectives", "What the Chamber works to achieve", "compass-outline", "/objectives"],
      [
        "Activities",
        "Programmes that move ideas forward",
        "layers-outline",
        "/activities",
      ],
      ["Services", "Business support for growing enterprises", "briefcase-outline", "/services"],
      ["Finance & Investment", "Finance, investors and strategic partners", "cash-outline", "/finance-investment"],
      ["International Business", "Global partnerships and market access", "globe-outline", "/international-business"],
      ["Specialised Services", "Focused support for SME excellence", "sparkles-outline", "/specialised-services"],
      ["Initiatives", "Platforms and councils for enterprise growth", "layers-outline", "/initiatives"],
      ["International Trade", "India's international trade councils", "earth-outline", "/international-trade"],
      [
        "Support services",
        "Practical help for growing businesses",
        "globe-outline",
        "/services",
      ],
      [
        "Biz Alerts",
        "Updates that matter to SMEs",
        "newspaper-outline",
        "/biz-alerts",
      ],
      [
        "Boards",
        "Meet the people guiding the Chamber",
        "people-outline",
        "/boards",
      ],
      [
        "Gallery & media",
        "A look at our community in action",
        "images-outline",
        "/gallery",
      ],
    ],
  },
  {
    title: "CONNECT",
    items: [
      [
        "Join us",
        "Become part of the SME community",
        "person-add-outline",
        "/join-us",
      ],
      ["Contact", "We’re here to help", "call-outline", "/contact"],
      [
        "Notifications",
        "Stay close to Chamber updates",
        "notifications-outline",
        "/notifications",
      ],
    ],
  },
  {
    title: "INFORMATION",
    items: [
      [
        "Privacy policy",
        "How we look after your information",
        "shield-checkmark-outline",
        "/privacy",
      ],
      [
        "Disclaimer",
        "Important information for members",
        "document-text-outline",
        "/disclaimer",
      ],
      [
        "My account",
        "Profile, membership and bookings",
        "person-circle-outline",
        "/profile",
      ],
    ],
  },
] as const;
export default function More() {
  const [search, setSearch] = useState("");
  return (
    <Screen>
      <PageHeader
        title="More"
        subtitle="Everything else, made simple"
        right={
          <View
            style={{
              padding: 15,
              borderWidth: 1,
              borderColor: "#d2dae5",
              borderRadius: 20,
            }}
          >
            <Ionicons name="grid-outline" size={26} color="#008bc1" />
          </View>
        }
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#d2dae5",
          borderRadius: 20,
          paddingHorizontal: 17,
          backgroundColor: "white",
          gap: 10,
          marginTop: -15,
        }}
      >
        <Ionicons name="search-outline" size={22} color="#748193" />
        <TextInput
          accessibilityLabel="Search More"
          placeholder="Search events, alerts and services"
          value={search}
          onChangeText={setSearch}
          style={{
            flex: 1,
            paddingVertical: 19,
            fontSize: 14,
            color: "#263342",
          }}
        />
        <Ionicons name="arrow-forward" size={21} color="#008bc1" />
      </View>
      {groups.map((group) => {
        const items = group.items.filter((i) =>
          i[0].toLowerCase().includes(search.toLowerCase()),
        );
        return (
          !!items.length && (
            <View key={group.title} style={{ gap: 12, marginTop: 15 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: "#65768b",
                  fontWeight: "700",
                  letterSpacing: 1.7,
                  marginBottom: 1,
                }}
              >
                {group.title}
              </Text>
              {items.map(([title, subtitle, icon, url]) => (
                <Pressable
                  key={`${group.title}-${title}`}
                  onPress={() => router.push(url)}
                  style={[
                    styles.card,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 16,
                      gap: 14,
                    },
                  ]}
                >
                  <IconTile name={icon} />
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {title}
                    </Text>
                    <Text
                      style={{ fontSize: 13, lineHeight: 18, color: "#748193" }}
                    >
                      {subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={19} color="#748193" />
                </Pressable>
              ))}
            </View>
          )
        );
      })}
      <View
        style={{
          alignItems: "center",
          gap: 14,
          paddingTop: 24,
          paddingBottom: 30,
        }}
      >
        <View
          style={{ padding: 14, borderRadius: 17, backgroundColor: "#008bc1" }}
        >
          <Text style={{ fontWeight: "700", color: "white", fontSize: 17 }}>
            SME
          </Text>
        </View>
        <Text style={styles.muted}>Version 1.0 · English</Text>
      </View>
    </Screen>
  );
}
