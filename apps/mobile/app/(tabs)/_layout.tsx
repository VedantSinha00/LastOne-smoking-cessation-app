import { Tabs } from "expo-router";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, BarChart3, Heart, User, Plus } from "lucide-react-native";
import { SosFab } from "../../components/sos/sos-fab";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

/**
 * Bottom navigation. Visual design follows the Lovable "Remix of LastOne Home
 * Screen" nav (light bar, hairline top border, lucide line icons, raised
 * near-black center button). Structure follows the code/spec:
 *
 *   Home · Insights · [ + Log ] · Tools · Profile
 *
 * - Home / Insights / Tools / Profile are real screens. Insights (INS-1) is its
 *   own route — the self-awareness feed (Insights Spec: "the entry point from all
 *   navigation"), distinct from the Progress Dashboard (motivation). Progress
 *   (DASH-2) is reached contextually from Home's counter / health cards via
 *   `/progress`; it is not a tab (no slot, and the two surfaces are intentionally
 *   separate — Insights Spec §1.1).
 * - The center control is the Log action (Architecture Guide §lines 25–27: Log is
 *   a central FAB), opening the log half-sheet rather than navigating to a tab.
 * - SOS is a separate persistent floating FAB (Architecture Guide §8.5).
 * - Community is intentionally absent — it is V2 (Home Spec §P5, line 147).
 */
const ACTIVE = "#15110D"; // foreground
const INACTIVE = "#76706C"; // muted-foreground

type TabDef = { name: string; label: string; Icon: typeof Home };

// Two slots left of the center "+", two to the right.
const LEFT: TabDef[] = [
  { name: "index", label: "Home", Icon: Home },
  { name: "insights", label: "Insights", Icon: BarChart3 },
];
const RIGHT: TabDef[] = [
  { name: "tools", label: "Tools", Icon: Heart },
  { name: "profile", label: "Profile", Icon: User },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderTab = ({ name, label, Icon }: TabDef) => {
    const route = state.routes.find((r) => r.name === name);
    const isFocused = route ? state.index === state.routes.indexOf(route) : false;
    return (
      <Pressable
        key={name}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => navigation.navigate(name)}
        className="flex-1 h-full items-center justify-center"
      >
        <Icon
          size={24}
          color={isFocused ? ACTIVE : INACTIVE}
          strokeWidth={isFocused ? 2.4 : 1.9}
        />
      </Pressable>
    );
  };

  return (
    <View
      className="flex-row items-center bg-background border-t border-border"
      style={{ height: 62 + insets.bottom, paddingBottom: insets.bottom }}
    >
      {LEFT.map(renderTab)}

      {/* Raised center Log button (Lovable's near-black "+"). Opens the log sheet. */}
      <View className="items-center justify-center" style={{ width: 72 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log"
          onPress={() => router.push("/(modals)/log")}
          className="w-14 h-14 rounded-full bg-foreground items-center justify-center active:scale-95"
          style={{
            marginTop: -28,
            shadowColor: "#15110D",
            shadowOpacity: 0.2,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Plus size={26} color="#FBFAF9" strokeWidth={2.5} />
        </Pressable>
      </View>

      {RIGHT.map(renderTab)}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View className="flex-1 bg-background">
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: "#FFFFFF", // card
            borderBottomColor: "#E9E7E5", // border
          },
          headerTintColor: "#15110D", // foreground
          headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="insights" options={{ title: "Insights" }} />
        <Tabs.Screen name="tools" options={{ title: "Tools" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        {/* Progress Dashboard (DASH-2) — reachable from Home's counter/health cards
            via /progress, not a tab (Insights took the slot; surfaces are distinct). */}
        <Tabs.Screen name="progress" options={{ href: null, title: "Progress" }} />
        {/* No-op slot intercepted by the center Log button; never shown as a tab. */}
        <Tabs.Screen name="log-dummy" options={{ href: null }} />
      </Tabs>

      {/* SOS — persistent floating FAB on every main screen (Architecture Guide §8.5). */}
      <SosFab />
    </View>
  );
}
