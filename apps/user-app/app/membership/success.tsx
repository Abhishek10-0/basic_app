import { router } from "expo-router";
import { Text } from "react-native";
import { Screen, Card, styles, Button } from "../../src/components/ui";
export default function Success() {
  return (
    <Screen title="Membership status">
      <Card>
        <Text style={styles.heading}>Check your membership</Text>
        <Text style={styles.text}>
          Your membership becomes active after payment is verified by the
          server.
        </Text>
        <Button onPress={() => router.replace("/my-membership")}>
          View my membership
        </Button>
      </Card>
    </Screen>
  );
}
