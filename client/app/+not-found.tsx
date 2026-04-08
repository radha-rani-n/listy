import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-xl font-bold text-textPrimary">
          This screen doesn't exist.
        </Text>
        <Link href="/(tabs)/lists" className="mt-4">
          <Text className="text-primary text-base">Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}
