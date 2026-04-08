import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { getMe, updateProfile, updateSettings, signOut, UserSettings } from "@/lib/api";

const STRIKE_STYLES: { value: UserSettings["strikeStyle"]; label: string; desc: string }[] = [
  { value: "strikethrough", label: "Strikethrough", desc: "Line through the text" },
  { value: "fade", label: "Fade Out", desc: "Dim the item to gray" },
  { value: "checkmark", label: "Checkmark Only", desc: "Green check, no text change" },
  { value: "hide", label: "Hide", desc: "Remove checked items from view" },
];

const MEASUREMENT_OPTIONS: { value: UserSettings["measurementSystem"]; label: string; units: string }[] = [
  { value: "imperial", label: "Imperial", units: "oz, lb, gal, fl oz" },
  { value: "metric", label: "Metric", units: "g, kg, ml, L" },
];

const QTY_UNITS_IMPERIAL = ["", "oz", "lb", "gal", "fl oz", "ct", "pkg", "bunch"];
const QTY_UNITS_METRIC = ["", "g", "kg", "ml", "L", "ct", "pkg", "bunch"];

export default function ProfileScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [settings, setSettings] = useState<UserSettings>({
    measurementSystem: "imperial",
    strikeStyle: "strikethrough",
    defaultQtyUnit: "",
    sortCheckedToBottom: true,
    confirmBeforeDelete: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const user = await getMe();
        setDisplayName(user.display_name);
        setEmail(user.email);
        setSettings(user.settings);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile(displayName.trim());
      setEdited(false);
      Alert.alert("Saved", "Display name updated.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
    setSaving(false);
  }

  async function handleSettingChange(key: keyof UserSettings, value: any) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await updateSettings({ [key]: value });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const qtyUnits = settings.measurementSystem === "metric" ? QTY_UNITS_METRIC : QTY_UNITS_IMPERIAL;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pt-6 pb-16">
      {/* Profile */}
      <View className="items-center mb-6">
        <View className="w-20 h-20 rounded-full bg-indigo-100 items-center justify-center mb-3">
          <FontAwesome name="user" size={36} color="#4F46E5" />
        </View>
        <Text className="text-lg font-bold text-textPrimary">{displayName || "User"}</Text>
        <Text className="text-sm text-textSecondary">{email}</Text>
      </View>

      <Text className="text-sm font-medium text-textPrimary mb-1">Display Name</Text>
      <TextInput
        className="bg-card border border-gray-200 rounded-lg px-4 py-3 mb-2 text-textPrimary"
        value={displayName}
        onChangeText={(t) => { setDisplayName(t); setEdited(true); }}
      />
      {edited && (
        <TouchableOpacity className="bg-primary rounded-lg py-3 items-center mb-4" onPress={handleSaveProfile} disabled={saving} activeOpacity={0.8}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Save Name</Text>}
        </TouchableOpacity>
      )}

      {/* Measurement System */}
      <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wide mt-6 mb-3">
        Measurement System
      </Text>
      <View className="bg-card rounded-xl border border-gray-100 overflow-hidden mb-4">
        {MEASUREMENT_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.value}
            className={`flex-row items-center px-4 py-3.5 ${i < MEASUREMENT_OPTIONS.length - 1 ? "border-b border-gray-100" : ""}`}
            onPress={() => handleSettingChange("measurementSystem", opt.value)}
            activeOpacity={0.7}
          >
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${settings.measurementSystem === opt.value ? "bg-primary border-primary" : "border-gray-300"}`}>
              {settings.measurementSystem === opt.value && <View className="w-2 h-2 rounded-full bg-white" />}
            </View>
            <View className="flex-1">
              <Text className="text-base text-textPrimary">{opt.label}</Text>
              <Text className="text-xs text-textSecondary">{opt.units}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Default Quantity Unit */}
      <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">
        Default Quantity Unit
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {qtyUnits.map((unit) => (
          <TouchableOpacity
            key={unit}
            className={`px-3.5 py-2 rounded-full ${settings.defaultQtyUnit === unit ? "bg-primary" : "bg-gray-200"}`}
            onPress={() => handleSettingChange("defaultQtyUnit", unit)}
          >
            <Text className={`text-sm ${settings.defaultQtyUnit === unit ? "text-white font-medium" : "text-textSecondary"}`}>
              {unit || "None"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Checked Item Style */}
      <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wide mt-2 mb-3">
        Checked Item Style
      </Text>
      <View className="bg-card rounded-xl border border-gray-100 overflow-hidden mb-4">
        {STRIKE_STYLES.map((style, i) => (
          <TouchableOpacity
            key={style.value}
            className={`flex-row items-center px-4 py-3.5 ${i < STRIKE_STYLES.length - 1 ? "border-b border-gray-100" : ""}`}
            onPress={() => handleSettingChange("strikeStyle", style.value)}
            activeOpacity={0.7}
          >
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${settings.strikeStyle === style.value ? "bg-primary border-primary" : "border-gray-300"}`}>
              {settings.strikeStyle === style.value && <View className="w-2 h-2 rounded-full bg-white" />}
            </View>
            <View className="flex-1">
              <Text className="text-base text-textPrimary">{style.label}</Text>
              <Text className="text-xs text-textSecondary">{style.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toggles */}
      <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wide mt-2 mb-3">
        List Behavior
      </Text>
      <View className="bg-card rounded-xl border border-gray-100 overflow-hidden mb-6">
        <View className="flex-row items-center px-4 py-3.5 border-b border-gray-100">
          <View className="flex-1">
            <Text className="text-base text-textPrimary">Move checked to bottom</Text>
            <Text className="text-xs text-textSecondary">Checked items sink below unchecked</Text>
          </View>
          <Switch
            value={settings.sortCheckedToBottom}
            onValueChange={(v) => handleSettingChange("sortCheckedToBottom", v)}
            trackColor={{ true: "#4F46E5", false: "#D1D5DB" }}
          />
        </View>
        <View className="flex-row items-center px-4 py-3.5">
          <View className="flex-1">
            <Text className="text-base text-textPrimary">Confirm before delete</Text>
            <Text className="text-xs text-textSecondary">Show alert when swiping to delete</Text>
          </View>
          <Switch
            value={settings.confirmBeforeDelete}
            onValueChange={(v) => handleSettingChange("confirmBeforeDelete", v)}
            trackColor={{ true: "#4F46E5", false: "#D1D5DB" }}
          />
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity className="border border-danger rounded-lg py-3.5 items-center" onPress={handleSignOut} activeOpacity={0.8}>
        <Text className="text-danger font-semibold text-base">Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
