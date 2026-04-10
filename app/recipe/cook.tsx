import { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useKeepAwake } from "expo-keep-awake";
import { getRecipe, Recipe } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

export default function CookingModeScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);

  useEffect(() => {
    getRecipe(id!).then(setRecipe).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-gray-900"><ActivityIndicator size="large" color="#fff" /></View>;
  }
  if (!recipe) {
    return <View className="flex-1 items-center justify-center bg-gray-900"><Text className="text-white">Recipe not found.</Text></View>;
  }

  if (!recipe.steps || recipe.steps.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <FontAwesome name="info-circle" size={48} color="#6B7280" />
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 16, textAlign: "center" }}>No steps for this recipe</Text>
        <Text style={{ color: "#9CA3AF", fontSize: 14, marginTop: 8, textAlign: "center" }}>Add steps to the recipe to use cooking mode.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, backgroundColor: "#4F46E5", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Back to Recipe</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalSteps = recipe.steps.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <ResponsiveContainer>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111827" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="times" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        <Text style={{ color: "#9CA3AF", fontSize: 14 }}>{recipe.title}</Text>
        <TouchableOpacity onPress={() => setShowIngredients(!showIngredients)}>
          <FontAwesome name="list" size={20} color={showIngredients ? "#4F46E5" : "#9CA3AF"} />
        </TouchableOpacity>
      </View>

      {showIngredients ? (
        /* Ingredients overlay */
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 16 }}>Ingredients</Text>
          {recipe.ingredients.map((ing, i) => (
            <Text key={i} style={{ color: "#D1D5DB", fontSize: 18, lineHeight: 28 }}>
              {ing.amount ? `${ing.amount} ` : ""}{ing.unit ? `${ing.unit} ` : ""}{ing.name}
            </Text>
          ))}
        </View>
      ) : (
        /* Step view */
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
          {/* Step indicator */}
          <Text style={{ color: "#4F46E5", fontSize: 14, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Step {currentStep + 1} of {totalSteps}
          </Text>

          {/* Progress dots */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 24 }}>
            {recipe.steps.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 4,
                  flex: 1,
                  borderRadius: 2,
                  backgroundColor: i <= currentStep ? "#4F46E5" : "#374151",
                }}
              />
            ))}
          </View>

          {/* Step text */}
          <Text style={{ color: "#fff", fontSize: 24, lineHeight: 36, fontWeight: "400" }}>
            {recipe.steps[currentStep]}
          </Text>
        </View>
      )}

      {/* Navigation buttons */}
      {!showIngredients && (
        <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
          <TouchableOpacity
            onPress={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
            style={{
              flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: "center",
              backgroundColor: isFirst ? "#1F2937" : "#374151",
            }}
          >
            <Text style={{ color: isFirst ? "#4B5563" : "#fff", fontWeight: "600", fontSize: 16 }}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (isLast) router.back();
              else setCurrentStep((s) => s + 1);
            }}
            style={{
              flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: "center",
              backgroundColor: "#4F46E5",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>{isLast ? "Done" : "Next"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
    </ResponsiveContainer>
  );
}
