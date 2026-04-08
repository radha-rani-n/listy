import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { fetchRecipes, fetchRecipeCollections, Recipe } from "@/lib/api";

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadRecipes = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([fetchRecipes(), fetchRecipeCollections()]);
      setRecipes(r);
      setCollections(c);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadRecipes().finally(() => setLoading(false));
  }, [loadRecipes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  }, [loadRecipes]);

  async function shareAllRecipes() {
    const text = recipes.map((r) => {
      const ings = r.ingredients.map((i) => `  • ${i.amount ? i.amount + " " : ""}${i.unit ? i.unit + " " : ""}${i.name}`).join("\n");
      const steps = r.steps.map((s, i) => `  ${i + 1}. ${s}`).join("\n");
      return `${r.title}\n${r.servings ? `Serves ${r.servings}` : ""}\n\nIngredients:\n${ings}\n\nSteps:\n${steps}`;
    }).join("\n\n---\n\n");

    await Share.share({ message: `My Recipes\n\n${text}` });
  }

  async function printAllRecipes() {
    const html = `<html><body style="font-family:system-ui;padding:20px;">
      <h1 style="color:#4F46E5;">My Recipes</h1>
      ${recipes.map((r) => `
        <div style="page-break-inside:avoid;margin-bottom:32px;">
          <h2>${r.title}</h2>
          ${r.description ? `<p style="color:#666;">${r.description}</p>` : ""}
          <p>${r.servings ? `Serves ${r.servings}` : ""} ${r.prepTime ? `| Prep ${r.prepTime}` : ""} ${r.cookTime ? `| Cook ${r.cookTime}` : ""}</p>
          <h3>Ingredients</h3>
          <ul>${r.ingredients.map((i) => `<li>${i.amount ? i.amount + " " : ""}${i.unit ? i.unit + " " : ""}${i.name}</li>`).join("")}</ul>
          <h3>Steps</h3>
          <ol>${r.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
        </div>
      `).join("")}
    </body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
  }

  let filtered = recipes;
  if (selectedCollection) {
    filtered = filtered.filter((r) => r.collections?.includes(selectedCollection));
  }
  if (search.trim()) {
    const lower = search.toLowerCase();
    filtered = filtered.filter((r) => r.title.toLowerCase().includes(lower));
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Search */}
      <View className="px-4 pt-3 pb-1">
        <TextInput
          className="bg-card border border-gray-200 rounded-lg px-3 py-2.5 text-textPrimary"
          placeholder="Search recipes..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Collections */}
      {collections.length > 0 && (
        <View className="px-4 pt-2 pb-1">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, ...collections]}
            keyExtractor={(item) => item || "all"}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`px-3 py-1.5 rounded-full mr-2 ${selectedCollection === item ? "bg-primary" : "bg-gray-200"}`}
                onPress={() => setSelectedCollection(item)}
              >
                <Text className={`text-sm ${selectedCollection === item ? "text-white font-medium" : "text-textSecondary"}`}>
                  {item || "All"}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <FontAwesome name="book" size={48} color="#D1D5DB" />
          <Text className="text-xl font-bold text-textPrimary mt-4">
            {recipes.length === 0 ? "No recipes yet" : "No matches"}
          </Text>
          <Text className="text-textSecondary mt-1 text-center">
            {recipes.length === 0 ? "Add your first recipe" : "Try a different search"}
          </Text>
          {recipes.length === 0 && (
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                className="bg-primary rounded-lg px-5 py-3"
                onPress={() => router.push("/recipe/add")}
              >
                <Text className="text-white font-semibold">Add Recipe</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-primary rounded-lg px-5 py-3"
                onPress={() => router.push("/recipe/import")}
              >
                <Text className="text-primary font-semibold">Import URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 pt-2 pb-24"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-card rounded-xl mb-3 border border-gray-100 overflow-hidden"
                onPress={() => router.push(`/recipe/${item.id}`)}
                activeOpacity={0.7}
              >
                {item.photoUrl && (
                  <Image source={{ uri: item.photoUrl }} style={{ width: "100%", height: 140 }} resizeMode="cover" />
                )}
                <View className="p-3.5">
                  <Text className="text-lg font-semibold text-textPrimary">{item.title}</Text>
                  <View className="flex-row items-center mt-1 gap-3">
                    {item.prepTime && (
                      <View className="flex-row items-center">
                        <FontAwesome name="clock-o" size={12} color="#6B7280" />
                        <Text className="text-xs text-textSecondary ml-1">Prep {item.prepTime}</Text>
                      </View>
                    )}
                    {item.cookTime && (
                      <View className="flex-row items-center">
                        <FontAwesome name="fire" size={12} color="#6B7280" />
                        <Text className="text-xs text-textSecondary ml-1">Cook {item.cookTime}</Text>
                      </View>
                    )}
                    {item.servings > 0 && (
                      <Text className="text-xs text-textSecondary">Serves {item.servings}</Text>
                    )}
                  </View>
                  {item.collections?.length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mt-2">
                      {item.collections.map((c) => (
                        <Text key={c} className="text-xs text-primary bg-indigo-50 px-1.5 py-0.5 rounded">{c}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
          <View className="absolute bottom-6 right-4 left-4">
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-card border border-gray-200 rounded-lg py-2" onPress={shareAllRecipes}>
                <FontAwesome name="share" size={12} color="#6B7280" />
                <Text className="text-textSecondary text-xs font-medium ml-1">Share All</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-card border border-gray-200 rounded-lg py-2" onPress={printAllRecipes}>
                <FontAwesome name="print" size={12} color="#6B7280" />
                <Text className="text-textSecondary text-xs font-medium ml-1">Print All</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-3.5 items-center"
                onPress={() => router.push("/recipe/add")}
              >
                <Text className="text-white font-semibold">Add Recipe</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-primary rounded-xl py-3.5 px-5 items-center"
                onPress={() => router.push("/recipe/import")}
              >
                <Text className="text-primary font-semibold">Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
