import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { addPantryItem } from "@/lib/api";

const CATEGORIES = ["Produce", "Dairy", "Meat", "Bakery", "Frozen", "Beverages", "Pantry", "Snacks", "Household", "Other"];

export default function AddPantryItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prefillName?: string; prefillCategory?: string }>();

  const [name, setName] = useState(params.prefillName || "");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState(params.prefillCategory || "");
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError("");
    if (!name.trim()) { setError("Item name is required."); return; }

    let parsedExpiry: string | undefined;
    if (expiryDate.trim()) {
      const d = new Date(expiryDate.trim());
      if (isNaN(d.getTime())) { setError("Invalid date. Use YYYY-MM-DD format."); return; }
      parsedExpiry = d.toISOString().split("T")[0];
    }

    setLoading(true);
    try {
      await addPantryItem({
        name: name.trim(),
        quantity: quantity || "1",
        unit: unit.trim() || undefined,
        category: category || undefined,
        expiry_date: parsedExpiry,
      });
      router.back();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Stack.Screen options={{ title: "Add Pantry Item", headerShown: true }} />
      <ScrollView contentContainerClassName="px-6 pt-6 pb-10" keyboardShouldPersistTaps="handled">
        <Text className="text-sm font-medium text-textPrimary mb-1">Name</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-4 text-textPrimary" placeholder="e.g. Whole Milk" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} autoFocus />
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-sm font-medium text-textPrimary mb-1">Quantity</Text>
            <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 text-textPrimary" placeholder="1" placeholderTextColor="#9CA3AF" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-textPrimary mb-1">Unit</Text>
            <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 text-textPrimary" placeholder="e.g. gallon, lb, oz" placeholderTextColor="#9CA3AF" value={unit} onChangeText={setUnit} />
          </View>
        </View>
        <Text className="text-sm font-medium text-textPrimary mb-2">Category</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} className={`px-3 py-1.5 rounded-full ${category === cat ? "bg-primary" : "bg-gray-200"}`} onPress={() => setCategory(category === cat ? "" : cat)}>
              <Text className={`text-sm ${category === cat ? "text-white font-medium" : "text-textSecondary"}`}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-sm font-medium text-textPrimary mb-1">Expiry Date</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-6 text-textPrimary" placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={expiryDate} onChangeText={setExpiryDate} keyboardType="numbers-and-punctuation" />
        {error ? <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><Text className="text-danger text-sm text-center">{error}</Text></View> : null}
        <TouchableOpacity className="bg-primary rounded-lg py-3.5 items-center" onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Add to Pantry</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
