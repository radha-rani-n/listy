import { Stack, useRouter, useNavigation } from "expo-router";
import { TouchableOpacity } from "react-native";
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
          <TouchableOpacity onPress={goBack} style={{ marginRight: 12 }}>
            <FontAwesome name="chevron-left" size={18} color="#4F46E5" />
          </TouchableOpacity>
        ),
      }}
    />
  );
}
