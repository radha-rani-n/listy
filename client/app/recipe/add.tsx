import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, Image, Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import { addRecipe, RecipeIngredient } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

export default function AddRecipeScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("4");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [ingredientText, setIngredientText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [collectionsText, setCollectionsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhotoUrl(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  }

  function parseIngredients(text: string): RecipeIngredient[] {
    return text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      // Try to parse "2 cups flour" → { amount: "2", unit: "cups", name: "flour" }
      const match = line.match(/^([\d./]+)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|L|cloves?|cans?|pieces?|slices?)?\s+(.+)$/i);
      if (match) {
        return { amount: match[1], unit: match[2] || "", name: match[3] };
      }
      return { amount: "", unit: "", name: line };
    });
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }

    setLoading(true);
    try {
      const ingredients = parseIngredients(ingredientText);
      const steps = stepsText.split("\n").map((l) => l.trim()).filter(Boolean);
      const collections = collectionsText.split(",").map((c) => c.trim()).filter(Boolean);

      const id = await addRecipe({
        title: title.trim(),
        description: description.trim(),
        servings: parseInt(servings) || 4,
        prepTime: prepTime.trim(),
        cookTime: cookTime.trim(),
        ingredients,
        steps,
        photoUrl,
        sourceUrl: null,
        collections,
      });
      router.replace(`/recipe/${id}`);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <ResponsiveContainer>
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Stack.Screen options={{ title: "Add Recipe" }} />
      <ScrollView contentContainerClassName="px-6 pt-4 pb-10" keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <TouchableOpacity
          onPress={pickImage}
          style={{ width: "100%", height: 160, borderRadius: 12, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB", borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden" }}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: "center" }}>
              <FontAwesome name="camera" size={28} color="#9CA3AF" />
              <Text style={{ color: "#9CA3AF", fontSize: 13, marginTop: 4 }}>Add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text className="text-sm font-medium text-textPrimary mb-1">Title</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-3 text-textPrimary" placeholder="Recipe name" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} />

        <Text className="text-sm font-medium text-textPrimary mb-1">Description</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-3 text-textPrimary" placeholder="Short description" placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} multiline />

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-sm font-medium text-textPrimary mb-1">Servings</Text>
            <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 text-textPrimary" value={servings} onChangeText={setServings} keyboardType="numeric" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-textPrimary mb-1">Prep Time</Text>
            <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 text-textPrimary" placeholder="15 min" placeholderTextColor="#9CA3AF" value={prepTime} onChangeText={setPrepTime} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-textPrimary mb-1">Cook Time</Text>
            <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 text-textPrimary" placeholder="30 min" placeholderTextColor="#9CA3AF" value={cookTime} onChangeText={setCookTime} />
          </View>
        </View>

        <Text className="text-sm font-medium text-textPrimary mb-1">Ingredients (one per line)</Text>
        <Text className="text-xs text-textSecondary mb-1">Format: "2 cups flour" or just "flour"</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-3 text-textPrimary" placeholder={"2 cups flour\n1 tsp salt\n3 eggs"} placeholderTextColor="#9CA3AF" value={ingredientText} onChangeText={setIngredientText} multiline numberOfLines={6} textAlignVertical="top" />

        <Text className="text-sm font-medium text-textPrimary mb-1">Steps (one per line)</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-3 text-textPrimary" placeholder={"Preheat oven to 350°F\nMix dry ingredients\nAdd wet ingredients"} placeholderTextColor="#9CA3AF" value={stepsText} onChangeText={setStepsText} multiline numberOfLines={6} textAlignVertical="top" />

        <Text className="text-sm font-medium text-textPrimary mb-1">Collections (comma separated)</Text>
        <TextInput className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-4 text-textPrimary" placeholder="Dinner, Quick Meals, Italian" placeholderTextColor="#9CA3AF" value={collectionsText} onChangeText={setCollectionsText} />

        {error ? <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><Text className="text-danger text-sm text-center">{error}</Text></View> : null}

        <TouchableOpacity className="bg-primary rounded-lg py-3.5 items-center" onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Save Recipe</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    </ResponsiveContainer>
  );
}
