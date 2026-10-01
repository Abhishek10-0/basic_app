import { useEffect, useRef } from "react";
import {
  Animated,
  ImageBackground,
  View,
  StyleSheet,
  AccessibilityInfo,
} from "react-native";
export function Loader() {
  const pulse = useRef(new Animated.Value(1)).current;
  const shine = useRef(new Animated.Value(-150)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || !mounted) return;
      animation = Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 1.055,
              duration: 1300,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 1,
              duration: 1300,
              useNativeDriver: true,
            }),
          ]),
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(shine, {
              toValue: 180,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.delay(1200),
            Animated.timing(shine, {
              toValue: -150,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]);
      animation.start();
    });
    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [pulse, shine]);
  return (
    <ImageBackground
      source={require("../../assets/loader-background.png")}
      style={styles.background}
      resizeMode="cover"
      accessibilityLabel="Loading SME Chamber"
    >
      <View style={styles.glow} />
      <Animated.Image
        source={require("../../assets/logo.png")}
        style={{ width: 124, height: 124, transform: [{ scale: pulse }] }}
      />
      <View pointerEvents="none" style={styles.mask}>
        <Animated.View
          style={{
            width: 28,
            height: 190,
            backgroundColor: "#ffffff66",
            transform: [{ translateX: shine }, { rotate: "18deg" }],
          }}
        />
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dff4ff",
  },
  glow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#ffffff70",
  },
  mask: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    overflow: "hidden",
  },
});
