import { Tabs } from "expo-router";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, BarChart3, Heart, Plus, Users } from "lucide-react-native";
import { SosFab } from "../../components/sos/sos-fab";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

/**
 * Bottom navigation. Visual design follows the Lovable "Remix of LastOne Home
 * Screen" nav (light bar, hairline top border, lucide line icons, raised
 * near-black center button). Five slots, matching the design's layout:
 *
 *   Home · Community · [ + Log ] · Insights · Tools
 *
 * - Home / Insights / Tools are tab screens. Insights (INS-1) is its own route —
 *   the self-awareness feed (Insights Spec: "the entry point from all
 *   navigation"), distinct from the Progress Dashboard (motivation). Progress
 *   (DASH-2) is reached contextually from Home's counter / health cards via
 *   `/progress`; it is not a tab (no slot, and the two surfaces are intentionally
 *   separate — Insights Spec §1.1).
 * - Community occupies the design's slot 2 but is V2 (Home Spec §P5) — it is a
 *   real tab that opens a "coming soon" page (app/(tabs)/community.tsx), matching
 *   the design's five-slot layout without shipping the feature.
 * - Profile is NOT a tab — it is reached via the Home TopBar profile icon
 *   (design nav model).
 * - The center control is the Log action (Architecture Guide §lines 25–27: Log is
 *   a central FAB), opening the log half-sheet rather than navigating to a tab.
 * - SOS is a separate persistent floating FAB (Architecture Guide §8.5).
 */
const ACTIVE = "#15110D"; // foreground
const INACTIVE = "#76706C"; // muted-foreground

type TabDef = { name: string; label: string; Icon: typeof Home };

// Five slots around the center "+", mirroring the design: two left, two right.
// Community is a real tab (opens a "coming soon" page) — see header note.
const LEFT: TabDef[] = [
  { name: "index", label: "Home", Icon: Home },
  { name: "community", label: "Community", Icon: Users },
];
const RIGHT: TabDef[] = [
  { name: "insights", label: "Insights", Icon: BarChart3 },
  { name: "tools", label: "Tools", Icon: Heart },
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
            marginTop: -32, // design raises the center button -mt-8 (32px)
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
        {/* Home renders the custom Lovable TopBar in-body, so the native header
            is hidden here (avoids a double header). */}
        <Tabs.Screen name="index" options={{ title: "Home", headerShown: false }} />
        {/* Community (V2) — real tab opening a "coming soon" page (design slot 2). */}
        <Tabs.Screen name="community" options={{ title: "Community" }} />
        <Tabs.Screen name="insights" options={{ title: "Insights" }} />
        <Tabs.Screen name="tools" options={{ title: "Tools" }} />
        {/* Profile — reached via the Home TopBar icon (design nav model), not a
            tab. Kept as a route with href: null so navigation still resolves. */}
        <Tabs.Screen name="profile" options={{ href: null, title: "Profile" }} />
        {/* Progress Dashboard (DASH-2) — reachable from Home's counter/health cards
            via /progress, not a tab (Insights took the slot; surfaces are distinct).
            Renders its own in-body header (back + title), so the native one is hidden. */}
        <Tabs.Screen name="progress" options={{ href: null, title: "Progress", headerShown: false }} />
        {/* No-op slot intercepted by the center Log button; never shown as a tab. */}
        <Tabs.Screen name="log-dummy" options={{ href: null }} />
      </Tabs>

      {/* SOS — persistent floating FAB on every main screen (Architecture Guide §8.5). */}
      <SosFab />
    </View>
  );
}
