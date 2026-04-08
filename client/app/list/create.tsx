import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { Stack, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { createList } from "@/lib/api";

const ICONS = ["shopping-cart", "list-ul", "gift", "home", "briefcase", "heart", "star", "plane", "cutlery", "birthday-cake", "paw", "car"];
const COLORS = ["#4F46E5", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316"];

export default function CreateListScreen() {
  const [name, setName] = useState("");
  const [folder, setFolder] = useState("");
  const [icon, setIcon] = useState("shopping-cart");
  const [color, setColor] = useState("#4F46E5");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    setError("");
    if (!name.trim()) { setError("List name is required."); return; }
    setLoading(true);
    try {
      const list = await createList(name.trim(), folder.trim() || undefined, icon, color);
      router.replace(`/list/${list.id}`);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pt-6 pb-10">
      <Stack.Screen options={{ title: "Create List" }} />

      {/* Preview */}
      <View className="items-center mb-6">
        <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
          <FontAwesome name={icon as any} size={28} color={color} />
        </View>
      </View>

      <Text className="text-sm font-medium text-textPrimary mb-1">List Name</Text>
      <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-3 text-textPrimary" placeholder="e.g. Weekly Groceries" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} autoFocus onSubmitEditing={handleCreate} returnKeyType="done" />

      <Text className="text-sm font-medium text-textPrimary mb-1">Folder (optional)</Text>
      <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-4 text-textPrimary" placeholder="e.g. Home, Work, Holiday" placeholderTextColor="#9CA3AF" value={folder} onChangeText={setFolder} />

      <Text className="text-sm font-medium text-textPrimary mb-2">Icon</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {ICONS.map((i) => (
          <TouchableOpacity
            key={i}
            style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: icon === i ? color + "20" : "#F3F4F6", alignItems: "center", justifyContent: "center", borderWidth: icon === i ? 2 : 0, borderColor: color }}
            onPress={() => setIcon(i)}
          >
            <FontAwesome name={i as any} size={18} color={icon === i ? color : "#6B7280"} />
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-sm font-medium text-textPrimary mb-2">Color</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: "#fff", shadowColor: color === c ? c : "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 }}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      {error ? <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><Text className="text-danger text-sm text-center">{error}</Text></View> : null}
      <TouchableOpacity className="bg-primary rounded-lg py-3.5 items-center" style={{ backgroundColor: color }} onPress={handleCreate} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Create List</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
