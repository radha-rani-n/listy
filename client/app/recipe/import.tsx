import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { addRecipe } from "@/lib/api";

export default function ImportRecipeScreen() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parse basic recipe data from HTML (simplified — works for common recipe sites)
  async function handleImport() {
    setError("");
    if (!url.trim()) { setError("Please enter a URL."); return; }

    setLoading(true);
    try {
      const response = await fetch(url.trim());
      const html = await response.text();

      // Try to extract JSON-LD recipe data
      const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
      let recipeData: any = null;

      if (jsonLdMatch) {
        for (const match of jsonLdMatch) {
          try {
            const content = match.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
            const parsed = JSON.parse(content);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of items) {
              if (item["@type"] === "Recipe") { recipeData = item; break; }
              if (item["@graph"]) {
                const recipe = item["@graph"].find((g: any) => g["@type"] === "Recipe");
                if (recipe) { recipeData = recipe; break; }
              }
            }
          } catch {}
        }
      }

      if (!recipeData) {
        // Fallback: extract from meta tags
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        setError("Couldn't parse recipe automatically. Try adding it manually.");
        setLoading(false);
        return;
      }

      // Parse ingredients
      const ingredients = (recipeData.recipeIngredient || []).map((ing: string) => {
        const match = ing.match(/^([\d./]+)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|L|cloves?|cans?|pieces?)?\s*(.+)$/i);
        if (match) return { amount: match[1], unit: match[2] || "", name: match[3] };
        return { amount: "", unit: "", name: ing };
      });

      // Parse steps
      const steps = (recipeData.recipeInstructions || []).map((step: any) => {
        if (typeof step === "string") return step;
        return step.text || step.name || "";
      }).filter(Boolean);

      // Parse times
      function parseDuration(iso: string): string {
        if (!iso) return "";
        const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!match) return iso;
        const hours = match[1] ? `${match[1]}h ` : "";
        const mins = match[2] ? `${match[2]}min` : "";
        return (hours + mins).trim();
      }

      const id = await addRecipe({
        title: recipeData.name || "Imported Recipe",
        description: recipeData.description || "",
        servings: parseInt(recipeData.recipeYield?.[0] || recipeData.recipeYield || "4") || 4,
        prepTime: parseDuration(recipeData.prepTime || ""),
        cookTime: parseDuration(recipeData.cookTime || ""),
        ingredients,
        steps,
        photoUrl: recipeData.image?.url || (Array.isArray(recipeData.image) ? recipeData.image[0] : recipeData.image) || null,
        sourceUrl: url.trim(),
        collections: ["Imported"],
      });

      router.replace(`/recipe/${id}`);
    } catch (err: any) {
      setError(err.message || "Failed to import");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Stack.Screen options={{ title: "Import Recipe" }} />
      <View className="px-6 pt-6">
        <Text className="text-textSecondary mb-4 text-center">
          Paste a recipe URL from popular cooking sites. We'll try to extract the ingredients and steps automatically.
        </Text>

        <Text className="text-sm font-medium text-textPrimary mb-1">Recipe URL</Text>
        <TextInput
          className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-4 text-textPrimary"
          placeholder="https://www.allrecipes.com/recipe/..."
          placeholderTextColor="#9CA3AF"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          autoFocus
        />

        {error ? <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><Text className="text-danger text-sm text-center">{error}</Text></View> : null}

        <TouchableOpacity className="bg-primary rounded-lg py-3.5 items-center" onPress={handleImport} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Import Recipe</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
