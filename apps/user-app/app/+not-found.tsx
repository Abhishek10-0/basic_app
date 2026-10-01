import { router } from "expo-router";
import { Text } from "react-native";
import { Screen, Card, Button, styles } from "../src/components/ui";
export default function NotFound() {
  return (
    <Screen title="Page not found">
      <Card>
        <Text style={styles.text}>This page is unavailable.</Text>
        <Button onPress={() => router.replace("/")}>Return home</Button>
      </Card>
    </Screen>
  );
}
