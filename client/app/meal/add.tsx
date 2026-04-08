import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { addMeal } from "@/lib/api";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

function getTodayStr(): string { return new Date().toISOString().split("T")[0]; }

export default function AddMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; mealType?: string }>();

  const [date, setDate] = useState(params.date || getTodayStr());
  const [mealType, setMealType] = useState(params.mealType || "dinner");
  const [recipeName, setRecipeName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError("");
    if (!recipeName.trim()) { setError("Recipe name is required."); return; }
    if (isNaN(new Date(date.trim()).getTime())) { setError("Invalid date. Use YYYY-MM-DD format."); return; }

    setLoading(true);
    try {
      await addMeal({ date: date.trim(), meal_type: mealType, recipe_name: recipeName.trim(), notes: notes.trim() || undefined });
      router.back();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Stack.Screen options={{ title: "Add Meal", headerShown: true }} />
      <ScrollView contentContainerClassName="px-6 pt-6 pb-10" keyboardShouldPersistTaps="handled">
        <Text className="text-sm font-medium text-textPrimary mb-1">Date</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-4 text-textPrimary" placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
        <Text className="text-sm font-medium text-textPrimary mb-2">Meal Type</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {MEAL_TYPES.map((type) => (
            <TouchableOpacity key={type} className={`px-4 py-2 rounded-full ${mealType === type ? "bg-primary" : "bg-gray-200"}`} onPress={() => setMealType(type)}>
              <Text className={`text-sm font-medium ${mealType === type ? "text-white" : "text-textSecondary"}`}>{MEAL_LABELS[type]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-sm font-medium text-textPrimary mb-1">Recipe Name</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-4 text-textPrimary" placeholder="e.g. Chicken Stir Fry" placeholderTextColor="#9CA3AF" value={recipeName} onChangeText={setRecipeName} />
        <Text className="text-sm font-medium text-textPrimary mb-1">Notes</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-6 text-textPrimary" placeholder="Optional notes or recipe link" placeholderTextColor="#9CA3AF" value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" />
        {error ? <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><Text className="text-danger text-sm text-center">{error}</Text></View> : null}
        <TouchableOpacity className="bg-primary rounded-lg py-3.5 items-center" onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Add Meal</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
