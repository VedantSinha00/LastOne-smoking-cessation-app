const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve packages from the monorepo node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Force Metro to resolve relative paths in packages/shared
config.resolver.disableHierarchicalLookup = true;

// 4. With hierarchical lookup disabled, packages that require a dependency
// *internally* (e.g. @expo-google-fonts/* → "expo-font") can't walk up the tree
// to find it. Map those shared deps explicitly so they resolve from anywhere.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "expo-font": path.resolve(workspaceRoot, "node_modules/expo-font"),
  "expo-splash-screen": path.resolve(workspaceRoot, "node_modules/expo-splash-screen"),
  // lucide-react-native requires react-native-svg internally; both hoist to the
  // workspace root, so map them explicitly (hierarchical lookup is disabled above).
  "react-native-svg": path.resolve(workspaceRoot, "node_modules/react-native-svg"),
  "lucide-react-native": path.resolve(workspaceRoot, "node_modules/lucide-react-native"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
