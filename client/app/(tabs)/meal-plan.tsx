import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Share } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Calendar from "expo-calendar";
import { fetchMeals } from "@/lib/api";

type MealPlan = {
  id: string;
  date: string;
  meal_type: string;
  recipe_name: string;
  notes: string | null;
};

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const MEAL_ICONS: Record<string, string> = { breakfast: "sun-o", lunch: "cloud", dinner: "moon-o", snack: "star-o" };

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const todayStr = new Date().toISOString().split("T")[0];
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (dateStr === todayStr) return `Today, ${month}`;
  return `${dayName}, ${month}`;
}

export default function MealPlanScreen() {
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const weekDates = getWeekDates();

  const loadMeals = useCallback(async () => {
    try {
      const data = await fetchMeals(weekDates[0], weekDates[6]);
      setMeals(data);
    } catch (err) {
      console.error("fetchMeals error:", err);
    }
  }, []);

  useEffect(() => {
    loadMeals().finally(() => setLoading(false));
  }, [loadMeals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  }, [loadMeals]);

  function getMealsForSlot(date: string, mealType: string): MealPlan[] {
    return meals.filter((m) => m.date === date && m.meal_type === mealType);
  }

  async function shareMealPlan() {
    const lines = weekDates.map((date) => {
      const dayMeals = meals.filter((m) => m.date === date);
      if (dayMeals.length === 0) return null;
      const dayLabel = formatDayLabel(date);
      const mealLines = dayMeals.map((m) => `  ${MEAL_LABELS[m.meal_type]}: ${m.recipe_name}`).join("\n");
      return `${dayLabel}\n${mealLines}`;
    }).filter(Boolean).join("\n\n");

    await Share.share({ message: `Meal Plan\n\n${lines}` });
  }

  async function printMealPlan() {
    const rows = weekDates.map((date) => {
      const cells = MEAL_TYPES.map((type) => {
        const m = getMealsForSlot(date, type);
        return `<td style="padding:8px;border:1px solid #eee;">${m.map((x) => x.recipe_name).join(", ") || "-"}</td>`;
      }).join("");
      return `<tr><td style="padding:8px;border:1px solid #eee;font-weight:bold;">${formatDayLabel(date)}</td>${cells}</tr>`;
    }).join("");

    const html = `<html><body style="font-family:system-ui;">
      <h1 style="color:#4F46E5;">Meal Plan</h1>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#F9FAFB;">
          <th style="padding:8px;text-align:left;">Day</th>
          ${MEAL_TYPES.map((t) => `<th style="padding:8px;">${MEAL_LABELS[t]}</th>`).join("")}
        </tr>${rows}
      </table></body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
  }

  async function syncToCalendar() {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") return;

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCal = calendars.find((c) => c.allowsModifications) || calendars[0];
      if (!defaultCal) return;

      for (const meal of meals) {
        const date = new Date(meal.date + "T12:00:00");
        const hourMap: Record<string, number> = { breakfast: 8, lunch: 12, dinner: 18, snack: 15 };
        date.setHours(hourMap[meal.meal_type] || 12, 0, 0, 0);

        await Calendar.createEventAsync(defaultCal.id, {
          title: `${MEAL_LABELS[meal.meal_type]}: ${meal.recipe_name}`,
          startDate: date,
          endDate: new Date(date.getTime() + 60 * 60 * 1000),
          notes: meal.notes || undefined,
        });
      }
    } catch (err) {
      console.error("Calendar sync error:", err);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const isEmpty = meals.length === 0;

  return (
    <View className="flex-1 bg-background">
      {isEmpty ? (
        <View className="flex-1 items-center justify-center px-6">
          <FontAwesome name="calendar" size={48} color="#D1D5DB" />
          <Text className="text-xl font-bold text-textPrimary mt-4">No meals planned</Text>
          <Text className="text-textSecondary mt-1 text-center">Plan your meals for the week ahead</Text>
          <TouchableOpacity className="bg-primary rounded-lg px-5 py-3 mt-6" onPress={() => router.push("/meal/add")}>
            <Text className="text-white font-semibold">Add Meal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-4 pt-4 pb-24"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {weekDates.map((date) => (
            <View key={date} className="mb-5">
              <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-2">
                {formatDayLabel(date)}
              </Text>
              <View className="bg-card rounded-xl border border-gray-100 overflow-hidden">
                {MEAL_TYPES.map((type, idx) => {
                  const slotMeals = getMealsForSlot(date, type);
                  return (
                    <View key={type} className={`flex-row items-center px-3.5 py-3 ${idx < MEAL_TYPES.length - 1 ? "border-b border-gray-100" : ""}`}>
                      <View className="w-7 items-center">
                        <FontAwesome name={MEAL_ICONS[type] as any} size={14} color="#6B7280" />
                      </View>
                      <Text className="text-xs text-textSecondary w-16">{MEAL_LABELS[type]}</Text>
                      <View className="flex-1">
                        {slotMeals.length > 0 ? (
                          slotMeals.map((meal) => (
                            <TouchableOpacity key={meal.id} onPress={() => router.push(`/meal/detail?id=${meal.id}`)} activeOpacity={0.7}>
                              <Text className="text-sm text-textPrimary font-medium">{meal.recipe_name}</Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <TouchableOpacity onPress={() => router.push(`/meal/add?date=${date}&mealType=${type}`)}>
                            <Text className="text-sm text-gray-300">+ Add</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      {!isEmpty && (
        <View className="absolute bottom-6 right-4 left-4">
          <View className="flex-row gap-2 mb-2">
            <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-card border border-gray-200 rounded-lg py-2" onPress={shareMealPlan}>
              <FontAwesome name="share" size={12} color="#6B7280" />
              <Text className="text-textSecondary text-xs font-medium ml-1">Share</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-card border border-gray-200 rounded-lg py-2" onPress={printMealPlan}>
              <FontAwesome name="print" size={12} color="#6B7280" />
              <Text className="text-textSecondary text-xs font-medium ml-1">Print</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-card border border-gray-200 rounded-lg py-2" onPress={syncToCalendar}>
              <FontAwesome name="calendar-check-o" size={12} color="#6B7280" />
              <Text className="text-textSecondary text-xs font-medium ml-1">Sync</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="bg-primary rounded-xl py-3.5 items-center" onPress={() => router.push("/meal/add")}>
            <Text className="text-white font-semibold">Add Meal</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
