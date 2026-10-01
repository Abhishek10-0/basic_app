import { Text } from "react-native";
import { router } from "expo-router";
import { Screen, Card, styles, Button } from "../src/components/ui";
export default function Page() {
  return (
    <Screen title="Disclaimer">
      <Card>
        <Text style={styles.text}>
          Programme details, availability and membership benefits may change.
          The event and membership details shown at checkout apply to your
          registration. Contact the Chamber for clarification before making a
          payment.
        </Text>
        <Button secondary onPress={() => router.push("/contact")}>
          Contact the Chamber
        </Button>
      </Card>
    </Screen>
  );
}
