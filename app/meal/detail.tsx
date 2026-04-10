import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { getMeal, deleteMeal, fetchLists, addIngredientsToList } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

type MealPlan = { id: string; date: string; meal_type: string; recipe_name: string; notes: string | null };
type ListOption = { id: string; name: string };

const MEAL_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [meal, setMeal] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIngredients, setShowIngredients] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [lists, setLists] = useState<ListOption[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [addingIngredients, setAddingIngredients] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMeal(id!);
        setMeal(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function loadLists() {
    try {
      const data = await fetchLists();
      setLists(data.map((l: any) => ({ id: l.id, name: l.name })));
      if (data.length > 0) setSelectedList(data[0].id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddIngredients() {
    if (!ingredientsText.trim() || !selectedList) return;
    setAddingIngredients(true);
    const lines = ingredientsText.split("\n").map((l) => l.trim()).filter(Boolean);
    try {
      await addIngredientsToList(id!, selectedList, lines);
      Alert.alert("Added!", `${lines.length} ingredient${lines.length > 1 ? "s" : ""} added to your list.`);
      setIngredientsText("");
      setShowIngredients(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
    setAddingIngredients(false);
  }

  async function handleDelete() {
    const confirmed = typeof window !== "undefined"
      ? window.confirm("Remove this meal from your plan?")
      : true;
    if (!confirmed) return;
    try {
      await deleteMeal(id!);
      router.back();
    } catch (err) {
      console.error("Delete meal error:", err);
    }
  }

  if (loading) return <View className="flex-1 items-center justify-center bg-background"><ActivityIndicator size="large" color="#4F46E5" /></View>;
  if (!meal) return <View className="flex-1 items-center justify-center bg-background"><Text className="text-textSecondary">Meal not found.</Text></View>;

  return (
    <ResponsiveContainer>
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Stack.Screen options={{ title: meal.recipe_name, headerShown: true, headerRight: () => <TouchableOpacity onPress={handleDelete} hitSlop={10} style={{ paddingRight: 16 }}><FontAwesome name="trash-o" size={20} color="#EF4444" /></TouchableOpacity> }} />
      <ScrollView contentContainerClassName="px-6 pt-6 pb-10">
        <View className="bg-card rounded-xl border border-gray-100 p-4 mb-4">
          <Text className="text-2xl font-bold text-textPrimary">{meal.recipe_name}</Text>
          <View className="flex-row items-center mt-2 gap-3">
            <View className="bg-indigo-50 px-2.5 py-1 rounded-full"><Text className="text-xs font-medium text-primary">{MEAL_LABELS[meal.meal_type]}</Text></View>
            <Text className="text-sm text-textSecondary">{new Date(meal.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</Text>
          </View>
          {meal.notes ? <Text className="text-textSecondary mt-3">{meal.notes}</Text> : null}
        </View>

        <TouchableOpacity className="bg-card rounded-xl border border-gray-100 p-4 mb-4 flex-row items-center" onPress={() => { if (!showIngredients) loadLists(); setShowIngredients(!showIngredients); }} activeOpacity={0.7}>
          <FontAwesome name="shopping-cart" size={18} color="#4F46E5" />
          <Text className="text-primary font-semibold ml-2 flex-1">Add Ingredients to Shopping List</Text>
          <FontAwesome name={showIngredients ? "chevron-up" : "chevron-down"} size={12} color="#6B7280" />
        </TouchableOpacity>

        {showIngredients && (
          <View className="bg-card rounded-xl border border-gray-100 p-4 mb-4">
            <Text className="text-sm font-medium text-textPrimary mb-2">Select a list</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {lists.map((list) => (
                  <TouchableOpacity key={list.id} className={`px-3 py-1.5 rounded-full ${selectedList === list.id ? "bg-primary" : "bg-gray-200"}`} onPress={() => setSelectedList(list.id)}>
                    <Text className={`text-sm ${selectedList === list.id ? "text-white font-medium" : "text-textSecondary"}`}>{list.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text className="text-sm font-medium text-textPrimary mb-1">Ingredients (one per line)</Text>
            <TextInput className="bg-background border border-gray-200 rounded-lg px-4 py-3 mb-3 text-textPrimary" placeholder={"Chicken breast\nSoy sauce\nRice\nBroccoli"} placeholderTextColor="#9CA3AF" value={ingredientsText} onChangeText={setIngredientsText} multiline numberOfLines={5} textAlignVertical="top" />
            <TouchableOpacity className="bg-primary rounded-lg py-3 items-center" onPress={handleAddIngredients} disabled={addingIngredients || !ingredientsText.trim() || !selectedList} activeOpacity={0.8}>
              {addingIngredients ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Add to List</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </ResponsiveContainer>
  );
}
