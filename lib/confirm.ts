import { Alert, Platform } from "react-native";

/**
 * Cross-platform confirm dialog that works on both web and mobile.
 * Returns true if user confirmed, false if cancelled.
 */
export function confirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "OK", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

/**
 * Cross-platform success/info toast.
 */
export function notify(title: string, message?: string) {
  if (Platform.OS === "web") {
    // On web, just log it — better than blocking alert
    console.log(`✓ ${title}${message ? ": " + message : ""}`);
    return;
  }
  Alert.alert(title, message);
}
