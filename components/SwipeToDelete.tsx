import { useRef } from "react";
import { View, Text, Animated, TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import FontAwesome from "@expo/vector-icons/FontAwesome";

type Props = {
  onDelete: () => void;
  children: React.ReactNode;
};

export default function SwipeToDelete({ onDelete, children }: Props) {
  const swipeRef = useRef<Swipeable>(null);

  function renderRightActions(
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        className="bg-danger rounded-xl justify-center items-center px-5 mb-2"
        onPress={() => {
          swipeRef.current?.close();
          onDelete();
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <FontAwesome name="trash" size={20} color="#fff" />
          <Text className="text-white text-xs mt-1">Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}
