import { auth } from "./firebase";
import { router } from "expo-router";

// Call this before any action that requires authentication.
// Returns true if logged in, false if redirected to sign-in.
export function requireAuth(): boolean {
  if (auth.currentUser) return true;
  router.push("/(auth)/sign-in");
  return false;
}
