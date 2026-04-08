import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import SwipeToDelete from "@/components/SwipeToDelete";
import { fetchPantryItems, deletePantryItem } from "@/lib/api";
import ResponsiveContainer from "@/components/ResponsiveContainer";

type PantryItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string | null;
  category: string | null;
  expiry_date: string | null;
};

type Section = {
  title: string;
  data: PantryItem[];
};

function daysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PantryScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadItems = useCallback(async () => {
    try {
      const data = await fetchPantryItems();
      const grouped: Record<string, PantryItem[]> = {};
      (data || []).forEach((item: PantryItem) => {
        const cat = item.category || "Uncategorized";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });

      const sorted = Object.keys(grouped)
        .sort((a, b) => {
          if (a === "Uncategorized") return 1;
          if (b === "Uncategorized") return -1;
          return a.localeCompare(b);
        })
        .map((title) => ({ title, data: grouped[title] }));

      setSections(sorted);
    } catch (err) {
      console.error("fetchPantry error:", err);
    }
  }, []);

  useEffect(() => {
    loadItems().finally(() => setLoading(false));
  }, [loadItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  async function handleDelete(item: PantryItem) {
    await deletePantryItem(item.id);
    await loadItems();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const isEmpty = sections.length === 0;

  return (
    <ResponsiveContainer>
    <View className="flex-1 bg-background">
      {isEmpty ? (
        <View className="flex-1 items-center justify-center px-6">
          <FontAwesome name="archive" size={48} color="#D1D5DB" />
          <Text className="text-xl font-bold text-textPrimary mt-4">
            Pantry is empty
          </Text>
          <Text className="text-textSecondary mt-1 text-center">
            Add items to keep track of what you have at home
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-lg px-5 py-3 mt-6"
            onPress={() => router.push("/pantry/add")}
          >
            <Text className="text-white font-semibold">Add Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 pt-4 pb-24"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderSectionHeader={({ section }) => (
              <Text className="text-sm font-semibold text-textSecondary uppercase tracking-wide mt-4 mb-2">
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => {
              const days = item.expiry_date ? daysUntilExpiry(item.expiry_date) : null;
              const expiringSoon = days !== null && days <= 3 && days >= 0;
              const expired = days !== null && days < 0;

              return (
                <SwipeToDelete onDelete={() => handleDelete(item)}>
                  <TouchableOpacity
                    className={`flex-row items-center bg-card rounded-xl p-3.5 mb-2 border ${
                      expired
                        ? "border-red-200 bg-red-50"
                        : expiringSoon
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-gray-100"
                    }`}
                    onPress={() => router.push(`/pantry/edit?id=${item.id}`)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-medium text-textPrimary">
                        {item.name}
                      </Text>
                      <View className="flex-row items-center mt-0.5 gap-2">
                        <Text className="text-xs text-textSecondary">
                          {item.quantity}
                          {item.unit ? ` ${item.unit}` : ""}
                        </Text>
                        {item.expiry_date && (
                          <Text
                            className={`text-xs font-medium ${
                              expired
                                ? "text-danger"
                                : expiringSoon
                                ? "text-warning"
                                : "text-textSecondary"
                            }`}
                          >
                            {expired
                              ? `Expired ${Math.abs(days!)}d ago`
                              : days === 0
                              ? "Expires today"
                              : `Expires in ${days}d`}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </SwipeToDelete>
              );
            }}
          />
          <TouchableOpacity
            className="absolute bottom-6 right-4 left-4 bg-primary rounded-xl py-3.5 items-center"
            onPress={() => router.push("/pantry/add")}
          >
            <Text className="text-white font-semibold">Add Pantry Item</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
    </ResponsiveContainer>
  );
}
