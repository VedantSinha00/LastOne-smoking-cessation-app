import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { SosFab } from "../../components/sos/sos-fab";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zinc-950">
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: "#09090b",
            borderTopColor: "#18181b",
            height: 64,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: "#f59e0b", // Amber brand color
          tabBarInactiveTintColor: "#71717a",
          headerStyle: {
            backgroundColor: "#09090b",
            borderBottomColor: "#18181b",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>🏠</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="log-dummy"
          options={{
            title: "Log",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>📝</Text>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              // Intercept the tab tap event and trigger the modal routing instead
              e.preventDefault();
              router.push("/(modals)/log");
            },
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>📈</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>👤</Text>
            ),
          }}
        />
      </Tabs>
      
      {/* Floating Action Button (FAB) overlay for SOS cope tools */}
      <SosFab />
    </View>
  );
}
