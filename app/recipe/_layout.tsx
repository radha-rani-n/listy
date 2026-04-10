import { Stack, useRouter, useNavigation } from "expo-router";
import { TouchableOpacity, View, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function RecipeLayout() {
  const router = useRouter();
  const navigation = useNavigation();

  function goBack() {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        router.replace("/(tabs)/recipes");
      }
    } catch {
      router.replace("/(tabs)/recipes");
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={goBack} style={{ marginLeft: 16, marginRight: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <FontAwesome name="chevron-left" size={16} color="#4F46E5" />
              <Text style={{ color: "#4F46E5", fontSize: 16, marginLeft: 6, fontWeight: "500" }}>Back</Text>
            </View>
          </TouchableOpacity>
        ),
      }}
    />
  );
}
