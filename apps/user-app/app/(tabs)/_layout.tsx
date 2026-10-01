import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
export default function Layout() {
 const insets=useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#008bc1",
        tabBarInactiveTintColor: "#748193",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: "#e0e6ee",
          width: "100%",
          paddingTop: 7,
          height: 64 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: "below-icon",
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          paddingHorizontal: 0,
          paddingVertical: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      {(
        [
          ["index", "Home", "home-outline"],
          
          ["events", "Events", "calendar-outline"],
          ["membership", "Member", "ribbon-outline"],
          ["profile", "Profile", "person-circle-outline"],
          ["more", "More", "grid-outline"],
        ] as const
      ).map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  backgroundColor: focused ? "#dff3ff" : "transparent",
                  paddingHorizontal: 4,
                  paddingVertical: 3,
                  borderRadius: 12,
                }}
              >
                <Ionicons name={icon} color={color} size={23} />
              </View>
            ),
          }}
        />
      ))}
      <Tabs.Screen name="join-us" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
    </Tabs>
  );
}
