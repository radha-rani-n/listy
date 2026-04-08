import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { onAuthChange } from "@/lib/api";
import { registerForPushNotifications } from "@/lib/notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        registerForPushNotifications();
      }
    });
    return unsubscribe;
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="list" options={{ headerShown: false }} />
        <Stack.Screen name="pantry" options={{ headerShown: false }} />
        <Stack.Screen name="meal" options={{ headerShown: false }} />
        <Stack.Screen name="recipe" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
