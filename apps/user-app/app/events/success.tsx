import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, Card, styles, Button } from "../../src/components/ui";
export default function Success() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  return (
    <Screen title="Registration received">
      <Card>
        <Text style={styles.heading}>
          Your free-event registration is confirmed.
        </Text>
        <Text style={styles.text}>Booking reference: {reference}</Text>
        <Text style={styles.muted}>
          A confirmation email has been queued with your programme details.
        </Text>
        <Button onPress={() => router.replace("/events")}>
          Explore more events
        </Button>
      </Card>
    </Screen>
  );
}
