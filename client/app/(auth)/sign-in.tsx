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
import { signIn } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
      setError(err.message);
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
