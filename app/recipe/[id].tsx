import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Image, Share,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  getRecipe, deleteRecipe, fetchLists, addRecipeIngredientsToList, Recipe,
} from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [showAddToList, setShowAddToList] = useState(false);
  const [addingToList, setAddingToList] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const r = await getRecipe(id!);
        setRecipe(r);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function shareRecipe() {
    if (!recipe) return;
    const ingredients = recipe.ingredients.map((ing) => {
      let line = "";
      if (ing.amount) line += `${ing.amount} `;
      if (ing.unit) line += `${ing.unit} `;
      line += ing.name;
      return `• ${line}`;
    }).join("\n");

    const steps = recipe.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

    const text = [
      recipe.title,
      recipe.description ? `\n${recipe.description}` : "",
      recipe.servings ? `\nServings: ${recipe.servings}` : "",
      recipe.prepTime ? `Prep: ${recipe.prepTime}` : "",
      recipe.cookTime ? `Cook: ${recipe.cookTime}` : "",
      `\nIngredients:\n${ingredients}`,
      `\nSteps:\n${steps}`,
      recipe.sourceUrl ? `\nSource: ${recipe.sourceUrl}` : "",
    ].filter(Boolean).join("\n");

    await Share.share({ message: text });
  }

  async function handleDelete() {
    const confirmed = typeof window !== "undefined"
      ? window.confirm("Delete this recipe? This cannot be undone.")
      : true;
    if (!confirmed) return;
    try {
      await deleteRecipe(id!);
      router.replace("/(tabs)/recipes");
    } catch (err) {
      console.error("Delete recipe error:", err);
    }
  }

  async function handleAddToList(listId: string) {
    setAddingToList(true);
    try {
      await addRecipeIngredientsToList(id!, listId, scale);
      Alert.alert("Added!", `Ingredients added to your list (${scale}x).`);
      setShowAddToList(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
    setAddingToList(false);
  }

  async function openAddToList() {
    setShowAddToList(true);
    try {
      const l = await fetchLists();
      setLists(l.map((x: any) => ({ id: x.id, name: x.name })));
    } catch {}
  }

  function scaleAmount(amount: string): string {
    if (!amount) return "";
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    const scaled = num * scale;
    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1);
  }

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-background"><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }
  if (!recipe) {
    return <View className="flex-1 items-center justify-center bg-background"><Text className="text-textSecondary">Recipe not found.</Text></View>;
  }

  return (
    <ResponsiveContainer>
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: recipe.title,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <TouchableOpacity onPress={shareRecipe}>
                <FontAwesome name="share" size={18} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/recipe/cook?id=${id}`)}>
                <FontAwesome name="fire" size={18} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <FontAwesome name="trash-o" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView contentContainerClassName="pb-10">
        {recipe.photoUrl && (
          <Image source={{ uri: recipe.photoUrl }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
        )}

        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-textPrimary">{recipe.title}</Text>
          {recipe.description ? <Text className="text-textSecondary mt-1">{recipe.description}</Text> : null}

          <View className="flex-row items-center mt-3 gap-4">
            {recipe.prepTime ? (
              <View className="flex-row items-center">
                <FontAwesome name="clock-o" size={14} color="#6B7280" />
                <Text className="text-sm text-textSecondary ml-1">Prep {recipe.prepTime}</Text>
              </View>
            ) : null}
            {recipe.cookTime ? (
              <View className="flex-row items-center">
                <FontAwesome name="fire" size={14} color="#6B7280" />
                <Text className="text-sm text-textSecondary ml-1">Cook {recipe.cookTime}</Text>
              </View>
            ) : null}
          </View>

          {recipe.sourceUrl ? (
            <Text className="text-xs text-primary mt-2">Source: {recipe.sourceUrl}</Text>
          ) : null}

          {/* Scale */}
          <View className="flex-row items-center mt-5 mb-3">
            <Text className="text-sm font-semibold text-textPrimary mr-3">Servings</Text>
            {[0.5, 1, 2, 3].map((s) => (
              <TouchableOpacity
                key={s}
                className={`px-3 py-1.5 rounded-full mr-2 ${scale === s ? "bg-primary" : "bg-gray-200"}`}
                onPress={() => setScale(s)}
              >
                <Text className={`text-sm ${scale === s ? "text-white font-medium" : "text-textSecondary"}`}>
                  {s === 1 ? `${recipe.servings}` : `${Math.round(recipe.servings * s)}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ingredients */}
          <Text className="text-lg font-bold text-textPrimary mt-4 mb-2">Ingredients</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} className="flex-row items-start py-1.5 border-b border-gray-100">
              <Text className="text-textPrimary">
                {ing.amount ? <Text className="font-semibold">{scaleAmount(ing.amount)} </Text> : null}
                {ing.unit ? <Text className="text-textSecondary">{ing.unit} </Text> : null}
                {ing.name}
              </Text>
            </View>
          ))}

          {/* Add to list button */}
          <TouchableOpacity
            className="bg-primary rounded-lg py-3 items-center mt-4 flex-row justify-center"
            onPress={openAddToList}
            activeOpacity={0.8}
          >
            <FontAwesome name="shopping-cart" size={16} color="#fff" />
            <Text className="text-white font-semibold ml-2">Add Ingredients to List ({scale}x)</Text>
          </TouchableOpacity>

          {showAddToList && (
            <View className="bg-card border border-gray-200 rounded-lg p-3 mt-2">
              {lists.length === 0 ? (
                <Text className="text-textSecondary text-center py-2">No lists found.</Text>
              ) : (
                lists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    className="py-2.5 border-b border-gray-100"
                    onPress={() => handleAddToList(list.id)}
                    disabled={addingToList}
                  >
                    <Text className="text-textPrimary">{list.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Steps */}
          <Text className="text-lg font-bold text-textPrimary mt-6 mb-2">Steps</Text>
          {recipe.steps.map((step, i) => (
            <View key={i} className="flex-row mb-3">
              <View className="w-7 h-7 rounded-full bg-primary items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">{i + 1}</Text>
              </View>
              <Text className="text-textPrimary flex-1 leading-5">{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
    </ResponsiveContainer>
  );
}
