import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { signIn, signInWithGoogle, resetPassword } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  async function handleSignIn() {
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)/lists");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Email or password doesn't match. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Something went wrong.");
      }
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/(tabs)/lists");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user") {
        // User closed the popup, don't show error
      } else {
        setError(err.message || "Google sign-in failed.");
      }
    }
    setGoogleLoading(false);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email above, then tap Forgot Password.");
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert("Check your email", "We've sent a password reset link to " + email.trim());
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Something went wrong.");
      }
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ResponsiveContainer>
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-textPrimary text-center mb-2">
          Welcome Back
        </Text>
        <Text className="text-textSecondary text-center mb-8">
          Sign in to your Listy account
        </Text>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-danger text-sm text-center">{error}</Text>
          </View>
        ) : null}

        {/* Google Sign In */}
        <TouchableOpacity
          className="bg-card border border-gray-200 rounded-lg py-3.5 flex-row items-center justify-center mb-4"
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color="#4F46E5" />
          ) : (
            <>
              <FontAwesome name="google" size={18} color="#DB4437" />
              <Text className="text-textPrimary font-semibold text-base ml-2">Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="text-textSecondary text-xs mx-3">or</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        <Text className="text-sm font-medium text-textPrimary mb-1">Email</Text>
        <TextInput
          className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-4 text-textPrimary"
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Text className="text-sm font-medium text-textPrimary mb-1">
          Password
        </Text>
        <View className="flex-row items-center bg-card border border-gray-200 rounded-lg mb-2">
          <TextInput
            className="flex-1 px-4 py-3 text-textPrimary"
            placeholder="Your password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="password"
          />
          <TouchableOpacity className="px-3" onPress={() => setShowPassword(!showPassword)}>
            <Text className="text-primary text-sm font-medium">{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleForgotPassword} className="mb-6">
          <Text className="text-primary text-sm">Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-primary rounded-lg py-3.5 items-center"
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-textSecondary">Don't have an account? </Text>
          <Link href="/(auth)/sign-up">
            <Text className="text-primary font-semibold">Sign Up</Text>
          </Link>
        </View>
      </ScrollView>
      </ResponsiveContainer>
    </KeyboardAvoidingView>
  );
}
