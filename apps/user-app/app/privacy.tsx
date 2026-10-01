import { Text } from "react-native";
import { router } from "expo-router";
import { Screen, Card, styles, Button } from "../src/components/ui";
export default function Page() {
  return (
    <Screen title="Privacy policy">
      <Card>
        <Text style={styles.text}>
          Your account and registration details are used to manage your Chamber
          membership, event bookings and enquiries. Payments are processed
          through Razorpay. For questions about your information or a request to
          update or remove it, contact the Chamber using the Contact page.
        </Text>
        <Button secondary onPress={() => router.push("/contact")}>
          Contact the Chamber
        </Button>
      </Card>
    </Screen>
  );
}
