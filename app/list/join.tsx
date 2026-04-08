import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { joinByInvite } from "@/lib/api";

export default function JoinListScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleJoin() {
    setError("");
    if (!code.trim()) { setError("Please enter an invite code."); return; }

    setLoading(true);
    try {
      const data = await joinByInvite(code.trim());
      router.replace(`/list/${data.list_id}`);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-background px-6 pt-6">
      <Stack.Screen options={{ title: "Join a List", headerShown: true }} />
      <Text className="text-sm font-medium text-textPrimary mb-1">Invite Code</Text>
      <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-4 text-textPrimary text-center text-lg tracking-widest" placeholder="Enter code" placeholderTextColor="#9CA3AF" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} autoFocus />
      {error ? <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><Text className="text-danger text-sm text-center">{error}</Text></View> : null}
      <TouchableOpacity className="bg-primary rounded-lg py-3.5 items-center" onPress={handleJoin} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Join List</Text>}
      </TouchableOpacity>
    </View>
  );
}
