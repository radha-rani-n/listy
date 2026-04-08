import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCATION_TASK = "LISTY_LOCATION_TASK";
const REMINDERS_KEY = "listy_location_reminders";

export type LocationReminder = {
  id: string;
  storeName: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  listId: string;
  listName: string;
};

export async function getReminders(): Promise<LocationReminder[]> {
  const json = await AsyncStorage.getItem(REMINDERS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveReminder(reminder: LocationReminder): Promise<void> {
  const reminders = await getReminders();
  reminders.push(reminder);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  await startGeofencing();
}

export async function removeReminder(id: string): Promise<void> {
  const reminders = await getReminders();
  const filtered = reminders.filter((r) => r.id !== id);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered));
  if (filtered.length === 0) {
    await stopGeofencing();
  } else {
    await startGeofencing();
  }
}

export async function startGeofencing(): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") return;

  const reminders = await getReminders();
  if (reminders.length === 0) return;

  const regions = reminders.map((r) => ({
    identifier: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    radius: r.radius,
    notifyOnEnter: true,
    notifyOnExit: false,
  }));

  await Location.startGeofencingAsync(LOCATION_TASK, regions);
}

export async function stopGeofencing(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
  if (isRegistered) {
    await Location.stopGeofencingAsync(LOCATION_TASK);
  }
}

// Background task — triggered when entering a geofence
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error("Geofence error:", error);
    return;
  }

  if (data?.eventType === Location.GeofencingEventType.Enter) {
    const regionId = data.region?.identifier;
    if (!regionId) return;

    const reminders = await getReminders();
    const reminder = reminders.find((r) => r.id === regionId);
    if (!reminder) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Near ${reminder.storeName}`,
        body: `Don't forget your "${reminder.listName}" shopping list!`,
      },
      trigger: null,
    });
  }
});
