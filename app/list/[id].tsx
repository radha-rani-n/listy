import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  SectionList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import SwipeToDelete from "@/components/SwipeToDelete";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import {
  getList,
  deleteList,
  fetchListItems,
  subscribeToListItems,
  addListItem,
  updateListItem,
  deleteListItem,
  getStoredUser,
  getFavorites,
  addFavorite,
  removeFavorite,
  getOtherLists,
  getItemsFromList,
  FavoriteItem,
} from "@/lib/api";
import { ALL_GROCERY_ITEMS, getCategoryForItem, learnCategory, loadUserOverrides } from "@/lib/groceryItems";
import { confirm } from "@/lib/confirm";

type ListItem = {
  id: string;
  name: string;
  quantity: string;
  category: string | null;
  checked: boolean;
  sort_order: number;
  price: number | null;
  note: string | null;
  photoUrl: string | null;
};

type ListInfo = { id: string; name: string };

type Section = {
  title: string;
  data: ListItem[];
};

const CATEGORY_ICONS: Record<string, string> = {
  "Fruits & Vegetables": "leaf",
  "Meat & Seafood": "cutlery",
  "Deli & Prepared": "scissors",
  "Dairy & Eggs": "tint",
  "Bakery & Bread": "birthday-cake",
  "Canned & Jarred": "archive",
  "Pasta, Rice & Grains": "th-large",
  "Baking & Spices": "flask",
  "Oils, Vinegar & Condiments": "eyedropper",
  "Cereal & Breakfast": "sun-o",
  "Snacks & Chips": "star",
  Beverages: "coffee",
  "Frozen Foods": "snowflake-o",
  "Paper & Plastic": "file-o",
  "Cleaning Supplies": "shower",
  "Personal Care": "heart",
  Baby: "child",
  Pet: "paw",
  Other: "ellipsis-h",
};

const CATEGORY_ORDER = [
  "Fruits & Vegetables", "Meat & Seafood", "Deli & Prepared",
  "Dairy & Eggs", "Bakery & Bread",
  "Canned & Jarred", "Pasta, Rice & Grains", "Baking & Spices",
  "Oils, Vinegar & Condiments", "Cereal & Breakfast",
  "Snacks & Chips", "Beverages", "Frozen Foods",
  "Paper & Plastic", "Cleaning Supplies", "Personal Care",
  "Baby", "Pet", "Other",
];

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [listInfo, setListInfo] = useState<ListInfo | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [suggestedCat, setSuggestedCat] = useState("Other");
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showChecked, setShowChecked] = useState(false);
  const [undoItem, setUndoItem] = useState<ListItem | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoOpacity = useRef(new Animated.Value(0)).current;

  // Favorites & previous list
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addPanelTab, setAddPanelTab] = useState<"favorites" | "previous">("favorites");
  const [otherLists, setOtherLists] = useState<{ id: string; name: string }[]>([]);
  const [selectedPrevList, setSelectedPrevList] = useState<string | null>(null);
  const [prevListItems, setPrevListItems] = useState<{ name: string; quantity: string; category: string | null }[]>([]);

  // Item detail modal
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const [list, data] = await Promise.all([getList(id!), fetchListItems(id!)]);
      setListInfo(list);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    loadUserOverrides();
    loadItems().finally(() => setLoading(false));
    getFavorites().then(setFavorites).catch(() => {});
  }, [loadItems]);

  useEffect(() => {
    const unsubscribe = subscribeToListItems(id!, (data) => {
      setItems(data.map((d: any) => ({
        ...d,
        sort_order: d.sortOrder || 0,
        quantity: d.quantity || "1",
      })));
    });
    return unsubscribe;
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  async function handleAddItem() {
    if (!newItemName.trim()) return;
    setAdding(true);
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) : 0;
    const category = getCategoryForItem(newItemName.trim());
    try {
      await addListItem(id!, {
        name: newItemName.trim(),
        quantity: newItemQty || "1",
        category,
        sort_order: maxOrder + 1,
      });
      learnCategory(newItemName.trim(), category);
    } catch (err) {
      console.error(err);
    }
    setNewItemName("");
    setNewItemQty("1");
    setSuggestedCat("Other");
    setAdding(false);
  }

  function showUndoToast(item: ListItem) {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoItem(item);
    Animated.timing(undoOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    undoTimer.current = setTimeout(() => {
      Animated.timing(undoOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setUndoItem(null);
      });
    }, 3000);
  }

  async function handleUndo() {
    if (!undoItem) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    try {
      await updateListItem(id!, undoItem.id, { checked: false, checked_by: null });
    } catch (err) {
      console.error(err);
    }
    Animated.timing(undoOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setUndoItem(null);
    });
  }

  async function toggleChecked(item: ListItem) {
    const nowChecked = !item.checked;
    const user = await getStoredUser();
    try {
      await updateListItem(id!, item.id, {
        checked: nowChecked,
        checked_by: nowChecked ? user?.id : null,
      });
    } catch (err) {
      console.error(err);
    }

    if (nowChecked) {
      showUndoToast(item);
    }
  }

  async function handleDelete(item: ListItem) {
    await deleteListItem(id!, item.id);
  }

  async function handleDeleteList() {
    const confirmed = await confirm("Delete List", `Delete "${listInfo?.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteList(id!);
      router.replace("/(tabs)/lists");
    } catch (err) {
      console.error("Delete list error:", err);
    }
  }

  async function toggleFavorite(item: ListItem) {
    const fav: FavoriteItem = { name: item.name, category: item.category || "Other" };
    const isFav = favorites.some((f) => f.name.toLowerCase() === item.name.toLowerCase());
    if (isFav) {
      await removeFavorite(fav);
      setFavorites((prev) => prev.filter((f) => f.name.toLowerCase() !== item.name.toLowerCase()));
    } else {
      await addFavorite(fav);
      setFavorites((prev) => [...prev, fav]);
    }
  }

  async function openAddPanel() {
    setShowAddPanel(true);
    setAddPanelTab("favorites");
    try {
      const lists = await getOtherLists(id!);
      setOtherLists(lists);
    } catch {}
  }

  async function loadPrevListItems(listId: string) {
    setSelectedPrevList(listId);
    try {
      const items = await getItemsFromList(listId);
      setPrevListItems(items);
    } catch {}
  }

  async function addItemFromPanel(name: string, category: string | null) {
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) : 0;
    const cat = category || getCategoryForItem(name);
    await addListItem(id!, { name, quantity: "1", category: cat, sort_order: maxOrder + 1 });
    learnCategory(name, cat);
  }

  function openItemDetail(item: ListItem) {
    setEditingItem(item);
    setEditPrice(item.price != null ? String(item.price) : "");
    setEditNote(item.note || "");
    setEditQty(item.quantity || "1");
    setEditPhotoUrl(item.photoUrl || null);
  }

  async function saveItemDetail() {
    if (!editingItem) return;
    const updates: Record<string, any> = {
      quantity: editQty || "1",
      price: editPrice ? parseFloat(editPrice) : null,
      note: editNote.trim() || null,
      photoUrl: editPhotoUrl,
    };
    await updateListItem(id!, editingItem.id, updates);
    setEditingItem(null);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      // Store as base64 data URI (for simplicity — production would use Firebase Storage)
      const asset = result.assets[0];
      if (asset.base64) {
        setEditPhotoUrl(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setEditPhotoUrl(asset.uri);
      }
    }
  }

  async function pasteItems() {
    const text = await Clipboard.getStringAsync();
    if (!text.trim()) return;

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) : 0;
    let order = maxOrder;
    for (const name of lines) {
      order++;
      const category = getCategoryForItem(name);
      await addListItem(id!, { name, quantity: "1", category, sort_order: order });
      learnCategory(name, category);
    }
  }

  async function printOrShareList() {
    const unchecked = items.filter((i) => !i.checked);
    const checked = items.filter((i) => i.checked);
    const total = unchecked.filter((i) => i.price != null).reduce((sum, i) => sum + (i.price || 0), 0);

    const rows = (arr: ListItem[]) => arr.map((i) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity !== "1" ? i.quantity : ""}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${i.price != null ? "$" + i.price.toFixed(2) : ""}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;color:#888;font-size:12px;">${i.note || ""}</td>
      </tr>`).join("");

    const html = `
      <html><body style="font-family:system-ui,sans-serif;padding:20px;max-width:600px;margin:auto;">
        <h1 style="color:#4F46E5;margin-bottom:4px;">${listInfo?.name || "Shopping List"}</h1>
        <p style="color:#888;margin-top:0;">${unchecked.length} items${total > 0 ? ` · Est. $${total.toFixed(2)}` : ""}</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:#F9FAFB;">
            <th style="padding:8px;text-align:left;">Item</th>
            <th style="padding:8px;text-align:center;">Qty</th>
            <th style="padding:8px;text-align:right;">Price</th>
            <th style="padding:8px;text-align:left;">Note</th>
          </tr>
          ${rows(unchecked)}
        </table>
        ${checked.length > 0 ? `
          <h3 style="color:#888;margin-top:24px;">Checked Off (${checked.length})</h3>
          <table style="width:100%;border-collapse:collapse;opacity:0.5;">
            ${rows(checked)}
          </table>
        ` : ""}
      </body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  }

  async function copyListToClipboard() {
    const unchecked = items.filter((i) => !i.checked);
    const text = unchecked.map((i) => {
      let line = i.name;
      if (i.quantity && i.quantity !== "1") line += ` (x${i.quantity})`;
      if (i.price != null) line += ` - $${i.price.toFixed(2)}`;
      return line;
    }).join("\n");
    await Clipboard.setStringAsync(text);
  }

  function handleNameChange(text: string) {
    setNewItemName(text);
    setSuggestedCat(getCategoryForItem(text));

    if (text.trim().length >= 2) {
      const lower = text.toLowerCase();
      const existingNames = items.map((i) => i.name.toLowerCase());
      const matches = ALL_GROCERY_ITEMS
        .filter((g) => g.toLowerCase().includes(lower) && !existingNames.includes(g.toLowerCase()))
        .slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }

  function selectSuggestion(name: string) {
    setNewItemName(name);
    setSuggestedCat(getCategoryForItem(name));
    setSuggestions([]);
  }

  // Split into unchecked (grouped by category) and checked (flat)
  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  const grouped: Record<string, ListItem[]> = {};
  uncheckedItems.forEach((item) => {
    const cat = item.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  Object.values(grouped).forEach((group) => {
    group.sort((a, b) => a.sort_order - b.sort_order);
  });

  const sections: Section[] = CATEGORY_ORDER
    .filter((cat) => grouped[cat])
    .map((cat) => ({ title: cat, data: grouped[cat] }));

  Object.keys(grouped).forEach((cat) => {
    if (!CATEGORY_ORDER.includes(cat)) {
      sections.push({ title: cat, data: grouped[cat] });
    }
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ResponsiveContainer>
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: listInfo?.name || "",
          headerShown: true,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <TouchableOpacity onPress={printOrShareList}>
                <FontAwesome name="share-square-o" size={18} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={copyListToClipboard}>
                <FontAwesome name="copy" size={18} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/list/invite?listId=${id}`)}>
                <FontAwesome name="user-plus" size={18} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteList}>
                <FontAwesome name="trash-o" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Price total banner */}
      {(() => {
        const total = items.filter((i) => !i.checked && i.price != null).reduce((sum, i) => sum + (i.price || 0), 0);
        const checkedTotal = items.filter((i) => i.checked && i.price != null).reduce((sum, i) => sum + (i.price || 0), 0);
        if (total > 0 || checkedTotal > 0) {
          return (
            <View className="flex-row items-center justify-between px-4 py-2 bg-indigo-50 border-b border-indigo-100">
              <View className="flex-row items-center">
                <FontAwesome name="tag" size={12} color="#4F46E5" />
                <Text className="text-sm font-semibold text-primary ml-1.5">
                  Est. Total: ${total.toFixed(2)}
                </Text>
              </View>
              {checkedTotal > 0 && (
                <Text className="text-xs text-secondary">
                  Checked: ${checkedTotal.toFixed(2)}
                </Text>
              )}
            </View>
          );
        }
        return null;
      })()}

      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <FontAwesome name="shopping-cart" size={48} color="#D1D5DB" />
          <Text className="text-lg font-bold text-textPrimary mt-4">No items yet</Text>
          <Text className="text-textSecondary mt-1">Add your first item below</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pt-2 pb-40"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center mt-4 mb-2">
              <FontAwesome
                name={(CATEGORY_ICONS[section.title] || "tag") as any}
                size={14}
                color="#4F46E5"
              />
              <Text className="text-sm font-semibold text-primary ml-2 uppercase tracking-wide">
                {section.title}
              </Text>
              <Text className="text-xs text-textSecondary ml-2">
                ({section.data.length})
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isFav = favorites.some((f) => f.name.toLowerCase() === item.name.toLowerCase());
            return (
              <SwipeToDelete onDelete={() => handleDelete(item)}>
                <TouchableOpacity
                  className="flex-row items-center bg-card rounded-xl p-3.5 mb-2 border border-gray-100"
                  onPress={() => toggleChecked(item)}
                  onLongPress={() => openItemDetail(item)}
                  activeOpacity={0.7}
                >
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={{ width: 28, height: 28, borderRadius: 6, marginRight: 10 }} />
                  ) : (
                    <View className="w-6 h-6 rounded-full border-2 border-gray-300 items-center justify-center mr-3" />
                  )}
                  <View className="flex-1">
                    <Text className="text-base text-textPrimary">{item.name}</Text>
                    <View className="flex-row items-center mt-0.5 gap-2">
                      {item.quantity && item.quantity !== "1" && (
                        <Text className="text-xs text-textSecondary">x{item.quantity}</Text>
                      )}
                      {item.price != null && (
                        <Text className="text-xs text-secondary font-medium">${item.price.toFixed(2)}</Text>
                      )}
                      {item.note && (
                        <Text className="text-xs text-textSecondary italic" numberOfLines={1}>{item.note}</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => toggleFavorite(item)} className="p-1.5">
                    <FontAwesome name={isFav ? "star" : "star-o"} size={18} color={isFav ? "#F59E0B" : "#D1D5DB"} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </SwipeToDelete>
            );
          }}
          ListFooterComponent={checkedItems.length > 0 ? (
            <View className="mt-6">
              <TouchableOpacity
                className="flex-row items-center py-2 mb-2"
                onPress={() => setShowChecked(!showChecked)}
                activeOpacity={0.7}
              >
                <FontAwesome
                  name={showChecked ? "chevron-down" : "chevron-right"}
                  size={12}
                  color="#6B7280"
                />
                <Text className="text-sm font-semibold text-textSecondary ml-2">
                  Checked off ({checkedItems.length})
                </Text>
              </TouchableOpacity>
              {showChecked && checkedItems.map((item) => (
                <SwipeToDelete key={item.id} onDelete={() => handleDelete(item)}>
                  <TouchableOpacity
                    className="flex-row items-center bg-card rounded-xl p-3.5 mb-2 border border-gray-100 opacity-60"
                    onPress={() => toggleChecked(item)}
                    activeOpacity={0.7}
                  >
                    <View className="w-6 h-6 rounded-full border-2 bg-secondary border-secondary items-center justify-center mr-3">
                      <FontAwesome name="check" size={12} color="#fff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base text-textSecondary line-through">{item.name}</Text>
                      {item.quantity && item.quantity !== "1" && (
                        <Text className="text-xs text-textSecondary mt-0.5">Qty: {item.quantity}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </SwipeToDelete>
              ))}
            </View>
          ) : null}
        />
      )}

      {/* Undo toast */}
      {undoItem && (
        <Animated.View
          style={{
            opacity: undoOpacity,
            position: "absolute",
            bottom: 120,
            left: 16,
            right: 16,
            backgroundColor: "#1F2937",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            zIndex: 50,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <FontAwesome name="check-circle" size={16} color="#10B981" />
          <Text style={{ color: "#fff", marginLeft: 8, flex: 1 }} numberOfLines={1}>
            "{undoItem.name}" checked off
          </Text>
          <TouchableOpacity onPress={handleUndo} activeOpacity={0.8}>
            <Text style={{ color: "#FBBF24", fontWeight: "bold", fontSize: 14 }}>UNDO</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View className="absolute bottom-0 left-0 right-0">
        {/* Add Panel — Favorites & Previous Lists */}
        {showAddPanel && (
          <View className="bg-card border border-gray-200 rounded-t-xl mx-0 max-h-72">
            {/* Tabs */}
            <View className="flex-row border-b border-gray-200">
              <TouchableOpacity
                className={`flex-1 py-3 items-center ${addPanelTab === "favorites" ? "border-b-2 border-primary" : ""}`}
                onPress={() => setAddPanelTab("favorites")}
              >
                <View className="flex-row items-center">
                  <FontAwesome name="star" size={14} color={addPanelTab === "favorites" ? "#4F46E5" : "#6B7280"} />
                  <Text className={`ml-1.5 text-sm font-medium ${addPanelTab === "favorites" ? "text-primary" : "text-textSecondary"}`}>
                    Favorites
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 items-center ${addPanelTab === "previous" ? "border-b-2 border-primary" : ""}`}
                onPress={() => setAddPanelTab("previous")}
              >
                <View className="flex-row items-center">
                  <FontAwesome name="history" size={14} color={addPanelTab === "previous" ? "#4F46E5" : "#6B7280"} />
                  <Text className={`ml-1.5 text-sm font-medium ${addPanelTab === "previous" ? "text-primary" : "text-textSecondary"}`}>
                    Previous Lists
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-52 px-4 py-2">
              {addPanelTab === "favorites" ? (
                favorites.length === 0 ? (
                  <Text className="text-textSecondary text-center py-6">
                    No favorites yet. Tap the star on any item to save it.
                  </Text>
                ) : (
                  favorites.map((fav, i) => {
                    const alreadyAdded = items.some((it) => it.name.toLowerCase() === fav.name.toLowerCase() && !it.checked);
                    return (
                      <TouchableOpacity
                        key={`${fav.name}-${i}`}
                        className={`flex-row items-center py-2.5 ${i < favorites.length - 1 ? "border-b border-gray-100" : ""}`}
                        onPress={() => {
                          if (!alreadyAdded) addItemFromPanel(fav.name, fav.category);
                        }}
                        disabled={alreadyAdded}
                        activeOpacity={0.7}
                      >
                        <FontAwesome name="star" size={14} color="#F59E0B" />
                        <Text className={`ml-2 flex-1 ${alreadyAdded ? "text-gray-300" : "text-textPrimary"}`}>{fav.name}</Text>
                        <Text className="text-xs text-textSecondary">{fav.category}</Text>
                        {alreadyAdded && <Text className="text-xs text-gray-300 ml-2">added</Text>}
                      </TouchableOpacity>
                    );
                  })
                )
              ) : (
                <>
                  {/* List selector */}
                  {otherLists.length === 0 ? (
                    <Text className="text-textSecondary text-center py-6">
                      No other lists found.
                    </Text>
                  ) : (
                    <>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                        <View className="flex-row gap-2">
                          {otherLists.map((list) => (
                            <TouchableOpacity
                              key={list.id}
                              className={`px-3 py-1.5 rounded-full ${selectedPrevList === list.id ? "bg-primary" : "bg-gray-200"}`}
                              onPress={() => loadPrevListItems(list.id)}
                            >
                              <Text className={`text-sm ${selectedPrevList === list.id ? "text-white font-medium" : "text-textSecondary"}`}>{list.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>

                      {prevListItems.length === 0 && selectedPrevList && (
                        <Text className="text-textSecondary text-center py-4">No items in this list.</Text>
                      )}

                      {prevListItems.map((pItem, i) => {
                        const alreadyAdded = items.some((it) => it.name.toLowerCase() === pItem.name.toLowerCase() && !it.checked);
                        return (
                          <TouchableOpacity
                            key={`${pItem.name}-${i}`}
                            className={`flex-row items-center py-2.5 ${i < prevListItems.length - 1 ? "border-b border-gray-100" : ""}`}
                            onPress={() => {
                              if (!alreadyAdded) addItemFromPanel(pItem.name, pItem.category);
                            }}
                            disabled={alreadyAdded}
                            activeOpacity={0.7}
                          >
                            <FontAwesome name={(CATEGORY_ICONS[pItem.category || "Other"] || "tag") as any} size={12} color="#6B7280" />
                            <Text className={`ml-2 flex-1 ${alreadyAdded ? "text-gray-300" : "text-textPrimary"}`}>{pItem.name}</Text>
                            {pItem.quantity !== "1" && <Text className="text-xs text-textSecondary mr-2">x{pItem.quantity}</Text>}
                            {alreadyAdded && <Text className="text-xs text-gray-300">added</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        )}

        {/* Autocomplete suggestions */}
        {!showAddPanel && suggestions.length > 0 && (
          <View className="bg-card border border-gray-200 rounded-t-xl mx-4 overflow-hidden">
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={s}
                className={`flex-row items-center px-4 py-2.5 ${i < suggestions.length - 1 ? "border-b border-gray-100" : ""}`}
                onPress={() => selectSuggestion(s)}
                activeOpacity={0.7}
              >
                <FontAwesome name={(CATEGORY_ICONS[getCategoryForItem(s)] || "tag") as any} size={12} color="#6B7280" />
                <Text className="text-textPrimary ml-2 flex-1">{s}</Text>
                <Text className="text-xs text-textSecondary">{getCategoryForItem(s)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="bg-card border-t border-gray-200 px-4 pt-2 pb-8">
          {/* Quick add buttons — show when not typing and panel is closed */}
          {!newItemName.trim() && !showAddPanel && (
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-amber-50 border border-amber-200 rounded-lg py-2"
                onPress={() => { setShowAddPanel(true); setAddPanelTab("favorites"); }}
              >
                <FontAwesome name="star" size={14} color="#F59E0B" />
                <Text className="text-amber-700 text-sm font-medium ml-1.5">Favorites</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-indigo-50 border border-indigo-200 rounded-lg py-2"
                onPress={() => openAddPanel()}
              >
                <FontAwesome name="history" size={14} color="#4F46E5" />
                <Text className="text-primary text-sm font-medium ml-1.5">Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center justify-center bg-green-50 border border-green-200 rounded-lg py-2 px-3"
                onPress={pasteItems}
              >
                <FontAwesome name="clipboard" size={14} color="#10B981" />
                <Text className="text-green-700 text-sm font-medium ml-1.5">Paste</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Category hint when typing */}
          {newItemName.trim() ? (
            <View className="flex-row items-center mb-1.5">
              <FontAwesome name={(CATEGORY_ICONS[suggestedCat] || "tag") as any} size={12} color="#4F46E5" />
              <Text className="text-xs text-primary font-medium ml-1">{suggestedCat}</Text>
            </View>
          ) : null}
          {/* Close panel button */}
          {showAddPanel && (
            <TouchableOpacity
              className="flex-row items-center justify-center mb-2"
              onPress={() => setShowAddPanel(false)}
            >
              <FontAwesome name="chevron-down" size={12} color="#6B7280" />
              <Text className="text-textSecondary text-xs ml-1">Close</Text>
            </TouchableOpacity>
          )}
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 bg-background border border-gray-200 rounded-lg px-3 py-2.5 text-textPrimary"
              placeholder="Add item..."
              placeholderTextColor="#9CA3AF"
              value={newItemName}
              onChangeText={(t) => { setShowAddPanel(false); handleNameChange(t); }}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <TextInput className="w-14 bg-background border border-gray-200 rounded-lg px-2 py-2.5 text-textPrimary text-center" placeholder="Qty" placeholderTextColor="#9CA3AF" value={newItemQty} onChangeText={setNewItemQty} keyboardType="numeric" />
            <TouchableOpacity className="bg-primary rounded-lg p-2.5" onPress={handleAddItem} disabled={adding || !newItemName.trim()} activeOpacity={0.8}>
              {adding ? <ActivityIndicator color="#fff" size="small" /> : <FontAwesome name="plus" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Item detail modal */}
      <Modal visible={!!editingItem} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setEditingItem(null)}
          />
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>
                {editingItem?.name}
              </Text>
              <TouchableOpacity onPress={() => setEditingItem(null)}>
                <FontAwesome name="times" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Photo */}
            <TouchableOpacity
              onPress={pickImage}
              style={{
                width: "100%", height: 120, borderRadius: 12,
                backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB", borderStyle: "dashed",
                alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden",
              }}
            >
              {editPhotoUrl ? (
                <Image source={{ uri: editPhotoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <FontAwesome name="camera" size={24} color="#9CA3AF" />
                  <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Quantity & Price row */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "500", color: "#111827", marginBottom: 4 }}>Quantity</Text>
                <TextInput
                  style={{ backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: "#111827" }}
                  value={editQty}
                  onChangeText={setEditQty}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "500", color: "#111827", marginBottom: 4 }}>Price ($)</Text>
                <TextInput
                  style={{ backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: "#111827" }}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Note */}
            <Text style={{ fontSize: 12, fontWeight: "500", color: "#111827", marginBottom: 4 }}>Note</Text>
            <TextInput
              style={{
                backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8,
                paddingHorizontal: 12, paddingVertical: 10, color: "#111827", marginBottom: 16, minHeight: 60,
              }}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Add a note..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />

            {/* Save */}
            <TouchableOpacity
              onPress={saveItemDetail}
              style={{ backgroundColor: "#4F46E5", borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
    </ResponsiveContainer>
  );
}
