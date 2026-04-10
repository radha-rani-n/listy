import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

type Props = {
  message: string | null;
  type?: "success" | "error" | "info";
  onHide: () => void;
};

export default function Toast({ message, type = "success", onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        onHide();
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  const colors = {
    success: { bg: "#10B981", icon: "check-circle" },
    error: { bg: "#EF4444", icon: "exclamation-circle" },
    info: { bg: "#4F46E5", icon: "info-circle" },
  };
  const c = colors[type];

  return (
    <Animated.View
      style={{
        opacity,
        position: "absolute",
        top: 20,
        left: 16,
        right: 16,
        backgroundColor: c.bg,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        zIndex: 9999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <FontAwesome name={c.icon as any} size={16} color="#fff" />
      <Text style={{ color: "#fff", marginLeft: 8, flex: 1, fontWeight: "500" }} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}
