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
import { fetchLists as apiFetchLists } from "@/lib/api";

type ListRow = {
  id: string;
  name: string;
  type: string;
  folder: string | null;
  icon: string;
  color: string;
  member_count: number;
};

type Section = {
  title: string;
  data: ListRow[];
};

export default function ListsScreen() {
  const [lists, setLists] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const router = useRouter();

  const loadLists = useCallback(async () => {
    try {
      const data = await apiFetchLists();
      setLists(data);
    } catch (err) {
      console.error("fetchLists error:", err);
    }
  }, []);

  useEffect(() => {
    loadLists().finally(() => setLoading(false));
  }, [loadLists]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLists();
    setRefreshing(false);
  }, [loadLists]);

  function toggleFolder(folder: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  }

  // Build sections
  const grouped: Record<string, ListRow[]> = {};
  lists.forEach((list) => {
    const folder = list.folder || "Ungrouped";
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(list);
  });

  const folders = Object.keys(grouped).sort((a, b) => {
    if (a === "Ungrouped") return 1;
    if (b === "Ungrouped") return -1;
    return a.localeCompare(b);
  });

  const hasFolders = folders.length > 1 || (folders.length === 1 && folders[0] !== "Ungrouped");

  const sections: Section[] = folders.map((f) => ({
    title: f,
    data: collapsedFolders.has(f) ? [] : grouped[f],
  }));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {lists.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <FontAwesome name="list-ul" size={48} color="#D1D5DB" />
          <Text className="text-xl font-bold text-textPrimary mt-4">No lists yet</Text>
          <Text className="text-textSecondary mt-1 text-center">Create a shopping list or join one with an invite code</Text>
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity className="bg-primary rounded-lg px-5 py-3" onPress={() => router.push("/list/create")}>
              <Text className="text-white font-semibold">Create List</Text>
            </TouchableOpacity>
            <TouchableOpacity className="border border-primary rounded-lg px-5 py-3" onPress={() => router.push("/list/join")}>
              <Text className="text-primary font-semibold">Join List</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 pt-4 pb-24"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderSectionHeader={({ section }) => {
              if (!hasFolders && section.title === "Ungrouped") return null;
              const isCollapsed = collapsedFolders.has(section.title);
              const count = grouped[section.title]?.length || 0;
              return (
                <TouchableOpacity
                  className="flex-row items-center mt-4 mb-2"
                  onPress={() => toggleFolder(section.title)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name={isCollapsed ? "folder" : "folder-open"} size={14} color="#4F46E5" />
                  <Text className="text-sm font-semibold text-primary ml-2 uppercase tracking-wide">{section.title}</Text>
                  <Text className="text-xs text-textSecondary ml-2">({count})</Text>
                  <View className="flex-1" />
                  <FontAwesome name={isCollapsed ? "chevron-right" : "chevron-down"} size={10} color="#6B7280" />
                </TouchableOpacity>
              );
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-card rounded-xl p-4 mb-3 border border-gray-100 flex-row items-center"
                onPress={() => router.push(`/list/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: item.color + "20", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <FontAwesome name={item.icon as any} size={18} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-textPrimary">{item.name}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <FontAwesome name="users" size={11} color="#6B7280" />
                    <Text className="text-textSecondary text-xs ml-1">
                      {item.member_count} {item.member_count === 1 ? "member" : "members"}
                    </Text>
                  </View>
                </View>
                <FontAwesome name="chevron-right" size={12} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          />
          <View className="absolute bottom-6 right-4 left-4 flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-primary rounded-xl py-3.5 items-center" onPress={() => router.push("/list/create")}>
              <Text className="text-white font-semibold">Create List</Text>
            </TouchableOpacity>
            <TouchableOpacity className="border border-primary rounded-xl py-3.5 px-5 items-center" onPress={() => router.push("/list/join")}>
              <Text className="text-primary font-semibold">Join</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
