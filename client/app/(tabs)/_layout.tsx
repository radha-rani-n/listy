import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#6B7280",
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="lists"
        options={{
          title: "Lists",
          tabBarIcon: ({ color }) => <TabBarIcon name="list-ul" color={color} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: "Pantry",
          tabBarIcon: ({ color }) => <TabBarIcon name="archive" color={color} />,
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: "Meals",
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
