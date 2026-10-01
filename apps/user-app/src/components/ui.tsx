import { useCallback, type ReactNode } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme as c } from "@sme/config";
import { radii } from "@sme/ui";
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  body: {
    padding: 18,
    paddingBottom: 36,
    gap: 22,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radii.card,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: "700", color: c.text, lineHeight: 35 },
  heading: { fontSize: 21, fontWeight: "700", color: c.text, lineHeight: 28 },
  text: { fontSize: 15, lineHeight: 24, color: c.text },
  muted: { fontSize: 15, lineHeight: 23, color: c.muted },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: c.gold,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    backgroundColor: c.blue,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  input: {
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
    fontSize: 15,
    color: c.text,
    backgroundColor: "white",
    minHeight: 48,
  },
  label: { color: c.text, fontSize: 15, fontWeight: "700", marginBottom: 8 },
  error: { fontSize: 13, color: "#ad3a34", lineHeight: 20 },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    color: c.blue,
    backgroundColor: "#eaf1f9",
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: "flex-start",
    borderRadius: 3,
  },
  divider: { height: 1, backgroundColor: c.border },
});
export function Screen({
  children,
  title,
  refreshing,
  onRefresh,
  onScroll,
  edges = ["top", "left", "right"],
  safeAreaBackgroundColor = c.background,
  contentBackgroundColor = c.background,
  statusBarBackgroundColor = c.background,
  statusBarStyle = "dark-content",
  statusBarTranslucent = false,
}: {
  children: ReactNode;
  title?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  onScroll?: (event: Parameters<NonNullable<React.ComponentProps<typeof ScrollView>["onScroll"]>>[0]) => void;
  edges?: ("top" | "bottom" | "left" | "right")[];
  safeAreaBackgroundColor?: string;
  contentBackgroundColor?: string;
  statusBarBackgroundColor?: string;
  statusBarStyle?: "dark-content" | "light-content";
  statusBarTranslucent?: boolean;
}) {
  const insets=useSafeAreaInsets();
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(statusBarStyle, true);
      StatusBar.setBackgroundColor(statusBarBackgroundColor, true);
      StatusBar.setTranslucent(statusBarTranslucent);
    }, [statusBarBackgroundColor, statusBarStyle, statusBarTranslucent]),
  );
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: safeAreaBackgroundColor }]} edges={edges}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ backgroundColor: contentBackgroundColor }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          contentContainerStyle={[styles.body,{paddingBottom:36+insets.bottom}]}
        >
          {!!title && <PageHeader title={title} back />}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Button({
  children,
  onPress,
  loading,
  secondary,
  disabled,
}: {
  children: ReactNode;
  onPress: () => void;
  loading?: boolean;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && { backgroundColor: "#dff3ff" },
        (loading || disabled || pressed) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? c.navy : "white"} />
      ) : (
        <Text style={[styles.buttonText, secondary && { color: c.text }]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.heading}>{title}</Text>
      {!!action && (
        <Pressable onPress={onPress}>
          <Text style={{ fontSize: 12, color: c.blue, fontWeight: "600" }}>
            {action} →
          </Text>
        </Pressable>
      )}
    </View>
  );
}
export function Field({
  placeholder,
  label,
  value,
  onChange,
  error,
  secure,
  multiline,
  keyboard = "default",
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  secure?: boolean;
  multiline?: boolean;
  keyboard?: "default" | "email-address" | "phone-pad" | "numeric";
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder ?? label.replace(/ \*$/, "")}
        placeholderTextColor="#7d8999"
        style={[
          styles.input,
          multiline && { minHeight: 105, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        multiline={multiline}
        keyboardType={keyboard}
        autoCapitalize={
          keyboard === "email-address" || secure ? "none" : "sentences"
        }
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
export function Empty({ message = "No records yet." }: { message?: string }) {
  return (
    <Card>
      <Ionicons name="file-tray-outline" size={32} color={c.muted} />
      <Text style={styles.muted}>{message}</Text>
    </Card>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <Card>
      <Text style={styles.error}>{error.message}</Text>
      <Button secondary onPress={retry}>
        Try again
      </Button>
    </Card>
  );
}
export function Skeleton() {
  return (
    <View accessibilityLabel="Loading content" style={{ gap: 14 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{ height: 112, backgroundColor: "#e5ecf4", borderRadius: 7 }}
        />
      ))}
    </View>
  );
}
export function LoginRequired({
  returnTo = "/profile",
}: {
  returnTo?: string;
}) {
  return (
    <Card>
      <Text style={styles.heading}>Your Chamber account</Text>
      <Text style={styles.muted}>
        Sign in to manage your membership and account.
      </Text>
      <Button
        onPress={() =>
          router.push({ pathname: "/auth/login", params: { returnTo } })
        }
      >
        Log in / Sign up
      </Button>
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  right,
  titleSize,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  titleSize?: number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        paddingTop: 8,
      }}
    >
      {back && (
        <Pressable
          accessibilityLabel="Go back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={{
            width: 44,
            height: 44,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: "white",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontSize: titleSize ?? 30,
            lineHeight: 36,
            fontWeight: "700",
            color: c.text,
          }}
        >
          {title}
        </Text>
        {!!subtitle && <Text style={styles.muted}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}
export function IconTile({
  name,
  size = 22,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
}) {
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "#dff3ff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size} color={c.blue} />
    </View>
  );
}
