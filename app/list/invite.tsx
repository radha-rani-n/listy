import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Share } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { createInvite } from "@/lib/api";

export default function InviteScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await createInvite(listId!);
        setCode(data.code);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleShare() {
    if (!code) return;
    await Share.share({ message: `Join my Listy shopping list! Use invite code: ${code}` });
  }

  return (
    <View className="flex-1 bg-background px-6 pt-10 items-center">
      <Stack.Screen options={{ title: "Invite", headerShown: true }} />
      <FontAwesome name="user-plus" size={48} color="#4F46E5" />
      <Text className="text-xl font-bold text-textPrimary mt-4">Invite to List</Text>
      <Text className="text-textSecondary mt-1 text-center">Share this code so others can join your list</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" className="mt-8" />
      ) : error ? (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3 mt-6"><Text className="text-danger text-sm text-center">{error}</Text></View>
      ) : (
        <>
          <View className="bg-card border-2 border-dashed border-primary rounded-xl px-8 py-5 mt-8">
            <Text className="text-3xl font-bold text-primary tracking-widest text-center">{code}</Text>
          </View>
          <Text className="text-xs text-textSecondary mt-2">Expires in 7 days</Text>
          <TouchableOpacity className="bg-primary rounded-lg px-8 py-3.5 mt-6 flex-row items-center" onPress={handleShare} activeOpacity={0.8}>
            <FontAwesome name="share" size={16} color="#fff" />
            <Text className="text-white font-semibold text-base ml-2">Share Code</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
