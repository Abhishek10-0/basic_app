import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, PageHeader } from "./ui";

export function ChamberContent({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Screen>
      <PageHeader
        title={title}
        titleSize={24}
        subtitle="SME Chamber of India"
        back
      />
      <View style={{ marginTop: 6 }}>
        {items.map((item, index) => (
          <View
            key={item}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
              paddingVertical: 15,
              borderBottomWidth: index === items.length - 1 ? 0 : 1,
              borderBottomColor: "#e4e9f0",
            }}
          >
            <Ionicons
              name="arrow-forward"
              color="#008bc1"
              size={18}
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                lineHeight: 21,
                fontWeight: "600",
                color: "#263342",
              }}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
