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
} from "react-native";
import { Link, useRouter } from "expo-router";
import { signUp } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  async function handleSignUp() {
    setError("");
    if (!email || !password || !displayName) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace("/(tabs)/lists");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setError("This email is already registered. Try signing in.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(err.message || "Something went wrong.");
      }
    }
    setLoading(false);
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
          Create Account
        </Text>
        <Text className="text-textSecondary text-center mb-8">
          Sign up to start managing your grocery lists
        </Text>

        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-danger text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <Text className="text-sm font-medium text-textPrimary mb-1">
          Display Name
        </Text>
        <TextInput
          className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-4 text-textPrimary"
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />

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
        <View className="flex-row items-center bg-card border border-gray-200 rounded-lg mb-6">
          <TextInput
            className="flex-1 px-4 py-3 text-textPrimary"
            placeholder="At least 6 characters"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="newPassword"
          />
          <TouchableOpacity className="px-3" onPress={() => setShowPassword(!showPassword)}>
            <Text className="text-primary text-sm font-medium">{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-primary rounded-lg py-3.5 items-center"
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Sign Up</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-textSecondary">Already have an account? </Text>
          <Link href="/(auth)/sign-in">
            <Text className="text-primary font-semibold">Sign In</Text>
          </Link>
        </View>
      </ScrollView>
      </ResponsiveContainer>
    </KeyboardAvoidingView>
  );
}
